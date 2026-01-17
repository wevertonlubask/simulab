"use server";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!["DOCENTE", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Build where clause for docente's simulados
    const simuladoWhere: Record<string, unknown> = {};
    if (session.user.role !== "SUPERADMIN") {
      simuladoWhere.docenteId = session.user.id;
    }

    // Get docente's simulados
    const simulados = await db.simulado.findMany({
      where: simuladoWhere,
      select: { id: true, nome: true, status: true },
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

    // Get turmas with these provas via TurmaProva
    const turmaProvas = await db.turmaProva.findMany({
      where: {
        provaId: { in: provaIds },
      },
      select: { turmaId: true },
    });
    const turmaIds = Array.from(new Set(turmaProvas.map((tp) => tp.turmaId)));

    // 1. Count inactive students (no tentativa in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all students in turmas
    const turmaAlunos = await db.turmaAluno.findMany({
      where: {
        turmaId: { in: turmaIds },
      },
      select: {
        alunoId: true,
        aluno: {
          select: {
            nome: true,
          },
        },
      },
    });

    // Get students with recent tentativas
    const alunosAtivos = await db.tentativa.findMany({
      where: {
        provaId: { in: provaIds },
        status: "SUBMETIDA",
        dataFim: { gte: sevenDaysAgo },
      },
      select: { alunoId: true },
      distinct: ["alunoId"],
    });
    const alunosAtivosIds = new Set(alunosAtivos.map((a) => a.alunoId));

    const alunosInativos = turmaAlunos.filter(
      (ta) => !alunosAtivosIds.has(ta.alunoId)
    );

    // 2. Provas with low approval rate (< 30%)
    const tentativasPorProva = await db.tentativa.groupBy({
      by: ["provaId"],
      where: {
        provaId: { in: provaIds },
        status: "SUBMETIDA",
      },
      _count: { id: true },
    });

    const provasInfo = await db.prova.findMany({
      where: { id: { in: provaIds } },
      select: { id: true, nome: true, notaMinima: true },
    });

    const provasBaixaAprovacao: { id: string; titulo: string; taxa: number }[] = [];

    for (const provaInfo of provasInfo) {
      const tentativasProva = await db.tentativa.findMany({
        where: {
          provaId: provaInfo.id,
          status: "SUBMETIDA",
        },
        select: { nota: true },
      });

      if (tentativasProva.length >= 5) {
        const aprovados = tentativasProva.filter(t => (t.nota || 0) >= provaInfo.notaMinima).length;
        const taxa = Math.round((aprovados / tentativasProva.length) * 100);
        if (taxa < 30) {
          provasBaixaAprovacao.push({
            id: provaInfo.id,
            titulo: provaInfo.nome,
            taxa,
          });
        }
      }
    }

    // 3. Simulados not published
    const simuladosNaoPublicados = simulados.filter(s => s.status !== "ATIVO").length;

    return NextResponse.json({
      alunosInativos: alunosInativos.length,
      alunosInativosList: alunosInativos.slice(0, 5).map((a) => ({
        id: a.alunoId,
        nome: a.aluno.nome,
      })),
      provasBaixaAprovacao: provasBaixaAprovacao.length,
      provasBaixaAprovacaoList: provasBaixaAprovacao.slice(0, 5),
      simuladosNaoPublicados,
    });
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
