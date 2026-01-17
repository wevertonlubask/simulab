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
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build where clause for docente's simulados
    const simuladoWhere: Record<string, unknown> = {};
    if (session.user.role !== "SUPERADMIN") {
      simuladoWhere.docenteId = session.user.id;
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

    // Get all respostas for tentativas of docente's provas
    const respostas = await db.resposta.findMany({
      where: {
        tentativa: {
          provaId: { in: provaIds },
          status: "SUBMETIDA",
        },
      },
      select: {
        correta: true,
        questaoId: true,
      },
    });

    // Get questao details
    const questaoIds = Array.from(new Set(respostas.map((r) => r.questaoId)));
    const questoes = await db.questao.findMany({
      where: {
        id: { in: questaoIds },
      },
      select: {
        id: true,
        enunciado: true,
        simulado: {
          select: {
            nome: true,
          },
        },
      },
    });
    const questaoMap = new Map(questoes.map((q) => [q.id, q]));

    // Group by questao
    const questaoStats = new Map<
      string,
      {
        questaoId: string;
        enunciado: string;
        simulado: string;
        totalRespostas: number;
        erradas: number;
      }
    >();

    respostas.forEach((r) => {
      const questao = questaoMap.get(r.questaoId);
      if (!questao) return;

      const stats = questaoStats.get(r.questaoId) || {
        questaoId: r.questaoId,
        enunciado: questao.enunciado.slice(0, 100) + (questao.enunciado.length > 100 ? "..." : ""),
        simulado: questao.simulado.nome,
        totalRespostas: 0,
        erradas: 0,
      };
      stats.totalRespostas++;
      if (!r.correta) stats.erradas++;
      questaoStats.set(r.questaoId, stats);
    });

    // Convert to array and calculate error rate
    const questoesProblematicas = Array.from(questaoStats.values())
      .filter((q) => q.totalRespostas >= 5) // Only questions with at least 5 answers
      .map((q) => ({
        questaoId: q.questaoId,
        enunciado: q.enunciado,
        simulado: q.simulado,
        taxaErro: Math.round((q.erradas / q.totalRespostas) * 100),
        vezesRespondida: q.totalRespostas,
      }))
      .sort((a, b) => b.taxaErro - a.taxaErro)
      .slice(0, limit);

    return NextResponse.json(questoesProblematicas);
  } catch (error) {
    console.error("Erro ao buscar questões problemáticas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
