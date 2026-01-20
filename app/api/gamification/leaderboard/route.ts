import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getLeaderboard } from "@/lib/gamification";

// GET /api/gamification/leaderboard?periodo=30&limit=50
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE"]);

    const { searchParams } = new URL(request.url);
    const periodo = parseInt(searchParams.get("periodo") || "30", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const leaderboard = await getLeaderboard(periodo, limit);

    // Encontrar posição do usuário atual
    const posicaoUsuario = leaderboard.findIndex(entry => entry.userId === user.id);
    const minhasPosicao = posicaoUsuario >= 0 ? leaderboard[posicaoUsuario] : null;

    // Se o usuário não está no top, buscar sua posição real
    let minhaPosicaoReal = posicaoUsuario >= 0 ? posicaoUsuario + 1 : null;
    if (!minhasPosicao) {
      // Buscar posição do usuário fora do top
      const { db } = await import("@/lib/db");
      const gamification = await db.userGamification.findUnique({
        where: { userId: user.id },
        include: { user: { select: { nome: true, avatar: true } } },
      });

      if (gamification) {
        const posicao = await db.userGamification.count({
          where: { xp: { gt: gamification.xp } },
        });
        minhaPosicaoReal = posicao + 1;
      }
    }

    return NextResponse.json({
      leaderboard,
      periodo,
      total: leaderboard.length,
      minhaPosicao: minhaPosicaoReal,
      minhaEntrada: minhasPosicao,
    });
  } catch (error) {
    console.error("Erro ao buscar leaderboard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
