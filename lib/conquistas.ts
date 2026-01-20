// Re-exportar funções do novo sistema de gamificação
// Este arquivo mantém compatibilidade com código legado

import { db } from "@/lib/db";
import {
  checkConquistas,
  getConquistasComProgresso,
  getGamificationPerfil,
} from "./gamification";

// Lista de conquistas disponíveis no sistema (para referência)
export const CONQUISTAS_CODIGOS = [
  // PROVAS
  "primeira_prova",
  "maratonista",
  "incansavel",
  "veterano",
  "lendario",
  // NOTAS
  "aprovado",
  "destaque",
  "perfeito",
  "consistente",
  "imparavel",
  // STREAKS
  "focado",
  "dedicado",
  "comprometido",
  "relampago",
  // ESPECIAIS
  "coruja",
  "madrugador",
  "veloz",
  "sniper",
  "explorador",
];

export async function ensureConquistasExist() {
  const count = await db.conquista.count();
  if (count === 0) {
    console.warn("[Conquistas] Nenhuma conquista encontrada. Execute prisma db seed para criar.");
  }
  return count > 0;
}

export async function desbloquearConquista(
  userId: string,
  codigo: string
): Promise<boolean> {
  try {
    const conquista = await db.conquista.findUnique({
      where: { codigo },
    });

    if (!conquista) {
      console.error(`[Conquistas] Conquista ${codigo} não encontrada`);
      return false;
    }

    const existente = await db.userConquista.findUnique({
      where: {
        userId_conquistaId: {
          userId,
          conquistaId: conquista.id,
        },
      },
    });

    if (existente) {
      return false; // Já possui
    }

    await db.userConquista.create({
      data: {
        userId,
        conquistaId: conquista.id,
      },
    });

    return true;
  } catch (error) {
    console.error(`[Conquistas] Erro ao desbloquear ${codigo}:`, error);
    return false;
  }
}

export async function verificarConquistas(userId: string): Promise<void> {
  // Usar o novo sistema
  await checkConquistas(userId, {
    tipo: "prova_submetida",
    horaSubmissao: new Date(),
  });
}

export async function getConquistasUsuario(userId: string) {
  return getConquistasComProgresso(userId);
}

export async function getPontosUsuario(userId: string): Promise<number> {
  const gamification = await db.userGamification.findUnique({
    where: { userId },
  });
  return gamification?.xp || 0;
}

// Re-exportar do novo módulo
export {
  getGamificationPerfil,
  getConquistasComProgresso,
};
