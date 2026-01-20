import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getConquistasComProgresso } from "@/lib/gamification";
import { ensureConquistasExist } from "@/lib/conquistas";
import { db } from "@/lib/db";

// GET /api/gamification/conquistas - Todas as conquistas + progresso do usuário
export async function GET() {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE"]);

    // Garantir que as conquistas existam
    await ensureConquistasExist();

    // Buscar conquistas com progresso
    const conquistas = await getConquistasComProgresso(user.id);

    // Agrupar por categoria
    const porCategoria = conquistas.reduce((acc, c) => {
      if (!acc[c.categoria]) {
        acc[c.categoria] = [];
      }
      acc[c.categoria].push(c);
      return acc;
    }, {} as Record<string, typeof conquistas>);

    // Estatísticas
    const totalConquistas = conquistas.length;
    const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada).length;
    const xpTotalConquistas = conquistas
      .filter(c => c.desbloqueada)
      .reduce((sum, c) => sum + c.xpBonus, 0);

    // Próxima conquista (mais perto de desbloquear)
    const proximaConquista = conquistas
      .filter(c => !c.desbloqueada && c.progresso > 0)
      .sort((a, b) => b.progresso - a.progresso)[0] || null;

    return NextResponse.json({
      conquistas,
      porCategoria,
      estatisticas: {
        total: totalConquistas,
        desbloqueadas: conquistasDesbloqueadas,
        progressoGeral: Math.round((conquistasDesbloqueadas / totalConquistas) * 100),
        xpTotalConquistas,
      },
      proximaConquista,
    });
  } catch (error) {
    console.error("Erro ao buscar conquistas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
