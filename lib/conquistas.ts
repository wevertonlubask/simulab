import { db } from "@/lib/db";
import { TipoConquista } from "@prisma/client";
import { createNotification } from "@/lib/notifications";

interface ConquistaInfo {
  codigo: TipoConquista;
  nome: string;
  descricao: string;
  icone: string;
  pontos: number;
  raridade: string;
}

export const CONQUISTAS: ConquistaInfo[] = [
  {
    codigo: "PRIMEIRA_PROVA",
    nome: "Primeiro Passo",
    descricao: "Complete sua primeira prova",
    icone: "rocket",
    pontos: 10,
    raridade: "comum",
  },
  {
    codigo: "PRIMEIRA_APROVACAO",
    nome: "Vitória Inicial",
    descricao: "Seja aprovado em sua primeira prova",
    icone: "check-circle",
    pontos: 20,
    raridade: "comum",
  },
  {
    codigo: "STREAK_3",
    nome: "Dedicação",
    descricao: "Faça provas por 3 dias seguidos",
    icone: "flame",
    pontos: 30,
    raridade: "incomum",
  },
  {
    codigo: "STREAK_7",
    nome: "Constância",
    descricao: "Faça provas por 7 dias seguidos",
    icone: "flame",
    pontos: 50,
    raridade: "raro",
  },
  {
    codigo: "STREAK_30",
    nome: "Imparável",
    descricao: "Faça provas por 30 dias seguidos",
    icone: "flame",
    pontos: 150,
    raridade: "épico",
  },
  {
    codigo: "NOTA_PERFEITA",
    nome: "Perfeição",
    descricao: "Obtenha nota 100% em uma prova",
    icone: "star",
    pontos: 50,
    raridade: "raro",
  },
  {
    codigo: "NOTA_90",
    nome: "Excelência",
    descricao: "Obtenha nota acima de 90% em uma prova",
    icone: "award",
    pontos: 25,
    raridade: "incomum",
  },
  {
    codigo: "APROVACOES_5",
    nome: "Em Ascensão",
    descricao: "Seja aprovado em 5 provas",
    icone: "trending-up",
    pontos: 30,
    raridade: "comum",
  },
  {
    codigo: "APROVACOES_10",
    nome: "Determinado",
    descricao: "Seja aprovado em 10 provas",
    icone: "medal",
    pontos: 50,
    raridade: "incomum",
  },
  {
    codigo: "APROVACOES_25",
    nome: "Expert",
    descricao: "Seja aprovado em 25 provas",
    icone: "crown",
    pontos: 100,
    raridade: "raro",
  },
  {
    codigo: "PROVAS_10",
    nome: "Explorador",
    descricao: "Complete 10 provas",
    icone: "book-open",
    pontos: 30,
    raridade: "comum",
  },
  {
    codigo: "PROVAS_25",
    nome: "Estudante Dedicado",
    descricao: "Complete 25 provas",
    icone: "graduation-cap",
    pontos: 60,
    raridade: "incomum",
  },
  {
    codigo: "PROVAS_50",
    nome: "Veterano",
    descricao: "Complete 50 provas",
    icone: "shield",
    pontos: 120,
    raridade: "raro",
  },
  {
    codigo: "CATEGORIA_COMPLETA",
    nome: "Especialista",
    descricao: "Seja aprovado em todas as provas de uma categoria",
    icone: "target",
    pontos: 80,
    raridade: "épico",
  },
  {
    codigo: "VELOCISTA",
    nome: "Velocista",
    descricao: "Complete uma prova em menos de 50% do tempo limite",
    icone: "zap",
    pontos: 40,
    raridade: "raro",
  },
  {
    codigo: "ESTUDIOSO",
    nome: "Estudioso",
    descricao: "Revise o gabarito de 10 provas diferentes",
    icone: "book",
    pontos: 25,
    raridade: "incomum",
  },
];

export async function ensureConquistasExist() {
  for (const conquista of CONQUISTAS) {
    await db.conquista.upsert({
      where: { codigo: conquista.codigo },
      update: {},
      create: conquista,
    });
  }
}

export async function desbloquearConquista(
  userId: string,
  codigo: TipoConquista
): Promise<boolean> {
  try {
    // Verificar se já tem a conquista
    const existente = await db.userConquista.findFirst({
      where: {
        userId,
        conquista: { codigo },
      },
    });

    if (existente) {
      return false; // Já tem a conquista
    }

    // Buscar a conquista
    const conquista = await db.conquista.findUnique({
      where: { codigo },
    });

    if (!conquista) {
      console.error(`Conquista ${codigo} não encontrada`);
      return false;
    }

    // Desbloquear
    await db.userConquista.create({
      data: {
        userId,
        conquistaId: conquista.id,
      },
    });

    // Notificar o usuário
    await createNotification({
      userId,
      tipo: "SISTEMA",
      titulo: "Nova conquista desbloqueada!",
      mensagem: `Parabéns! Você desbloqueou a conquista "${conquista.nome}": ${conquista.descricao}`,
      link: "/aluno/conquistas",
      metadata: { conquistaId: conquista.id, codigo },
    });

    return true;
  } catch (error) {
    console.error(`Erro ao desbloquear conquista ${codigo}:`, error);
    return false;
  }
}

export async function verificarConquistas(userId: string): Promise<void> {
  try {
    // Buscar dados do usuário para verificação
    const tentativas = await db.tentativa.findMany({
      where: {
        alunoId: userId,
        status: "SUBMETIDA",
      },
      include: {
        prova: {
          include: {
            simulado: true,
          },
        },
      },
      orderBy: { dataFim: "asc" },
    });

    const totalProvas = tentativas.length;
    const aprovacoes = tentativas.filter(
      (t) => (t.nota || 0) >= t.prova.notaMinima
    );
    const totalAprovacoes = aprovacoes.length;

    // PRIMEIRA_PROVA
    if (totalProvas >= 1) {
      await desbloquearConquista(userId, "PRIMEIRA_PROVA");
    }

    // PRIMEIRA_APROVACAO
    if (totalAprovacoes >= 1) {
      await desbloquearConquista(userId, "PRIMEIRA_APROVACAO");
    }

    // NOTA_PERFEITA
    const temNotaPerfeita = tentativas.some((t) => t.nota === 100);
    if (temNotaPerfeita) {
      await desbloquearConquista(userId, "NOTA_PERFEITA");
    }

    // NOTA_90
    const temNota90 = tentativas.some((t) => (t.nota || 0) >= 90);
    if (temNota90) {
      await desbloquearConquista(userId, "NOTA_90");
    }

    // APROVACOES
    if (totalAprovacoes >= 5) {
      await desbloquearConquista(userId, "APROVACOES_5");
    }
    if (totalAprovacoes >= 10) {
      await desbloquearConquista(userId, "APROVACOES_10");
    }
    if (totalAprovacoes >= 25) {
      await desbloquearConquista(userId, "APROVACOES_25");
    }

    // PROVAS
    if (totalProvas >= 10) {
      await desbloquearConquista(userId, "PROVAS_10");
    }
    if (totalProvas >= 25) {
      await desbloquearConquista(userId, "PROVAS_25");
    }
    if (totalProvas >= 50) {
      await desbloquearConquista(userId, "PROVAS_50");
    }

    // VELOCISTA - prova em menos de 50% do tempo limite
    const temVelocista = tentativas.some((t) => {
      if (!t.prova.tempoLimite || !t.tempoGasto) return false;
      const tempoLimiteSegundos = t.prova.tempoLimite * 60;
      return t.tempoGasto < tempoLimiteSegundos * 0.5 && (t.nota || 0) >= t.prova.notaMinima;
    });
    if (temVelocista) {
      await desbloquearConquista(userId, "VELOCISTA");
    }

    // STREAK - verificar dias consecutivos
    const datasUnicas = Array.from(
      new Set(
        tentativas
          .filter((t) => t.dataFim)
          .map((t) => t.dataFim!.toISOString().split("T")[0])
      )
    ).sort();

    let streakAtual = 1;
    let maiorStreak = 1;

    for (let i = 1; i < datasUnicas.length; i++) {
      const dataAnterior = new Date(datasUnicas[i - 1]);
      const dataAtual = new Date(datasUnicas[i]);
      const diffDias = Math.floor(
        (dataAtual.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDias === 1) {
        streakAtual++;
        maiorStreak = Math.max(maiorStreak, streakAtual);
      } else {
        streakAtual = 1;
      }
    }

    if (maiorStreak >= 3) {
      await desbloquearConquista(userId, "STREAK_3");
    }
    if (maiorStreak >= 7) {
      await desbloquearConquista(userId, "STREAK_7");
    }
    if (maiorStreak >= 30) {
      await desbloquearConquista(userId, "STREAK_30");
    }
  } catch (error) {
    console.error("Erro ao verificar conquistas:", error);
  }
}

export async function getConquistasUsuario(userId: string) {
  const todasConquistas = await db.conquista.findMany({
    orderBy: { pontos: "asc" },
  });

  const conquistasUsuario = await db.userConquista.findMany({
    where: { userId },
    include: { conquista: true },
  });

  const conquistasMap = new Map(
    conquistasUsuario.map((uc) => [uc.conquista.codigo, uc])
  );

  return todasConquistas.map((c) => ({
    ...c,
    desbloqueada: conquistasMap.has(c.codigo),
    desbloqueadaEm: conquistasMap.get(c.codigo)?.desbloqueadaEm,
  }));
}

export async function getPontosUsuario(userId: string): Promise<number> {
  const conquistas = await db.userConquista.findMany({
    where: { userId },
    include: { conquista: true },
  });

  return conquistas.reduce((total, uc) => total + uc.conquista.pontos, 0);
}
