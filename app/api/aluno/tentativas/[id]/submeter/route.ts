import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { TipoQuestao, Prisma } from "@prisma/client";
import { notifyResultadoDisponivel } from "@/lib/notifications";
import { processarSubmissaoProva } from "@/lib/gamification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Submeter/Finalizar a prova
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a tentativa com todas as informações necessárias
    const tentativa = await db.tentativa.findUnique({
      where: { id },
      include: {
        prova: {
          include: {
            questoes: {
              include: {
                questao: {
                  include: {
                    alternativas: true,
                  },
                },
              },
            },
          },
        },
        respostas: true,
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a tentativa pertence ao aluno
    if (tentativa.alunoId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem acesso a esta tentativa" },
        { status: 403 }
      );
    }

    // Verificar status da tentativa
    if (tentativa.status !== "EM_ANDAMENTO") {
      return NextResponse.json(
        { error: "Esta tentativa já foi finalizada" },
        { status: 400 }
      );
    }

    // Calcular tempo gasto
    const tempoGasto = Math.round(
      (Date.now() - tentativa.dataInicio.getTime()) / 1000
    ); // em segundos

    // Corrigir as respostas
    let totalAcertos = 0;
    let totalPontos = 0;
    let totalPesoQuestoes = 0;

    const correcoesPromises = tentativa.prova.questoes.map(async (pq) => {
      const resposta = tentativa.respostas.find(
        (r) => r.provaQuestaoId === pq.id
      );

      totalPesoQuestoes += pq.questao.peso;

      if (!resposta || resposta.resposta === null) {
        // Questão não respondida
        return;
      }

      const { correta, pontuacao } = avaliarResposta(
        pq.questao.tipo,
        resposta.resposta as Prisma.JsonValue,
        pq.questao.alternativas,
        pq.questao.configuracao as Prisma.JsonValue
      );

      if (correta) {
        totalAcertos++;
      }

      totalPontos += pontuacao * pq.questao.peso;

      // Atualizar a resposta com o resultado da correção
      await db.resposta.update({
        where: { id: resposta.id },
        data: {
          correta,
          pontuacao,
        },
      });
    });

    await Promise.all(correcoesPromises);

    // Calcular nota final (0-100)
    const nota =
      totalPesoQuestoes > 0 ? (totalPontos / totalPesoQuestoes) * 100 : 0;

    // Atualizar a tentativa
    const tentativaAtualizada = await db.tentativa.update({
      where: { id },
      data: {
        status: "SUBMETIDA",
        dataFim: new Date(),
        tempoGasto,
        nota,
        totalAcertos,
        totalQuestoes: tentativa.prova.questoes.length,
      },
    });

    // Notificar aluno se o resultado for imediato
    if (tentativa.prova.mostrarResultado === "IMEDIATO") {
      notifyResultadoDisponivel(
        session.user.id,
        { id: tentativa.prova.id, nome: tentativa.prova.nome },
        tentativaAtualizada.id
      ).catch((err) => console.error("Erro ao notificar resultado:", err));
    }

    // Verificar se é a primeira prova do simulado para este aluno
    const tentativasDoSimulado = await db.tentativa.count({
      where: {
        alunoId: session.user.id,
        prova: {
          simuladoId: tentativa.prova.simuladoId,
        },
        status: "SUBMETIDA",
      },
    });
    const primeiraProvaSimulado = tentativasDoSimulado === 1;

    // Buscar categoria do simulado
    const simulado = await db.simulado.findUnique({
      where: { id: tentativa.prova.simuladoId },
      select: { categoria: true },
    });

    // Calcular acertos consecutivos (para conquista Sniper)
    const respostasOrdenadas = tentativa.respostas
      .filter((r) => r.correta !== null)
      .sort((a, b) => {
        const ordemA = tentativa.prova.questoes.find(q => q.id === a.provaQuestaoId)?.ordem ?? 0;
        const ordemB = tentativa.prova.questoes.find(q => q.id === b.provaQuestaoId)?.ordem ?? 0;
        return ordemA - ordemB;
      });

    let acertosConsecutivos = 0;
    let maxAcertosConsecutivos = 0;
    for (const resp of respostasOrdenadas) {
      if (resp.correta) {
        acertosConsecutivos++;
        maxAcertosConsecutivos = Math.max(maxAcertosConsecutivos, acertosConsecutivos);
      } else {
        acertosConsecutivos = 0;
      }
    }

    // Processar gamificação (XP, níveis, conquistas)
    const aprovado = nota >= tentativa.prova.notaMinima;
    let gamificacaoResult = null;
    try {
      gamificacaoResult = await processarSubmissaoProva(session.user.id, {
        nota,
        aprovado,
        tempoGasto,
        tempoLimite: tentativa.prova.tempoLimite ?? undefined,
        acertosConsecutivos: maxAcertosConsecutivos,
        categoria: simulado?.categoria || "Geral",
        primeiraProvaSimulado,
      });
    } catch (err) {
      console.error("Erro ao processar gamificação:", err);
    }

    return NextResponse.json({
      success: true,
      resultado: {
        nota: tentativaAtualizada.nota,
        totalAcertos: tentativaAtualizada.totalAcertos,
        totalQuestoes: tentativaAtualizada.totalQuestoes,
        tempoGasto: tentativaAtualizada.tempoGasto,
        aprovado,
        notaMinima: tentativa.prova.notaMinima,
        mostrarResultado: tentativa.prova.mostrarResultado,
      },
      gamificacao: gamificacaoResult,
    });
  } catch (error) {
    console.error("Erro ao submeter prova:", error);
    return NextResponse.json(
      { error: "Erro ao submeter prova" },
      { status: 500 }
    );
  }
}

interface Alternativa {
  id: string;
  correta: boolean;
}

// Função para avaliar a resposta baseada no tipo de questão
function avaliarResposta(
  tipo: TipoQuestao,
  resposta: Prisma.JsonValue,
  alternativas: Alternativa[],
  configuracao: Prisma.JsonValue
): { correta: boolean; pontuacao: number } {
  switch (tipo) {
    case "MULTIPLA_ESCOLHA_UNICA": {
      // resposta = { alternativaId: "xxx" }
      const respostaObj = resposta as { alternativaId?: string };
      const alternativaCorreta = alternativas.find((a) => a.correta);
      const correta = respostaObj.alternativaId === alternativaCorreta?.id;
      return { correta, pontuacao: correta ? 1 : 0 };
    }

    case "MULTIPLA_ESCOLHA_MULTIPLA": {
      // resposta = { alternativasIds: ["xxx", "yyy"] }
      const respostaObj = resposta as { alternativasIds?: string[] };
      const alternativasCorretas = alternativas
        .filter((a) => a.correta)
        .map((a) => a.id);
      const alternativasSelecionadas = respostaObj.alternativasIds || [];

      // Verificar se as seleções são exatamente as corretas
      const todasCorretas =
        alternativasCorretas.every((id) =>
          alternativasSelecionadas.includes(id)
        ) &&
        alternativasSelecionadas.every((id) =>
          alternativasCorretas.includes(id)
        );

      if (todasCorretas) {
        return { correta: true, pontuacao: 1 };
      }

      // Pontuação parcial
      const acertos = alternativasSelecionadas.filter((id) =>
        alternativasCorretas.includes(id)
      ).length;
      const erros = alternativasSelecionadas.filter(
        (id) => !alternativasCorretas.includes(id)
      ).length;
      const pontuacaoParcial = Math.max(
        0,
        (acertos - erros) / alternativasCorretas.length
      );

      return { correta: false, pontuacao: pontuacaoParcial };
    }

    case "ORDENACAO": {
      // Novo formato: resposta = { ordem: ["id1", "id2", "id3"] }
      // Config = { itens: [{ id, texto, ordemCorreta }], pontuacaoParcial }
      const respostaObj = resposta as { ordem?: string[] };
      const configObj = configuracao as {
        itens?: { id: string; ordemCorreta: number }[];
        pontuacaoParcial?: boolean;
      };

      const ordemResposta = respostaObj.ordem || [];

      // Novo formato (config com itens e ordemCorreta)
      if (configObj?.itens && configObj.itens.length > 0) {
        // Obter ordem correta baseada no campo ordemCorreta
        const ordemCorreta = [...configObj.itens]
          .sort((a, b) => a.ordemCorreta - b.ordemCorreta)
          .map((item) => item.id);

        if (ordemResposta.length !== ordemCorreta.length) {
          return { correta: false, pontuacao: 0 };
        }

        // Contar quantos estão na posição correta
        let acertos = 0;
        for (let i = 0; i < ordemCorreta.length; i++) {
          if (ordemResposta[i] === ordemCorreta[i]) {
            acertos++;
          }
        }

        const pontuacao = acertos / ordemCorreta.length;
        const todasCorretas = acertos === ordemCorreta.length;
        return { correta: todasCorretas, pontuacao: todasCorretas ? 1 : pontuacao };
      }

      // Formato antigo (usando alternativas)
      const ordemCorreta = alternativas
        .sort((a, b) => {
          // Usar o campo ordem das alternativas
          const ordemA = (a as { ordem?: number }).ordem ?? 0;
          const ordemB = (b as { ordem?: number }).ordem ?? 0;
          return ordemA - ordemB;
        })
        .map((a) => a.id);

      const correta =
        JSON.stringify(ordemCorreta) === JSON.stringify(ordemResposta);

      return { correta, pontuacao: correta ? 1 : 0 };
    }

    case "ASSOCIACAO": {
      // Novo formato: resposta = { conexoes: [{ de: "idA", para: "idB" }] }
      // Config = { colunaA, colunaB, conexoesCorretas: [{ de, para }] }
      const respostaObj = resposta as {
        conexoes?: { de: string; para: string }[];
        associacoes?: Record<string, string>; // Formato antigo (fallback)
      };
      const configObj = configuracao as {
        conexoesCorretas?: { de: string; para: string }[];
        pares?: { esquerda: string; direita: string }[]; // Formato antigo (fallback)
        pontuacaoParcial?: boolean;
      };

      // Novo formato (conexoes)
      if (configObj?.conexoesCorretas && respostaObj?.conexoes) {
        const conexoesCorretas = configObj.conexoesCorretas;
        const conexoesUsuario = respostaObj.conexoes;

        let acertos = 0;
        conexoesCorretas.forEach((correta) => {
          const encontrada = conexoesUsuario.some(
            (c) => c.de === correta.de && c.para === correta.para
          );
          if (encontrada) {
            acertos++;
          }
        });

        // Penalizar conexões erradas
        const erros = conexoesUsuario.filter(
          (c) => !conexoesCorretas.some((correta) => correta.de === c.de && correta.para === c.para)
        ).length;

        const pontuacaoBruta = acertos / conexoesCorretas.length;
        const penalidade = erros / conexoesCorretas.length;
        const pontuacao = Math.max(0, pontuacaoBruta - (configObj.pontuacaoParcial === false ? 0 : penalidade * 0.5));

        return { correta: acertos === conexoesCorretas.length && erros === 0, pontuacao: acertos === conexoesCorretas.length && erros === 0 ? 1 : pontuacao };
      }

      // Formato antigo (fallback)
      if (configObj?.pares && respostaObj?.associacoes) {
        let acertos = 0;
        configObj.pares.forEach((par) => {
          if (respostaObj.associacoes?.[par.esquerda] === par.direita) {
            acertos++;
          }
        });

        const pontuacao = acertos / configObj.pares.length;
        return { correta: pontuacao === 1, pontuacao };
      }

      return { correta: false, pontuacao: 0 };
    }

    case "LACUNA": {
      // Novo formato: resposta = { respostas: { "lacunaId": "texto" } }
      // Config = { texto, lacunas: [{ id, respostasAceitas: string[] }], caseSensitive }
      const respostaObj = resposta as {
        respostas?: Record<string, string>;
        lacunas?: Record<string, string>; // Formato antigo (fallback)
      };
      const configObj = configuracao as {
        texto?: string;
        lacunas?: { id: string; respostasAceitas: string[] }[] | { indice: number; resposta: string }[];
        caseSensitive?: boolean;
        pontuacaoParcial?: boolean;
      };

      if (!configObj?.lacunas || configObj.lacunas.length === 0) {
        return { correta: false, pontuacao: 0 };
      }

      // Novo formato (respostas com IDs e respostasAceitas)
      const primeiroItem = configObj.lacunas[0];
      if (primeiroItem && "id" in primeiroItem && "respostasAceitas" in primeiroItem) {
        const lacunasConfig = configObj.lacunas as { id: string; respostasAceitas: string[] }[];
        const respostasUsuario = respostaObj.respostas || {};

        // Filtrar apenas lacunas que existem no texto (algumas podem ter sido removidas)
        const lacunasNoTexto = lacunasConfig.filter((_, index) => {
          const placeholder = `[LACUNA_${index + 1}]`;
          return configObj.texto?.includes(placeholder);
        });

        // Se não há lacunas no texto, usar todas as configuradas
        const lacunasParaAvaliar = lacunasNoTexto.length > 0 ? lacunasNoTexto : lacunasConfig;

        let acertos = 0;
        lacunasParaAvaliar.forEach((lacuna) => {
          const respostaAluno = respostasUsuario[lacuna.id]?.trim() || "";
          const respostaComparar = configObj.caseSensitive
            ? respostaAluno
            : respostaAluno.toLowerCase();

          const encontrada = lacuna.respostasAceitas.some((aceita) => {
            const aceitaComparar = configObj.caseSensitive
              ? aceita.trim()
              : aceita.trim().toLowerCase();
            return respostaComparar === aceitaComparar;
          });

          if (encontrada) {
            acertos++;
          }
        });

        const pontuacao = lacunasParaAvaliar.length > 0 ? acertos / lacunasParaAvaliar.length : 0;
        return { correta: pontuacao === 1, pontuacao };
      }

      // Formato antigo (fallback)
      const lacunasAntigo = configObj.lacunas as { indice: number; resposta: string }[];
      const lacunasUsuario = respostaObj.lacunas || {};

      let acertos = 0;
      lacunasAntigo.forEach((lacuna) => {
        const respostaLacuna = lacunasUsuario[lacuna.indice.toString()]?.trim().toLowerCase();
        if (respostaLacuna === lacuna.resposta.trim().toLowerCase()) {
          acertos++;
        }
      });

      const pontuacao = acertos / lacunasAntigo.length;
      return { correta: pontuacao === 1, pontuacao };
    }

    case "DRAG_DROP": {
      // Resposta = { posicoes: { zonaId: [itemId1, itemId2] } }
      // Config = { itens, zonas: [{ id, itensCorretos: [itemIds] }], pontuacaoParcial }
      const respostaObj = resposta as { posicoes?: Record<string, string[]> };
      const configObj = configuracao as {
        itens?: { id: string; texto: string }[];
        zonas?: { id: string; itensCorretos: string[] }[];
        pontuacaoParcial?: boolean;
      };

      if (!configObj?.zonas || !respostaObj?.posicoes) {
        return { correta: false, pontuacao: 0 };
      }

      // Criar um mapa de zona por ID para lookup rápido
      const zonasMap = new Map(configObj.zonas.map(z => [z.id, z]));

      // Todos os itens que precisam ser posicionados corretamente
      const todosItensCorretos = configObj.zonas.flatMap(z => z.itensCorretos || []);
      const totalItensCorretos = todosItensCorretos.length;

      if (totalItensCorretos === 0) {
        return { correta: true, pontuacao: 1 };
      }

      let totalCorretos = 0;
      let erros = 0;

      // Verificar cada zona na resposta do usuário
      Object.entries(respostaObj.posicoes).forEach(([zonaId, itensNaZona]) => {
        const zona = zonasMap.get(zonaId);

        if (!zona) {
          // Zona na resposta não existe na config - todos itens são erros
          erros += itensNaZona.length;
          return;
        }

        const itensCorretos = zona.itensCorretos || [];

        // Verificar cada item posicionado nesta zona
        itensNaZona.forEach((itemId) => {
          if (itensCorretos.includes(itemId)) {
            totalCorretos++;
          } else {
            erros++;
          }
        });
      });

      // Verificar itens não posicionados (que deveriam estar em alguma zona)
      const todosItensUsuario = Object.values(respostaObj.posicoes).flat();
      const itensNaoPosicionados = todosItensCorretos.filter(
        itemId => !todosItensUsuario.includes(itemId)
      );
      // Itens não posicionados contam como erros implícitos (não acertou)
      // Não precisamos adicionar a erros, pois já não estão em totalCorretos

      const pontuacaoBruta = totalCorretos / totalItensCorretos;
      const penalidade = erros > 0 ? (erros / totalItensCorretos) * 0.5 : 0;
      const pontuacaoFinal = configObj.pontuacaoParcial === false
        ? (totalCorretos === totalItensCorretos && erros === 0 ? 1 : 0)
        : Math.max(0, pontuacaoBruta - penalidade);

      const todasCorretas = totalCorretos === totalItensCorretos && erros === 0;
      return { correta: todasCorretas, pontuacao: todasCorretas ? 1 : pontuacaoFinal };
    }

    case "HOTSPOT": {
      // resposta = { cliques: [{ x, y, areaId }] }
      const configObj = configuracao as {
        areas?: { id: string; x: number; y: number; largura: number; altura: number; correta: boolean }[];
        multiplosCliques?: boolean;
      };
      const respostaObj = resposta as { cliques?: { x: number; y: number; areaId?: string }[] };

      if (!configObj?.areas || !respostaObj?.cliques || respostaObj.cliques.length === 0) {
        return { correta: false, pontuacao: 0 };
      }

      const areasCorretas = configObj.areas.filter((a) => a.correta);
      const areasIncorretas = configObj.areas.filter((a) => !a.correta);

      // Verificar quais áreas corretas foram clicadas
      const areasCorretasClicadas = areasCorretas.filter((area) =>
        respostaObj.cliques!.some((clique) => clique.areaId === area.id)
      );

      // Verificar se clicou em alguma área incorreta
      const clicouEmAreaIncorreta = areasIncorretas.some((area) =>
        respostaObj.cliques!.some((clique) => clique.areaId === area.id)
      );

      // Verificar cliques fora de qualquer área
      const cliquesForaDasAreas = respostaObj.cliques.filter((c) => !c.areaId).length;

      // Calcular pontuação
      const acertos = areasCorretasClicadas.length;
      const erros = clicouEmAreaIncorreta ? 1 : 0;

      // Considera correto se acertou todas as áreas corretas e não errou nenhuma
      const todasCorretas = acertos === areasCorretas.length && !clicouEmAreaIncorreta && cliquesForaDasAreas === 0;

      // Pontuação parcial baseada em acertos
      const pontuacao = areasCorretas.length > 0
        ? Math.max(0, (acertos - erros - cliquesForaDasAreas) / areasCorretas.length)
        : 0;

      return { correta: todasCorretas, pontuacao: todasCorretas ? 1 : pontuacao };
    }

    case "COMANDO": {
      // resposta = { comando: "texto do comando" }
      const respostaObj = resposta as { comando?: string };
      const configObj = configuracao as {
        respostasAceitas?: string[];
        caseSensitive?: boolean;
        ignorarEspacosExtras?: boolean;
      };

      if (!configObj?.respostasAceitas || !respostaObj.comando) {
        return { correta: false, pontuacao: 0 };
      }

      let comandoResposta = respostaObj.comando.trim();

      // Normalizar espaços extras se configurado
      if (configObj.ignorarEspacosExtras) {
        comandoResposta = comandoResposta.replace(/\s+/g, ' ');
      }

      // Converter para minúsculas se não for case sensitive
      if (!configObj.caseSensitive) {
        comandoResposta = comandoResposta.toLowerCase();
      }

      const correta = configObj.respostasAceitas.some((cmd) => {
        let cmdComparar = cmd.trim();

        if (configObj.ignorarEspacosExtras) {
          cmdComparar = cmdComparar.replace(/\s+/g, ' ');
        }

        if (!configObj.caseSensitive) {
          cmdComparar = cmdComparar.toLowerCase();
        }

        return comandoResposta === cmdComparar;
      });

      return { correta, pontuacao: correta ? 1 : 0 };
    }

    default:
      return { correta: false, pontuacao: 0 };
  }
}
