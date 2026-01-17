import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Buscar tentativa com respostas para dar feedback
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id } = await params;

    const tentativa = await db.tentativa.findUnique({
      where: { id },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        prova: {
          include: {
            simulado: {
              select: {
                id: true,
                nome: true,
                docenteId: true,
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

    // Verificar se o docente tem acesso
    if (
      tentativa.prova.simulado.docenteId !== user.id &&
      user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Mapear respostas por provaQuestaoId
    const respostasMap = new Map(
      tentativa.respostas.map((r) => [r.provaQuestaoId, r])
    );

    // Combinar questões com respostas
    const questoesComRespostas = tentativa.prova.questoes.map((pq) => {
      const resposta = respostasMap.get(pq.id);
      return {
        provaQuestaoId: pq.id,
        ordem: pq.ordem,
        questao: pq.questao,
        resposta: resposta
          ? {
              id: resposta.id,
              resposta: resposta.resposta,
              correta: resposta.correta,
              pontuacao: resposta.pontuacao,
              feedbackDocente: resposta.feedbackDocente,
              feedbackData: resposta.feedbackData,
            }
          : null,
      };
    });

    return NextResponse.json({
      tentativa: {
        id: tentativa.id,
        numero: tentativa.numero,
        nota: tentativa.nota,
        totalAcertos: tentativa.totalAcertos,
        totalQuestoes: tentativa.totalQuestoes,
        status: tentativa.status,
        dataInicio: tentativa.dataInicio,
        dataFim: tentativa.dataFim,
        tempoGasto: tentativa.tempoGasto,
      },
      aluno: tentativa.aluno,
      prova: {
        id: tentativa.prova.id,
        nome: tentativa.prova.nome,
        notaMinima: tentativa.prova.notaMinima,
        simulado: tentativa.prova.simulado,
      },
      questoes: questoesComRespostas,
    });
  } catch (error) {
    console.error("Erro ao buscar tentativa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

const feedbackSchema = z.object({
  respostaId: z.string(),
  feedback: z.string().min(1, "O feedback não pode estar vazio"),
});

// POST - Adicionar feedback a uma resposta
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id } = await params;
    const body = await request.json();

    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verificar se a resposta pertence à tentativa
    const resposta = await db.resposta.findFirst({
      where: {
        id: validation.data.respostaId,
        tentativaId: id,
      },
      include: {
        tentativa: {
          include: {
            prova: {
              include: {
                simulado: {
                  select: {
                    docenteId: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resposta) {
      return NextResponse.json(
        { error: "Resposta não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o docente tem acesso
    if (
      resposta.tentativa.prova.simulado.docenteId !== user.id &&
      user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Atualizar resposta com feedback
    const respostaAtualizada = await db.resposta.update({
      where: { id: validation.data.respostaId },
      data: {
        feedbackDocente: validation.data.feedback,
        feedbackData: new Date(),
        feedbackVisto: false,
      },
    });

    // Notificar aluno
    await createNotification({
      userId: resposta.tentativa.alunoId,
      tipo: "SISTEMA",
      titulo: "Novo feedback do professor",
      mensagem: `O professor deixou um comentário na sua prova "${resposta.tentativa.prova.nome}"`,
      link: `/aluno/provas/${resposta.tentativa.provaId}/resultado/${resposta.tentativaId}`,
      metadata: {
        tentativaId: resposta.tentativaId,
        respostaId: respostaAtualizada.id,
      },
    });

    return NextResponse.json({
      message: "Feedback adicionado com sucesso",
      resposta: {
        id: respostaAtualizada.id,
        feedbackDocente: respostaAtualizada.feedbackDocente,
        feedbackData: respostaAtualizada.feedbackData,
      },
    });
  } catch (error) {
    console.error("Erro ao adicionar feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Remover feedback de uma resposta
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const respostaId = searchParams.get("respostaId");

    if (!respostaId) {
      return NextResponse.json(
        { error: "respostaId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a resposta pertence à tentativa
    const resposta = await db.resposta.findFirst({
      where: {
        id: respostaId,
        tentativaId: id,
      },
      include: {
        tentativa: {
          include: {
            prova: {
              include: {
                simulado: {
                  select: { docenteId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!resposta) {
      return NextResponse.json(
        { error: "Resposta não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se o docente tem acesso
    if (
      resposta.tentativa.prova.simulado.docenteId !== user.id &&
      user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Remover feedback
    await db.resposta.update({
      where: { id: respostaId },
      data: {
        feedbackDocente: null,
        feedbackData: null,
      },
    });

    return NextResponse.json({ message: "Feedback removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
