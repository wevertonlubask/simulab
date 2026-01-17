"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!["DOCENTE", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = parseInt(searchParams.get("periodo") || "30");
    const turmaId = searchParams.get("turmaId");
    const simuladoId = searchParams.get("simuladoId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo);

    // Build where clause for docente's simulados
    const simuladoWhere: Record<string, unknown> = {};
    if (session.user.role !== "SUPERADMIN") {
      simuladoWhere.docenteId = session.user.id;
    }
    if (simuladoId) {
      simuladoWhere.id = simuladoId;
    }

    // Get docente's simulados
    const simulados = await db.simulado.findMany({
      where: simuladoWhere,
      select: { id: true },
    });
    const simuladoIds = simulados.map((s) => s.id);

    // Get provas from these simulados
    const provas = await db.prova.findMany({
      where: {
        simuladoId: { in: simuladoIds },
      },
      select: { id: true, notaMinima: true },
    });
    const provaIds = provas.map((p) => p.id);
    const provaNotaMinima = new Map(provas.map((p) => [p.id, p.notaMinima]));

    // Build tentativa where clause
    const tentativaWhere: Record<string, unknown> = {
      provaId: { in: provaIds },
      status: "SUBMETIDA",
      dataFim: { gte: dataInicio },
    };

    // If filtering by turma, get alunos from that turma
    if (turmaId) {
      const turmaAlunos = await db.turmaAluno.findMany({
        where: { turmaId },
        select: { alunoId: true },
      });
      const alunoIds = turmaAlunos.map((ta) => ta.alunoId);
      tentativaWhere.alunoId = { in: alunoIds };
    }

    // Get all tentativas grouped by student
    const tentativas = await db.tentativa.findMany({
      where: tentativaWhere,
      select: {
        nota: true,
        provaId: true,
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Group by student
    const alunoStats = new Map<
      string,
      {
        id: string;
        nome: string;
        email: string;
        avatar: string | null;
        somaNotas: number;
        totalProvas: number;
        aprovados: number;
      }
    >();

    tentativas.forEach((t) => {
      const stats = alunoStats.get(t.aluno.id) || {
        id: t.aluno.id,
        nome: t.aluno.nome || "",
        email: t.aluno.email || "",
        avatar: t.aluno.avatar,
        somaNotas: 0,
        totalProvas: 0,
        aprovados: 0,
      };
      stats.somaNotas += t.nota || 0;
      stats.totalProvas++;
      const notaMinima = provaNotaMinima.get(t.provaId) || 70;
      if ((t.nota || 0) >= notaMinima) stats.aprovados++;
      alunoStats.set(t.aluno.id, stats);
    });

    // Convert to array and calculate metrics
    let ranking = Array.from(alunoStats.values())
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        email: a.email,
        avatar: a.avatar,
        notaMedia: Math.round(a.somaNotas / a.totalProvas),
        totalProvas: a.totalProvas,
        taxaAprovacao: Math.round((a.aprovados / a.totalProvas) * 100),
      }))
      .sort((a, b) => b.notaMedia - a.notaMedia);

    // Apply search filter
    if (search) {
      ranking = ranking.filter(
        (a) =>
          a.nome.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Add position
    ranking = ranking.map((a, i) => ({
      ...a,
      posicao: i + 1,
    }));

    const total = ranking.length;

    // Paginate
    const skip = (page - 1) * limit;
    const paginatedRanking = ranking.slice(skip, skip + limit);

    return NextResponse.json({
      alunos: paginatedRanking,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
