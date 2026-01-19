import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { TipoQuestao, Prisma } from "@prisma/client";
import { notifyResultadoDisponivel } from "@/lib/notifications";
import { verificarConquistas } from "@/lib/conquistas";

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

    // Verificar conquistas após submissão
    verificarConquistas(session.user.id).catch((err) =>
      console.error("Erro ao verificar conquistas:", err)
    );

    return NextResponse.json({
      success: true,
      resultado: {
        nota: tentativaAtualizada.nota,
        totalAcertos: tentativaAtualizada.totalAcertos,
        totalQuestoes: tentativaAtualizada.totalQuestoes,
        tempoGasto: tentativaAtualizada.tempoGasto,
        aprovado: nota >= tentativa.prova.notaMinima,
        notaMinima: tentativa.prova.notaMinima,
        mostrarResultado: tentativa.prova.mostrarResultado,
      },
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
      // resposta = { ordem: ["id1", "id2", "id3"] }
      const respostaObj = resposta as { ordem?: string[] };
      const ordemCorreta = alternativas
        .sort((a, b) => {
          // Assumindo que a ordem está no campo `ordem` ou similar
          return 0; // Precisaria de mais dados
        })
        .map((a) => a.id);

      const ordemResposta = respostaObj.ordem || [];
      const correta =
        JSON.stringify(ordemCorreta) === JSON.stringify(ordemResposta);

      return { correta, pontuacao: correta ? 1 : 0 };
    }

    case "ASSOCIACAO": {
      // resposta = { associacoes: { "itemA": "itemB", ... } }
      const respostaObj = resposta as { associacoes?: Record<string, string> };
      const configObj = configuracao as { pares?: { esquerda: string; direita: string }[] };

      if (!configObj?.pares || !respostaObj.associacoes) {
        return { correta: false, pontuacao: 0 };
      }

      let acertos = 0;
      configObj.pares.forEach((par) => {
        if (respostaObj.associacoes?.[par.esquerda] === par.direita) {
          acertos++;
        }
      });

      const pontuacao = acertos / configObj.pares.length;
      return { correta: pontuacao === 1, pontuacao };
    }

    case "LACUNA": {
      // resposta = { lacunas: { "0": "texto", "1": "texto2" } }
      const respostaObj = resposta as { lacunas?: Record<string, string> };
      const configObj = configuracao as { lacunas?: { indice: number; resposta: string }[] };

      if (!configObj?.lacunas || !respostaObj.lacunas) {
        return { correta: false, pontuacao: 0 };
      }

      let acertos = 0;
      configObj.lacunas.forEach((lacuna) => {
        const respostaLacuna = respostaObj.lacunas?.[lacuna.indice.toString()]?.trim().toLowerCase();
        if (respostaLacuna === lacuna.resposta.trim().toLowerCase()) {
          acertos++;
        }
      });

      const pontuacao = acertos / configObj.lacunas.length;
      return { correta: pontuacao === 1, pontuacao };
    }

    case "DRAG_DROP": {
      // Implementação similar a associação
      return { correta: false, pontuacao: 0 };
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
