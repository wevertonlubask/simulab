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
      select: { id: true },
    });
    const provaIds = provas.map((p) => p.id);

    // Get turmas with this docente's provas
    const turmaProvas = await db.turmaProva.findMany({
      where: {
        provaId: { in: provaIds },
        ...(turmaId && { turmaId }),
      },
      select: { turmaId: true },
    });
    const turmaIds = Array.from(new Set(turmaProvas.map((tp) => tp.turmaId)));

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

    // Count active students (with at least 1 tentativa in the period)
    const alunosAtivos = await db.tentativa.groupBy({
      by: ["alunoId"],
      where: tentativaWhere,
    });

    // Count tentativas realized in the period
    const provasRealizadas = await db.tentativa.count({
      where: tentativaWhere,
    });

    // Get all tentativas for stats
    const tentativas = await db.tentativa.findMany({
      where: tentativaWhere,
      select: {
        nota: true,
        prova: {
          select: {
            notaMinima: true,
          },
        },
      },
    });

    const mediaGeral =
      tentativas.length > 0
        ? Math.round(
            tentativas.reduce((acc, t) => acc + (t.nota || 0), 0) / tentativas.length
          )
        : 0;

    const aprovados = tentativas.filter(
      (t) => (t.nota || 0) >= t.prova.notaMinima
    ).length;
    const taxaAprovacao =
      tentativas.length > 0 ? Math.round((aprovados / tentativas.length) * 100) : 0;

    return NextResponse.json({
      alunosAtivos: alunosAtivos.length,
      provasRealizadas,
      mediaGeral,
      taxaAprovacao,
      turmaIds,
    });
  } catch (error) {
    console.error("Erro ao buscar resumo docente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
