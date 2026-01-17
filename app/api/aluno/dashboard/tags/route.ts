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

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Get all respostas from this student with questao IDs
    const respostas = await db.resposta.findMany({
      where: {
        tentativa: {
          alunoId: session.user.id,
          status: "SUBMETIDA",
        },
      },
      select: {
        correta: true,
        questaoId: true,
      },
    });

    // Get unique questao IDs
    const questaoIds = Array.from(new Set(respostas.map(r => r.questaoId)));

    // Get questoes with tags
    const questoes = await db.questao.findMany({
      where: {
        id: { in: questaoIds },
      },
      select: {
        id: true,
        tags: true,
      },
    });

    // Create a map of questaoId to tags
    const questaoTagsMap = new Map<string, string[]>();
    questoes.forEach(q => {
      questaoTagsMap.set(q.id, q.tags || []);
    });

    // Group by tag
    const tagStats = new Map<string, { corretas: number; total: number }>();

    respostas.forEach(r => {
      const tags = questaoTagsMap.get(r.questaoId) || [];
      tags.forEach((tag: string) => {
        const stats = tagStats.get(tag) || { corretas: 0, total: 0 };
        stats.total++;
        if (r.correta) stats.corretas++;
        tagStats.set(tag, stats);
      });
    });

    const tagsResult = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        taxaAcerto: stats.total > 0 ? Math.round((stats.corretas / stats.total) * 100) : 0,
        total: stats.total,
      }))
      .filter(t => t.total >= 3) // Only tags with at least 3 questions
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 tags for radar chart

    return NextResponse.json(tagsResult);
  } catch (error) {
    console.error("Erro ao buscar tags:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
