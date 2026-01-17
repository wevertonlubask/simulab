import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar resultado detalhado da tentativa
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a tentativa com todos os detalhes
    const tentativa = await db.tentativa.findUnique({
      where: { id },
      include: {
        prova: {
          include: {
            simulado: {
              select: {
                nome: true,
                categoria: true,
                subcategoria: true,
              },
            },
            questoes: {
              include: {
                questao: {
                  include: {
                    alternativas: {
                      orderBy: { ordem: "asc" },
                    },
                  },
                },
              },
              orderBy: { ordem: "asc" },
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

    // Verificar se a tentativa foi finalizada
    if (tentativa.status === "EM_ANDAMENTO") {
      return NextResponse.json(
        { error: "Esta tentativa ainda está em andamento" },
        { status: 400 }
      );
    }

    // Verificar se pode ver resultado detalhado
    const now = new Date();
    let podeVerDetalhes = false;

    switch (tentativa.prova.mostrarResultado) {
      case "IMEDIATO":
        podeVerDetalhes = true;
        break;
      case "DATA":
        if (tentativa.prova.dataResultado && tentativa.prova.dataResultado <= now) {
          podeVerDetalhes = true;
        }
        break;
      case "NUNCA":
        podeVerDetalhes = false;
        break;
    }

    // Preparar questões com respostas
    const questoesComResultado = tentativa.prova.questoes.map((pq) => {
      const resposta = tentativa.respostas.find(
        (r) => r.provaQuestaoId === pq.id
      );

      const questaoBase = {
        provaQuestaoId: pq.id,
        ordem: pq.ordem,
        questaoId: pq.questao.id,
        tipo: pq.questao.tipo,
        enunciado: pq.questao.enunciado,
        imagemUrl: pq.questao.imagemUrl,
        dificuldade: pq.questao.dificuldade,
        peso: pq.questao.peso,
      };

      if (!podeVerDetalhes) {
        return {
          ...questaoBase,
          respondida: resposta !== undefined,
          correta: resposta?.correta,
        };
      }

      // Com detalhes completos
      return {
        ...questaoBase,
        explicacao: pq.questao.explicacao,
        alternativas: pq.questao.alternativas.map((alt) => ({
          id: alt.id,
          texto: alt.texto,
          imagemUrl: alt.imagemUrl,
          correta: alt.correta,
        })),
        configuracao: pq.questao.configuracao,
        resposta: resposta
          ? {
              id: resposta.id,
              resposta: resposta.resposta,
              correta: resposta.correta,
              pontuacao: resposta.pontuacao,
              tempoResposta: resposta.tempoResposta,
            }
          : null,
      };
    });

    // Estatísticas por dificuldade
    const estatisticasPorDificuldade = {
      FACIL: { total: 0, acertos: 0 },
      MEDIO: { total: 0, acertos: 0 },
      DIFICIL: { total: 0, acertos: 0 },
    };

    tentativa.prova.questoes.forEach((pq) => {
      const dificuldade = pq.questao.dificuldade;
      const resposta = tentativa.respostas.find(
        (r) => r.provaQuestaoId === pq.id
      );

      estatisticasPorDificuldade[dificuldade].total++;
      if (resposta?.correta) {
        estatisticasPorDificuldade[dificuldade].acertos++;
      }
    });

    // Estatísticas por tipo de questão
    const estatisticasPorTipo: Record<string, { total: number; acertos: number }> = {};

    tentativa.prova.questoes.forEach((pq) => {
      const tipo = pq.questao.tipo;
      const resposta = tentativa.respostas.find(
        (r) => r.provaQuestaoId === pq.id
      );

      if (!estatisticasPorTipo[tipo]) {
        estatisticasPorTipo[tipo] = { total: 0, acertos: 0 };
      }

      estatisticasPorTipo[tipo].total++;
      if (resposta?.correta) {
        estatisticasPorTipo[tipo].acertos++;
      }
    });

    return NextResponse.json({
      tentativa: {
        id: tentativa.id,
        numero: tentativa.numero,
        dataInicio: tentativa.dataInicio,
        dataFim: tentativa.dataFim,
        tempoGasto: tentativa.tempoGasto,
        nota: tentativa.nota,
        totalAcertos: tentativa.totalAcertos,
        totalQuestoes: tentativa.totalQuestoes,
        status: tentativa.status,
      },
      prova: {
        id: tentativa.prova.id,
        nome: tentativa.prova.nome,
        codigo: tentativa.prova.codigo,
        tempoLimite: tentativa.prova.tempoLimite,
        notaMinima: tentativa.prova.notaMinima,
        mostrarResultado: tentativa.prova.mostrarResultado,
        dataResultado: tentativa.prova.dataResultado,
        simulado: tentativa.prova.simulado,
      },
      podeVerDetalhes,
      aprovado: (tentativa.nota || 0) >= tentativa.prova.notaMinima,
      questoes: questoesComResultado,
      estatisticas: {
        porDificuldade: estatisticasPorDificuldade,
        porTipo: estatisticasPorTipo,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resultado:", error);
    return NextResponse.json(
      { error: "Erro ao buscar resultado" },
      { status: 500 }
    );
  }
}
