import { db } from "@/lib/db";
import type { Dificuldade } from "@prisma/client";

interface GerarProvasInput {
  simuladoId: string;
  questoesPorProva: number;
  quantidadeProvas: number;
  dificuldades?: string[];
  percentuais?: {
    FACIL: number;
    MEDIO: number;
    DIFICIL: number;
  };
  embaralharQuestoes?: boolean;
  embaralharAlternativas?: boolean;
  nomeBase?: string;
}

interface GerarProvasResult {
  provasGeradas: number;
  questoesUsadas: number;
  questoesRestantes: number;
  provas: { id: string; codigo: string }[];
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique prova code
async function generateProvaCode(categoria: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = categoria.toUpperCase().slice(0, 4);

  // Find the last code for this category and year
  const lastProva = await db.prova.findFirst({
    where: {
      codigo: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      codigo: "desc",
    },
    select: {
      codigo: true,
    },
  });

  let nextNumber = 1;
  if (lastProva) {
    const lastNumber = parseInt(lastProva.codigo.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${year}-${String(nextNumber).padStart(3, "0")}`;
}

export async function gerarProvas(
  input: GerarProvasInput
): Promise<GerarProvasResult> {
  const {
    simuladoId,
    questoesPorProva,
    quantidadeProvas,
    dificuldades,
    percentuais,
    embaralharQuestoes = true,
    embaralharAlternativas = true,
  } = input;

  // 1. Get simulado info
  const simulado = await db.simulado.findUnique({
    where: { id: simuladoId },
    select: {
      id: true,
      nome: true,
      categoria: true,
    },
  });

  if (!simulado) {
    throw new Error("Simulado não encontrado");
  }

  // 2. Get available questions (active and not in active provas)
  const questoesEmProvasAtivas = await db.provaQuestao.findMany({
    where: {
      prova: {
        simuladoId,
        status: { in: ["PUBLICADA"] },
      },
    },
    select: {
      questaoId: true,
    },
  });

  const questaoIdsEmUso = new Set(questoesEmProvasAtivas.map((pq) => pq.questaoId));

  // Build query for available questions
  const whereClause: Record<string, unknown> = {
    simuladoId,
    ativo: true,
    id: {
      notIn: Array.from(questaoIdsEmUso),
    },
  };

  // Apply difficulty filter
  if (dificuldades && dificuldades.length > 0) {
    whereClause.dificuldade = { in: dificuldades };
  }

  const questoesDisponiveis = await db.questao.findMany({
    where: whereClause,
    select: {
      id: true,
      dificuldade: true,
    },
  });

  const totalNecessario = questoesPorProva * quantidadeProvas;

  if (questoesDisponiveis.length < totalNecessario) {
    throw new Error(
      `Questões disponíveis (${questoesDisponiveis.length}) insuficientes para criar ${quantidadeProvas} prova(s) com ${questoesPorProva} questões cada`
    );
  }

  // 3. Group questions by difficulty if using percentages
  const porDificuldade: Record<Dificuldade, { id: string }[]> = {
    FACIL: questoesDisponiveis.filter((q) => q.dificuldade === "FACIL"),
    MEDIO: questoesDisponiveis.filter((q) => q.dificuldade === "MEDIO"),
    DIFICIL: questoesDisponiveis.filter((q) => q.dificuldade === "DIFICIL"),
  };

  // Shuffle each difficulty pool
  const poolFacil = shuffleArray(porDificuldade.FACIL);
  const poolMedio = shuffleArray(porDificuldade.MEDIO);
  const poolDificil = shuffleArray(porDificuldade.DIFICIL);
  const poolGeral = shuffleArray(questoesDisponiveis);

  // Track used questions across provas
  const questoesUsadas = new Set<string>();

  // 4. Create provas
  const provasCriadas: { id: string; codigo: string }[] = [];

  for (let i = 0; i < quantidadeProvas; i++) {
    let questoesDaProva: { id: string }[] = [];

    if (percentuais) {
      const qtdFacil = Math.round((percentuais.FACIL / 100) * questoesPorProva);
      const qtdMedio = Math.round((percentuais.MEDIO / 100) * questoesPorProva);
      const qtdDificil = questoesPorProva - qtdFacil - qtdMedio;

      // Select from each pool, avoiding already used questions
      const selecionadasFacil = poolFacil
        .filter((q) => !questoesUsadas.has(q.id))
        .slice(0, qtdFacil);
      const selecionadasMedio = poolMedio
        .filter((q) => !questoesUsadas.has(q.id))
        .slice(0, qtdMedio);
      const selecionadasDificil = poolDificil
        .filter((q) => !questoesUsadas.has(q.id))
        .slice(0, qtdDificil);

      if (
        selecionadasFacil.length < qtdFacil ||
        selecionadasMedio.length < qtdMedio ||
        selecionadasDificil.length < qtdDificil
      ) {
        throw new Error(
          `Questões insuficientes por dificuldade para criar prova ${i + 1}`
        );
      }

      questoesDaProva = [
        ...selecionadasFacil,
        ...selecionadasMedio,
        ...selecionadasDificil,
      ];
    } else {
      // Select from general pool
      questoesDaProva = poolGeral
        .filter((q) => !questoesUsadas.has(q.id))
        .slice(0, questoesPorProva);

      if (questoesDaProva.length < questoesPorProva) {
        throw new Error(`Questões insuficientes para criar prova ${i + 1}`);
      }
    }

    // Mark questions as used
    questoesDaProva.forEach((q) => questoesUsadas.add(q.id));

    // Shuffle questions if requested
    if (embaralharQuestoes) {
      questoesDaProva = shuffleArray(questoesDaProva);
    }

    // Generate unique code
    const codigo = await generateProvaCode(simulado.categoria);

    // Generate prova name
    const nome = `${simulado.nome} - Prova ${i + 1}`;

    // Create prova
    const prova = await db.prova.create({
      data: {
        simuladoId,
        codigo,
        nome,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes: {
          create: questoesDaProva.map((q, index) => ({
            questaoId: q.id,
            ordem: index + 1,
          })),
        },
      },
      select: {
        id: true,
        codigo: true,
      },
    });

    provasCriadas.push(prova);
  }

  return {
    provasGeradas: provasCriadas.length,
    questoesUsadas: questoesUsadas.size,
    questoesRestantes: questoesDisponiveis.length - questoesUsadas.size,
    provas: provasCriadas,
  };
}

// Preview function to calculate how many provas can be generated
export async function previewGeracaoProvas(
  input: Omit<GerarProvasInput, "nomeBase">
): Promise<{
  questoesDisponiveis: number;
  provasPossiveis: number;
  questoesPorDificuldade: Record<Dificuldade, number>;
}> {
  const { simuladoId, questoesPorProva, dificuldades, percentuais } = input;

  // Get questions in active provas
  const questoesEmProvasAtivas = await db.provaQuestao.findMany({
    where: {
      prova: {
        simuladoId,
        status: { in: ["RASCUNHO", "PUBLICADA"] },
      },
    },
    select: {
      questaoId: true,
    },
  });

  const questaoIdsEmUso = new Set(questoesEmProvasAtivas.map((pq) => pq.questaoId));

  // Build query
  const whereClause: Record<string, unknown> = {
    simuladoId,
    ativo: true,
    id: {
      notIn: Array.from(questaoIdsEmUso),
    },
  };

  if (dificuldades && dificuldades.length > 0) {
    whereClause.dificuldade = { in: dificuldades };
  }

  const questoesDisponiveis = await db.questao.findMany({
    where: whereClause,
    select: {
      id: true,
      dificuldade: true,
    },
  });

  // Count by difficulty
  const questoesPorDificuldade: Record<Dificuldade, number> = {
    FACIL: questoesDisponiveis.filter((q) => q.dificuldade === "FACIL").length,
    MEDIO: questoesDisponiveis.filter((q) => q.dificuldade === "MEDIO").length,
    DIFICIL: questoesDisponiveis.filter((q) => q.dificuldade === "DIFICIL").length,
  };

  // Calculate possible provas
  let provasPossiveis = Math.floor(
    questoesDisponiveis.length / questoesPorProva
  );

  // If using percentages, check limits for each difficulty
  if (percentuais) {
    const qtdFacil = Math.round((percentuais.FACIL / 100) * questoesPorProva);
    const qtdMedio = Math.round((percentuais.MEDIO / 100) * questoesPorProva);
    const qtdDificil = questoesPorProva - qtdFacil - qtdMedio;

    const provasPorFacil =
      qtdFacil > 0 ? Math.floor(questoesPorDificuldade.FACIL / qtdFacil) : Infinity;
    const provasPorMedio =
      qtdMedio > 0 ? Math.floor(questoesPorDificuldade.MEDIO / qtdMedio) : Infinity;
    const provasPorDificil =
      qtdDificil > 0
        ? Math.floor(questoesPorDificuldade.DIFICIL / qtdDificil)
        : Infinity;

    provasPossiveis = Math.min(
      provasPossiveis,
      provasPorFacil,
      provasPorMedio,
      provasPorDificil
    );
  }

  return {
    questoesDisponiveis: questoesDisponiveis.length,
    provasPossiveis,
    questoesPorDificuldade,
  };
}
