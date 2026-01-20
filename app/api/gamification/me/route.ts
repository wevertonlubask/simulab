import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getGamificationPerfil, calcularNivel, NIVEIS } from "@/lib/gamification";

// GET /api/gamification/me - Perfil gamificado do usuário atual
export async function GET() {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE"]);

    const perfil = await getGamificationPerfil(user.id);

    // Calcular próxima conquista (mais perto de desbloquear)
    // Isso será feito no frontend com os dados de progresso

    return NextResponse.json({
      ...perfil,
      niveis: NIVEIS, // Enviar tabela de níveis para referência
    });
  } catch (error) {
    console.error("Erro ao buscar perfil gamificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
