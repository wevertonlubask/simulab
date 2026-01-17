import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar detalhes da tentativa com questões
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a tentativa
    const tentativa = await db.tentativa.findUnique({
      where: { id },
      include: {
        prova: {
          include: {
            simulado: {
              select: {
                nome: true,
                categoria: true,
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

    // Verificar status da tentativa
    if (tentativa.status !== "EM_ANDAMENTO") {
      return NextResponse.json(
        { error: "Esta tentativa já foi finalizada", status: tentativa.status },
        { status: 400 }
      );
    }

    // Calcular tempo restante
    let tempoRestante: number | null = null;
    if (tentativa.prova.tempoLimite) {
      const tempoLimiteMs = tentativa.prova.tempoLimite * 60 * 1000;
      const tempoDecorrido = Date.now() - tentativa.dataInicio.getTime();
      tempoRestante = Math.max(0, tempoLimiteMs - tempoDecorrido);

      // Se tempo esgotado, finalizar tentativa
      if (tempoRestante <= 0) {
        await db.tentativa.update({
          where: { id },
          data: {
            status: "EXPIRADA",
            dataFim: new Date(),
          },
        });

        return NextResponse.json(
          { error: "O tempo da prova expirou", status: "EXPIRADA" },
          { status: 400 }
        );
      }
    }

    // Preparar questões (embaralhar se configurado)
    let questoes = tentativa.prova.questoes.map((pq) => {
      const resposta = tentativa.respostas.find(
        (r) => r.provaQuestaoId === pq.id
      );

      // Preparar alternativas (embaralhar se configurado e não tiver resposta salva)
      let alternativas = pq.questao.alternativas.map((alt) => ({
        id: alt.id,
        texto: alt.texto,
        imagemUrl: alt.imagemUrl,
      }));

      if (tentativa.prova.embaralharAlternativas && !resposta) {
        alternativas = shuffleArray(alternativas);
      }

      return {
        provaQuestaoId: pq.id,
        ordem: pq.ordem,
        questaoId: pq.questao.id,
        tipo: pq.questao.tipo,
        enunciado: pq.questao.enunciado,
        imagemUrl: pq.questao.imagemUrl,
        configuracao: pq.questao.configuracao,
        alternativas,
        resposta: resposta
          ? {
              id: resposta.id,
              resposta: resposta.resposta,
              marcadaRevisao: resposta.marcadaRevisao,
            }
          : null,
      };
    });

    // Embaralhar questões se configurado (apenas na primeira vez, baseado em respostas)
    if (tentativa.prova.embaralharQuestoes && tentativa.respostas.length === 0) {
      questoes = shuffleArray(questoes);
    }

    return NextResponse.json({
      tentativa: {
        id: tentativa.id,
        numero: tentativa.numero,
        dataInicio: tentativa.dataInicio,
        status: tentativa.status,
      },
      prova: {
        id: tentativa.prova.id,
        nome: tentativa.prova.nome,
        codigo: tentativa.prova.codigo,
        tempoLimite: tentativa.prova.tempoLimite,
        mostrarResultado: tentativa.prova.mostrarResultado,
        simulado: tentativa.prova.simulado,
      },
      tempoRestante,
      totalQuestoes: questoes.length,
      questoesRespondidas: tentativa.respostas.filter((r) => r.resposta !== null)
        .length,
      questoesMarcadas: tentativa.respostas.filter((r) => r.marcadaRevisao)
        .length,
      questoes,
    });
  } catch (error) {
    console.error("Erro ao buscar tentativa:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tentativa" },
      { status: 500 }
    );
  }
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
