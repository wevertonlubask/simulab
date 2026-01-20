import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { ensureConquistasExist, getConquistasUsuario, getPontosUsuario, verificarConquistas } from "@/lib/conquistas";

export async function GET() {
  try {
    const user = await requireRole(["ALUNO"]);

    // Garantir que as conquistas existam no banco
    await ensureConquistasExist();

    // Verificar conquistas pendentes
    await verificarConquistas(user.id);

    // Buscar conquistas do usuário
    const [conquistas, pontosTotais] = await Promise.all([
      getConquistasUsuario(user.id),
      getPontosUsuario(user.id),
    ]);

    const totalConquistas = conquistas.length;
    const conquistasDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

    return NextResponse.json({
      conquistas,
      estatisticas: {
        total: totalConquistas,
        desbloqueadas: conquistasDesbloqueadas,
        pontosTotais,
        progresso: Math.round((conquistasDesbloqueadas / totalConquistas) * 100),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar conquistas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
