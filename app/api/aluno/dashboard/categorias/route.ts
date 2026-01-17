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

    // Get all respostas from this student with categoria info
    const respostas = await db.resposta.findMany({
      where: {
        tentativa: {
          alunoId: session.user.id,
          status: "SUBMETIDA",
        },
      },
      select: {
        correta: true,
        tentativa: {
          select: {
            prova: {
              select: {
                simulado: {
                  select: {
                    categoria: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group by categoria
    const categoriaStats = new Map<string, { corretas: number; total: number }>();

    respostas.forEach(r => {
      const categoria = r.tentativa.prova.simulado.categoria || "Outros";
      const stats = categoriaStats.get(categoria) || { corretas: 0, total: 0 };
      stats.total++;
      if (r.correta) stats.corretas++;
      categoriaStats.set(categoria, stats);
    });

    const categorias = Array.from(categoriaStats.entries()).map(([categoria, stats]) => ({
      categoria,
      taxaAcerto: stats.total > 0 ? Math.round((stats.corretas / stats.total) * 100) : 0,
      totalQuestoes: stats.total,
    }));

    // Sort by total questions (most practiced first)
    categorias.sort((a, b) => b.totalQuestoes - a.totalQuestoes);

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
