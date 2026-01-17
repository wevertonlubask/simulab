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

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get turmas the student is enrolled in
    const turmasAluno = await db.turmaAluno.findMany({
      where: { alunoId: session.user.id },
      select: { turmaId: true },
    });

    const turmaIds = turmasAluno.map(ta => ta.turmaId);

    // Get provas available in these turmas
    const turmaProvas = await db.turmaProva.findMany({
      where: {
        turmaId: { in: turmaIds },
        prova: {
          status: "PUBLICADA",
        },
      },
      select: {
        prova: {
          select: {
            id: true,
            nome: true,
            tentativasMax: true,
            tempoLimite: true,
          },
        },
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
        dataFim: true,
      },
    });

    // Count attempts per prova for this student
    const tentativas = await db.tentativa.findMany({
      where: {
        alunoId: session.user.id,
        status: "SUBMETIDA",
      },
      select: {
        provaId: true,
      },
    });

    const tentativasPorProva = new Map<string, number>();
    tentativas.forEach(t => {
      const count = tentativasPorProva.get(t.provaId) || 0;
      tentativasPorProva.set(t.provaId, count + 1);
    });

    // Filter provas that still have attempts available
    const provasPendentes = turmaProvas
      .filter(tp => {
        const tentativasFeitas = tentativasPorProva.get(tp.prova.id) || 0;
        const maxTentativas = tp.prova.tentativasMax || 999;
        return tentativasFeitas < maxTentativas;
      })
      .map(tp => ({
        id: tp.prova.id,
        titulo: tp.prova.nome,
        turma: tp.turma.nome,
        turmaId: tp.turma.id,
        prazo: tp.dataFim?.toISOString() || null,
        tentativasRestantes: (tp.prova.tentativasMax || 999) - (tentativasPorProva.get(tp.prova.id) || 0),
        tempoLimite: tp.prova.tempoLimite,
      }));

    // Remove duplicates (same prova in multiple turmas)
    const uniqueProvas = provasPendentes.reduce((acc, prova) => {
      const existing = acc.find(p => p.id === prova.id);
      if (!existing) {
        acc.push(prova);
      }
      return acc;
    }, [] as typeof provasPendentes);

    return NextResponse.json(uniqueProvas.slice(0, limit));
  } catch (error) {
    console.error("Erro ao buscar provas pendentes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
