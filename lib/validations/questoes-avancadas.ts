import type {
  DragDropConfig,
  AssociacaoConfig,
  OrdenacaoConfig,
  LacunaConfig,
  HotspotConfig,
  ComandoConfig,
} from "./questao";

// ==================== DRAG AND DROP ====================

export interface DragDropResposta {
  posicoes: Record<string, string[]>;
}

export interface ValidationResult {
  correta: boolean;
  pontuacao: number; // 0-100
  detalhes?: {
    zonasCorretas?: number;
    totalZonas?: number;
    itensCorretos?: number;
    totalItens?: number;
  };
}

export function validateDragDrop(
  resposta: DragDropResposta,
  config: DragDropConfig
): ValidationResult {
  const { zonas, pontuacaoParcial } = config;

  let zonasCorretas = 0;
  let totalItensCorretos = 0;
  let totalItensEsperados = 0;

  for (const zona of zonas) {
    const itensNaZona = resposta.posicoes?.[zona.id] || [];
    const itensCorretos = zona.itensCorretos;
    totalItensEsperados += itensCorretos.length;

    // Verificar se todos os itens corretos estão na zona
    const todosCorretosPresentes = itensCorretos.every((id) =>
      itensNaZona.includes(id)
    );

    // Verificar se não há itens incorretos
    const semItensIncorretos = itensNaZona.every((id) =>
      itensCorretos.includes(id)
    );

    // Contar itens corretos nesta zona
    const corretos = itensNaZona.filter((id) => itensCorretos.includes(id)).length;
    totalItensCorretos += corretos;

    if (todosCorretosPresentes && semItensIncorretos) {
      zonasCorretas++;
    }
  }

  const todasCorretas = zonasCorretas === zonas.length;

  // Calcular pontuação
  let pontuacao: number;
  if (todasCorretas) {
    pontuacao = 100;
  } else if (pontuacaoParcial && totalItensEsperados > 0) {
    // Pontuação parcial baseada em itens corretos
    pontuacao = Math.round((totalItensCorretos / totalItensEsperados) * 100);
  } else {
    pontuacao = 0;
  }

  return {
    correta: todasCorretas,
    pontuacao,
    detalhes: {
      zonasCorretas,
      totalZonas: zonas.length,
      itensCorretos: totalItensCorretos,
      totalItens: totalItensEsperados,
    },
  };
}

// ==================== ASSOCIAÇÃO ====================

export interface AssociacaoResposta {
  conexoes: Array<{ de: string; para: string }>;
}

export function validateAssociacao(
  resposta: AssociacaoResposta,
  config: AssociacaoConfig
): ValidationResult {
  const { conexoesCorretas, pontuacaoParcial } = config;

  let conexoesAcertadas = 0;

  for (const conexaoCorreta of conexoesCorretas) {
    const encontrada = resposta.conexoes.some(
      (c) => c.de === conexaoCorreta.de && c.para === conexaoCorreta.para
    );
    if (encontrada) {
      conexoesAcertadas++;
    }
  }

  // Verificar conexões extras (incorretas)
  const conexoesIncorretas = resposta.conexoes.filter(
    (c) =>
      !conexoesCorretas.some(
        (cc) => cc.de === c.de && cc.para === c.para
      )
  ).length;

  const todasCorretas =
    conexoesAcertadas === conexoesCorretas.length && conexoesIncorretas === 0;

  let pontuacao: number;
  if (todasCorretas) {
    pontuacao = 100;
  } else if (pontuacaoParcial) {
    // Descontar pontos por conexões incorretas
    const pontosPositivos = (conexoesAcertadas / conexoesCorretas.length) * 100;
    const penalidade = (conexoesIncorretas / conexoesCorretas.length) * 25;
    pontuacao = Math.max(0, Math.round(pontosPositivos - penalidade));
  } else {
    pontuacao = 0;
  }

  return {
    correta: todasCorretas,
    pontuacao,
    detalhes: {
      itensCorretos: conexoesAcertadas,
      totalItens: conexoesCorretas.length,
    },
  };
}

// ==================== ORDENAÇÃO ====================

export interface OrdenacaoResposta {
  ordem: string[]; // IDs na ordem escolhida pelo aluno
}

export function validateOrdenacao(
  resposta: OrdenacaoResposta,
  config: OrdenacaoConfig
): ValidationResult {
  const { itens, pontuacaoParcial } = config;

  // Criar ordem correta baseada em ordemCorreta
  const ordemCorreta = [...itens]
    .sort((a, b) => a.ordemCorreta - b.ordemCorreta)
    .map((item) => item.id);

  let posicoesCorretas = 0;

  for (let i = 0; i < ordemCorreta.length; i++) {
    if (resposta.ordem[i] === ordemCorreta[i]) {
      posicoesCorretas++;
    }
  }

  const todasCorretas = posicoesCorretas === ordemCorreta.length;

  let pontuacao: number;
  if (todasCorretas) {
    pontuacao = 100;
  } else if (pontuacaoParcial) {
    pontuacao = Math.round((posicoesCorretas / ordemCorreta.length) * 100);
  } else {
    pontuacao = 0;
  }

  return {
    correta: todasCorretas,
    pontuacao,
    detalhes: {
      itensCorretos: posicoesCorretas,
      totalItens: ordemCorreta.length,
    },
  };
}

// ==================== LACUNA ====================

export interface LacunaResposta {
  respostas: Record<string, string>; // { "1": "ls", "2": "cd" }
}

export function validateLacuna(
  resposta: LacunaResposta,
  config: LacunaConfig
): ValidationResult {
  const { lacunas, caseSensitive, pontuacaoParcial } = config;

  let lacunasCorretas = 0;

  for (const lacuna of lacunas) {
    const respostaAluno = resposta.respostas?.[lacuna.id] || "";
    const respostaComparar = caseSensitive
      ? respostaAluno.trim()
      : respostaAluno.trim().toLowerCase();

    const aceita = lacuna.respostasAceitas.some((aceita) => {
      const aceitaComparar = caseSensitive
        ? aceita.trim()
        : aceita.trim().toLowerCase();
      return respostaComparar === aceitaComparar;
    });

    if (aceita) {
      lacunasCorretas++;
    }
  }

  const todasCorretas = lacunasCorretas === lacunas.length;

  let pontuacao: number;
  if (todasCorretas) {
    pontuacao = 100;
  } else if (pontuacaoParcial) {
    pontuacao = Math.round((lacunasCorretas / lacunas.length) * 100);
  } else {
    pontuacao = 0;
  }

  return {
    correta: todasCorretas,
    pontuacao,
    detalhes: {
      itensCorretos: lacunasCorretas,
      totalItens: lacunas.length,
    },
  };
}

// ==================== HOTSPOT ====================

export interface HotspotResposta {
  areasSelecionadas: string[];
}

export function validateHotspot(
  resposta: HotspotResposta,
  config: HotspotConfig
): ValidationResult {
  const { areas, multiplosCliques } = config;

  const areasCorretas = areas.filter((a) => a.correta);
  const areasSelecionadas = resposta.areasSelecionadas || [];

  // Contar seleções corretas
  const selecoesCorretas = areasSelecionadas.filter((areaId) =>
    areasCorretas.some((a) => a.id === areaId)
  ).length;

  // Contar seleções incorretas
  const selecoesIncorretas = areasSelecionadas.filter(
    (areaId) => !areasCorretas.some((a) => a.id === areaId)
  ).length;

  let todasCorretas: boolean;
  if (multiplosCliques) {
    // Deve selecionar todas as corretas e nenhuma incorreta
    todasCorretas =
      selecoesCorretas === areasCorretas.length && selecoesIncorretas === 0;
  } else {
    // Deve selecionar exatamente uma área correta
    todasCorretas = selecoesCorretas === 1 && selecoesIncorretas === 0;
  }

  const pontuacao = todasCorretas ? 100 : 0;

  return {
    correta: todasCorretas,
    pontuacao,
    detalhes: {
      itensCorretos: selecoesCorretas,
      totalItens: areasCorretas.length,
    },
  };
}

// ==================== COMANDO ====================

export interface ComandoResposta {
  comando: string;
}

export function validateComando(
  resposta: ComandoResposta,
  config: ComandoConfig
): ValidationResult {
  const { respostasAceitas, caseSensitive, ignorarEspacosExtras } = config;

  let comandoAluno = resposta.comando || "";

  // Processar comando do aluno
  if (ignorarEspacosExtras) {
    comandoAluno = comandoAluno.trim().replace(/\s+/g, " ");
  }
  if (!caseSensitive) {
    comandoAluno = comandoAluno.toLowerCase();
  }

  // Verificar se alguma resposta aceita corresponde
  const correta = respostasAceitas.some((aceita) => {
    let aceitaProcessado = aceita;
    if (ignorarEspacosExtras) {
      aceitaProcessado = aceitaProcessado.trim().replace(/\s+/g, " ");
    }
    if (!caseSensitive) {
      aceitaProcessado = aceitaProcessado.toLowerCase();
    }
    return comandoAluno === aceitaProcessado;
  });

  return {
    correta,
    pontuacao: correta ? 100 : 0,
  };
}

// ==================== VALIDADOR UNIFICADO ====================

export type QuestaoAvancadaResposta =
  | { tipo: "DRAG_DROP"; resposta: DragDropResposta }
  | { tipo: "ASSOCIACAO"; resposta: AssociacaoResposta }
  | { tipo: "ORDENACAO"; resposta: OrdenacaoResposta }
  | { tipo: "LACUNA"; resposta: LacunaResposta }
  | { tipo: "HOTSPOT"; resposta: HotspotResposta }
  | { tipo: "COMANDO"; resposta: ComandoResposta };

export function validateQuestaoAvancada(
  tipo: string,
  resposta: unknown,
  config: unknown
): ValidationResult {
  switch (tipo) {
    case "DRAG_DROP":
      return validateDragDrop(
        resposta as DragDropResposta,
        config as DragDropConfig
      );
    case "ASSOCIACAO":
      return validateAssociacao(
        resposta as AssociacaoResposta,
        config as AssociacaoConfig
      );
    case "ORDENACAO":
      return validateOrdenacao(
        resposta as OrdenacaoResposta,
        config as OrdenacaoConfig
      );
    case "LACUNA":
      return validateLacuna(
        resposta as LacunaResposta,
        config as LacunaConfig
      );
    case "HOTSPOT":
      return validateHotspot(
        resposta as HotspotResposta,
        config as HotspotConfig
      );
    case "COMANDO":
      return validateComando(
        resposta as ComandoResposta,
        config as ComandoConfig
      );
    default:
      return { correta: false, pontuacao: 0 };
  }
}
