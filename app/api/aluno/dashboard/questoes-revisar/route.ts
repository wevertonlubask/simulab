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

    // Get all wrong answers from this student
    const respostasErradas = await db.resposta.findMany({
      where: {
        tentativa: {
          alunoId: session.user.id,
          status: "SUBMETIDA",
        },
        correta: false,
      },
      select: {
        questaoId: true,
      },
    });

    // Get unique questao IDs with error count
    const questaoErrorCount = new Map<string, number>();
    respostasErradas.forEach(r => {
      const count = questaoErrorCount.get(r.questaoId) || 0;
      questaoErrorCount.set(r.questaoId, count + 1);
    });

    // Get top questoes by error count
    const topQuestaoIds = Array.from(questaoErrorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    // Get questao details
    const questoes = await db.questao.findMany({
      where: {
        id: { in: topQuestaoIds },
      },
      select: {
        id: true,
        enunciado: true,
        simulado: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
    });

    const result = questoes.map(q => ({
      questaoId: q.id,
      enunciado: q.enunciado.slice(0, 100) + (q.enunciado.length > 100 ? "..." : ""),
      simulado: q.simulado.nome,
      categoria: q.simulado.categoria || "Outros",
      vezesErrada: questaoErrorCount.get(q.id) || 0,
    })).sort((a, b) => b.vezesErrada - a.vezesErrada);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar questões para revisar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
