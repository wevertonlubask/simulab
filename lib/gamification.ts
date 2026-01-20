import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// ==========================================
// SISTEMA DE NÍVEIS E XP
// ==========================================

export const NIVEIS = [
  { nivel: 1, nome: "Iniciante", xpNecessario: 0 },
  { nivel: 2, nome: "Aprendiz", xpNecessario: 200 },
  { nivel: 3, nome: "Estudante", xpNecessario: 500 },
  { nivel: 4, nome: "Dedicado", xpNecessario: 1000 },
  { nivel: 5, nome: "Avançado", xpNecessario: 2000 },
  { nivel: 6, nome: "Expert", xpNecessario: 4000 },
  { nivel: 7, nome: "Mestre", xpNecessario: 7000 },
  { nivel: 8, nome: "Lenda", xpNecessario: 10000 },
  { nivel: 9, nome: "Imortal", xpNecessario: 15000 },
  { nivel: 10, nome: "Divino", xpNecessario: 25000 },
];

// XP por ação
export const XP_ACTIONS = {
  COMPLETAR_PROVA: 50,
  SER_APROVADO: 100,
  NOTA_PERFEITA: 50,  // bônus adicional
  STREAK_DIARIO: 20,
  PRIMEIRA_PROVA_SIMULADO: 30,
};

export interface NivelInfo {
  nivel: number;
  nome: string;
  xpAtual: number;
  xpNecessario: number;
  xpProximoNivel: number;
  progresso: number; // 0-100
}

export function calcularNivel(xp: number): NivelInfo {
  let nivelAtual = NIVEIS[0];
  let proximoNivel = NIVEIS[1];

  for (let i = NIVEIS.length - 1; i >= 0; i--) {
    if (xp >= NIVEIS[i].xpNecessario) {
      nivelAtual = NIVEIS[i];
      proximoNivel = NIVEIS[i + 1] || NIVEIS[i]; // Último nível
      break;
    }
  }

  const xpNoNivelAtual = xp - nivelAtual.xpNecessario;
  const xpParaProximo = proximoNivel.xpNecessario - nivelAtual.xpNecessario;
  const progresso = xpParaProximo > 0
    ? Math.min(100, Math.round((xpNoNivelAtual / xpParaProximo) * 100))
    : 100;

  return {
    nivel: nivelAtual.nivel,
    nome: nivelAtual.nome,
    xpAtual: xp,
    xpNecessario: nivelAtual.xpNecessario,
    xpProximoNivel: proximoNivel.xpNecessario,
    progresso,
  };
}

// ==========================================
// GAMIFICAÇÃO DO USUÁRIO
// ==========================================

export async function getOrCreateUserGamification(userId: string) {
  let gamification = await db.userGamification.findUnique({
    where: { userId },
  });

  if (!gamification) {
    gamification = await db.userGamification.create({
      data: { userId },
    });
  }

  return gamification;
}

export async function addXP(
  userId: string,
  amount: number,
  reason: string
): Promise<{ xpGanho: number; leveledUp: boolean; novoNivel?: number }> {
  const gamification = await getOrCreateUserGamification(userId);
  const nivelAnterior = calcularNivel(gamification.xp).nivel;

  const updated = await db.userGamification.update({
    where: { userId },
    data: {
      xp: { increment: amount },
      ultimaAtividade: new Date(),
    },
  });

  const nivelNovo = calcularNivel(updated.xp).nivel;
  const leveledUp = nivelNovo > nivelAnterior;

  if (leveledUp) {
    // Atualizar o campo nivel
    await db.userGamification.update({
      where: { userId },
      data: { nivel: nivelNovo },
    });

    // Notificar sobre level up
    const nivelInfo = NIVEIS.find(n => n.nivel === nivelNovo);
    await createNotification({
      userId,
      tipo: "SISTEMA",
      titulo: "Parabéns! Você subiu de nível!",
      mensagem: `Você alcançou o nível ${nivelNovo} - ${nivelInfo?.nome || ""}! Continue assim!`,
      link: "/aluno/conquistas",
      metadata: { tipo: "level_up", novoNivel: nivelNovo },
    });
  }

  console.log(`[Gamification] ${userId} ganhou ${amount} XP (${reason}). Total: ${updated.xp}`);

  return { xpGanho: amount, leveledUp, novoNivel: leveledUp ? nivelNovo : undefined };
}

// ==========================================
// SISTEMA DE STREAK
// ==========================================

export async function updateStreak(userId: string): Promise<{ streak: number; continuou: boolean }> {
  const gamification = await getOrCreateUserGamification(userId);
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  let novoStreak = 1;
  let continuou = false;

  if (gamification.ultimaAtividade) {
    const ultimaData = new Date(gamification.ultimaAtividade);
    const ultimoDia = new Date(ultimaData.getFullYear(), ultimaData.getMonth(), ultimaData.getDate());
    const diffDias = Math.floor((hoje.getTime() - ultimoDia.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
      // Já fez atividade hoje
      return { streak: gamification.streak, continuou: true };
    } else if (diffDias === 1) {
      // Dia consecutivo
      novoStreak = gamification.streak + 1;
      continuou = true;
    }
    // Se diffDias > 1, streak reseta para 1
  }

  const updated = await db.userGamification.update({
    where: { userId },
    data: {
      streak: novoStreak,
      maiorStreak: Math.max(gamification.maiorStreak, novoStreak),
      ultimaAtividade: agora,
    },
  });

  // Dar XP pelo streak diário
  if (continuou && novoStreak > 1) {
    await addXP(userId, XP_ACTIONS.STREAK_DIARIO, "streak_diario");
  }

  return { streak: updated.streak, continuou };
}

// ==========================================
// SISTEMA DE CONQUISTAS
// ==========================================

interface ConquistaDesbloqueada {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  xpBonus: number;
}

interface ConquistaCondicao {
  tipo: string;
  valor: number | string;
}

export async function checkConquistas(
  userId: string,
  evento: {
    tipo: "prova_submetida";
    nota?: number;
    aprovado?: boolean;
    tempoGasto?: number;
    tempoLimite?: number;
    horaSubmissao?: Date;
    categoria?: string;
    acertosConsecutivos?: number;
    primeiraProvaSimulado?: boolean;
  }
): Promise<ConquistaDesbloqueada[]> {
  const conquistasDesbloqueadas: ConquistaDesbloqueada[] = [];

  // Buscar todas as conquistas
  const todasConquistas = await db.conquista.findMany({
    orderBy: { ordem: "asc" },
  });

  // Buscar conquistas que o usuário já tem
  const conquistasUsuario = await db.userConquista.findMany({
    where: { userId },
    select: { conquistaId: true },
  });
  const conquistasJaTemIds = new Set(conquistasUsuario.map(c => c.conquistaId));

  // Buscar estatísticas do usuário
  const gamification = await getOrCreateUserGamification(userId);

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
  const aprovacoes = tentativas.filter(t => (t.nota || 0) >= t.prova.notaMinima);
  const totalAprovacoes = aprovacoes.length;
  const categoriasUnicas = new Set(tentativas.map(t => t.prova.simulado.categoria));

  // Verificar cada conquista
  for (const conquista of todasConquistas) {
    if (conquistasJaTemIds.has(conquista.id)) continue;

    const condicao = conquista.condicao as unknown as ConquistaCondicao;
    let desbloqueou = false;

    switch (condicao.tipo) {
      case "provas_total":
        desbloqueou = totalProvas >= (condicao.valor as number);
        break;

      case "aprovacoes_total":
        desbloqueou = totalAprovacoes >= (condicao.valor as number);
        break;

      case "nota_minima":
        if (evento.nota !== undefined) {
          const notaAlvo = condicao.valor as number;
          if (notaAlvo === 100) {
            desbloqueou = evento.nota === 100;
          } else {
            desbloqueou = evento.nota >= notaAlvo;
          }
        }
        break;

      case "aprovacoes_seguidas":
        desbloqueou = gamification.aprovacoesSeguidas >= (condicao.valor as number);
        break;

      case "streak_dias":
        desbloqueou = gamification.streak >= (condicao.valor as number) ||
                      gamification.maiorStreak >= (condicao.valor as number);
        break;

      case "horario":
        if (evento.horaSubmissao) {
          const hora = evento.horaSubmissao.getHours();
          if (condicao.valor === "noturno") {
            desbloqueou = hora >= 0 && hora < 5; // Meia-noite até 5h
          } else if (condicao.valor === "madrugada") {
            desbloqueou = hora >= 5 && hora < 7; // 5h até 7h
          }
        }
        break;

      case "tempo_percentual":
        if (evento.tempoGasto !== undefined && evento.tempoLimite !== undefined && evento.tempoLimite > 0) {
          const percentualUsado = (evento.tempoGasto / (evento.tempoLimite * 60)) * 100;
          desbloqueou = percentualUsado < (condicao.valor as number);
        }
        break;

      case "acertos_seguidos":
        if (evento.acertosConsecutivos !== undefined) {
          desbloqueou = evento.acertosConsecutivos >= (condicao.valor as number);
        }
        // Também verificar o campo persistente
        desbloqueou = desbloqueou || gamification.acertosSeguidos >= (condicao.valor as number);
        break;

      case "categorias_diferentes":
        desbloqueou = categoriasUnicas.size >= (condicao.valor as number);
        break;
    }

    if (desbloqueou) {
      // Desbloquear conquista
      await db.userConquista.create({
        data: {
          userId,
          conquistaId: conquista.id,
        },
      });

      // Dar XP bônus
      if (conquista.xpBonus > 0) {
        await addXP(userId, conquista.xpBonus, `conquista_${conquista.codigo}`);
      }

      // Notificar usuário
      await createNotification({
        userId,
        tipo: "SISTEMA",
        titulo: "Nova conquista desbloqueada!",
        mensagem: `Parabéns! Você desbloqueou "${conquista.nome}": ${conquista.descricao}`,
        link: "/aluno/conquistas",
        metadata: { tipo: "conquista", conquistaId: conquista.id, codigo: conquista.codigo },
      });

      conquistasDesbloqueadas.push({
        id: conquista.id,
        codigo: conquista.codigo,
        nome: conquista.nome,
        descricao: conquista.descricao,
        icone: conquista.icone,
        xpBonus: conquista.xpBonus,
      });
    }
  }

  return conquistasDesbloqueadas;
}

// ==========================================
// PROCESSAR SUBMISSÃO DE PROVA
// ==========================================

export async function processarSubmissaoProva(
  userId: string,
  dados: {
    nota: number;
    aprovado: boolean;
    tempoGasto?: number;
    tempoLimite?: number;
    acertosConsecutivos?: number;
    categoria: string;
    primeiraProvaSimulado?: boolean;
  }
): Promise<{
  xpTotal: number;
  leveledUp: boolean;
  novoNivel?: number;
  conquistasDesbloqueadas: ConquistaDesbloqueada[];
}> {
  let xpTotal = 0;
  let leveledUp = false;
  let novoNivel: number | undefined;

  // 1. Atualizar streak
  await updateStreak(userId);

  // 2. XP por completar prova
  const xpProva = await addXP(userId, XP_ACTIONS.COMPLETAR_PROVA, "completar_prova");
  xpTotal += xpProva.xpGanho;
  if (xpProva.leveledUp) {
    leveledUp = true;
    novoNivel = xpProva.novoNivel;
  }

  // 3. XP por aprovação
  if (dados.aprovado) {
    const xpAprov = await addXP(userId, XP_ACTIONS.SER_APROVADO, "aprovacao");
    xpTotal += xpAprov.xpGanho;
    if (xpAprov.leveledUp) {
      leveledUp = true;
      novoNivel = xpAprov.novoNivel;
    }

    // Atualizar aprovações seguidas
    await db.userGamification.update({
      where: { userId },
      data: {
        aprovacoesSeguidas: { increment: 1 },
      },
    });
  } else {
    // Resetar aprovações seguidas
    await db.userGamification.update({
      where: { userId },
      data: {
        aprovacoesSeguidas: 0,
      },
    });
  }

  // 4. XP por nota perfeita
  if (dados.nota === 100) {
    const xpPerfeito = await addXP(userId, XP_ACTIONS.NOTA_PERFEITA, "nota_perfeita");
    xpTotal += xpPerfeito.xpGanho;
    if (xpPerfeito.leveledUp) {
      leveledUp = true;
      novoNivel = xpPerfeito.novoNivel;
    }
  }

  // 5. XP por primeira prova do simulado
  if (dados.primeiraProvaSimulado) {
    const xpPrimeira = await addXP(userId, XP_ACTIONS.PRIMEIRA_PROVA_SIMULADO, "primeira_prova_simulado");
    xpTotal += xpPrimeira.xpGanho;
    if (xpPrimeira.leveledUp) {
      leveledUp = true;
      novoNivel = xpPrimeira.novoNivel;
    }
  }

  // 6. Atualizar acertos consecutivos
  if (dados.acertosConsecutivos !== undefined) {
    const gamification = await getOrCreateUserGamification(userId);
    if (dados.acertosConsecutivos > gamification.acertosSeguidos) {
      await db.userGamification.update({
        where: { userId },
        data: {
          acertosSeguidos: dados.acertosConsecutivos,
        },
      });
    }
  }

  // 7. Verificar conquistas
  const conquistasDesbloqueadas = await checkConquistas(userId, {
    tipo: "prova_submetida",
    nota: dados.nota,
    aprovado: dados.aprovado,
    tempoGasto: dados.tempoGasto,
    tempoLimite: dados.tempoLimite,
    horaSubmissao: new Date(),
    categoria: dados.categoria,
    acertosConsecutivos: dados.acertosConsecutivos,
    primeiraProvaSimulado: dados.primeiraProvaSimulado,
  });

  // Somar XP das conquistas
  for (const conquista of conquistasDesbloqueadas) {
    xpTotal += conquista.xpBonus;
  }

  return {
    xpTotal,
    leveledUp,
    novoNivel,
    conquistasDesbloqueadas,
  };
}

// ==========================================
// LEADERBOARD
// ==========================================

export interface LeaderboardEntry {
  posicao: number;
  userId: string;
  nome: string;
  avatar: string | null;
  xp: number;
  nivel: number;
  nomeNivel: string;
}

export async function getLeaderboard(
  periodo: number = 30, // dias
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - periodo);

  // Para período "all time", ignoramos a data
  const whereClause = periodo > 0 && periodo < 365 ? {
    ultimaAtividade: { gte: dataLimite },
  } : {};

  const gamifications = await db.userGamification.findMany({
    where: whereClause,
    orderBy: { xp: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          nome: true,
          avatar: true,
        },
      },
    },
  });

  return gamifications.map((g, index) => {
    const nivelInfo = calcularNivel(g.xp);
    return {
      posicao: index + 1,
      userId: g.userId,
      nome: g.user.nome,
      avatar: g.user.avatar,
      xp: g.xp,
      nivel: nivelInfo.nivel,
      nomeNivel: nivelInfo.nome,
    };
  });
}

// ==========================================
// HELPERS
// ==========================================

export async function getGamificationPerfil(userId: string) {
  const gamification = await getOrCreateUserGamification(userId);
  const nivelInfo = calcularNivel(gamification.xp);

  const conquistasUsuario = await db.userConquista.findMany({
    where: { userId },
    include: { conquista: true },
    orderBy: { desbloqueadaEm: "desc" },
  });

  const todasConquistas = await db.conquista.count();

  return {
    xp: gamification.xp,
    nivel: nivelInfo,
    streak: gamification.streak,
    maiorStreak: gamification.maiorStreak,
    ultimaAtividade: gamification.ultimaAtividade,
    conquistasDesbloqueadas: conquistasUsuario.length,
    conquistasTotal: todasConquistas,
    ultimaConquista: conquistasUsuario[0] ? {
      ...conquistasUsuario[0].conquista,
      desbloqueadaEm: conquistasUsuario[0].desbloqueadaEm,
    } : null,
  };
}

export async function getConquistasComProgresso(userId: string) {
  const todasConquistas = await db.conquista.findMany({
    orderBy: [{ categoria: "asc" }, { ordem: "asc" }],
  });

  const conquistasUsuario = await db.userConquista.findMany({
    where: { userId },
    select: { conquistaId: true, desbloqueadaEm: true },
  });

  const conquistasMap = new Map(
    conquistasUsuario.map(c => [c.conquistaId, c.desbloqueadaEm])
  );

  // Buscar estatísticas para calcular progresso
  const gamification = await getOrCreateUserGamification(userId);
  const totalProvas = await db.tentativa.count({
    where: { alunoId: userId, status: "SUBMETIDA" },
  });

  // Buscar aprovações: tentativas onde nota >= notaMinima da prova
  const tentativasComNota = await db.tentativa.findMany({
    where: { alunoId: userId, status: "SUBMETIDA" },
    select: { nota: true, prova: { select: { notaMinima: true } } },
  });
  const totalAprovacoes = tentativasComNota.filter(
    t => t.nota !== null && t.nota >= t.prova.notaMinima
  ).length;

  // Buscar categorias únicas
  const tentativas = await db.tentativa.findMany({
    where: { alunoId: userId, status: "SUBMETIDA" },
    select: { prova: { select: { simulado: { select: { categoria: true } } } } },
  });
  const categoriasUnicas = new Set(tentativas.map(t => t.prova.simulado.categoria)).size;

  return todasConquistas.map(conquista => {
    const condicao = conquista.condicao as unknown as ConquistaCondicao;
    const desbloqueadaEm = conquistasMap.get(conquista.id);
    const desbloqueada = !!desbloqueadaEm;

    let progresso = 0;
    let progressoAtual = 0;
    let progressoTotal = 0;

    if (!desbloqueada) {
      switch (condicao.tipo) {
        case "provas_total":
          progressoAtual = totalProvas;
          progressoTotal = condicao.valor as number;
          break;
        case "aprovacoes_total":
          progressoAtual = totalAprovacoes;
          progressoTotal = condicao.valor as number;
          break;
        case "aprovacoes_seguidas":
          progressoAtual = gamification.aprovacoesSeguidas;
          progressoTotal = condicao.valor as number;
          break;
        case "streak_dias":
          progressoAtual = Math.max(gamification.streak, gamification.maiorStreak);
          progressoTotal = condicao.valor as number;
          break;
        case "acertos_seguidos":
          progressoAtual = gamification.acertosSeguidos;
          progressoTotal = condicao.valor as number;
          break;
        case "categorias_diferentes":
          progressoAtual = categoriasUnicas;
          progressoTotal = condicao.valor as number;
          break;
        default:
          // Conquistas especiais (horário, tempo, etc.) não têm progresso
          progressoTotal = 1;
          break;
      }
      progresso = progressoTotal > 0 ? Math.min(100, Math.round((progressoAtual / progressoTotal) * 100)) : 0;
    } else {
      progresso = 100;
    }

    return {
      ...conquista,
      desbloqueada,
      desbloqueadaEm,
      progresso,
      progressoAtual,
      progressoTotal,
    };
  });
}
