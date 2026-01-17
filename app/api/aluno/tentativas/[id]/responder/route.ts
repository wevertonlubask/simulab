import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const respostaSchema = z.object({
  provaQuestaoId: z.string(),
  questaoId: z.string(),
  resposta: z.any(), // JSON com a resposta (depende do tipo de questão)
  marcadaRevisao: z.boolean().optional(),
  tempoResposta: z.number().optional(), // tempo em segundos
});

// POST - Salvar resposta de uma questão
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = respostaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { provaQuestaoId, questaoId, resposta, marcadaRevisao, tempoResposta } =
      validation.data;

    // Buscar a tentativa
    const tentativa = await db.tentativa.findUnique({
      where: { id },
      include: {
        prova: {
          select: {
            tempoLimite: true,
          },
        },
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

    // Verificar tempo limite
    if (tentativa.prova.tempoLimite) {
      const tempoLimiteMs = tentativa.prova.tempoLimite * 60 * 1000;
      const tempoDecorrido = Date.now() - tentativa.dataInicio.getTime();

      if (tempoDecorrido > tempoLimiteMs) {
        await db.tentativa.update({
          where: { id },
          data: {
            status: "EXPIRADA",
            dataFim: new Date(),
          },
        });

        return NextResponse.json(
          { error: "O tempo da prova expirou" },
          { status: 400 }
        );
      }
    }

    // Upsert da resposta
    const respostaExistente = await db.resposta.findFirst({
      where: {
        tentativaId: id,
        provaQuestaoId,
      },
    });

    let respostaSalva;

    if (respostaExistente) {
      respostaSalva = await db.resposta.update({
        where: { id: respostaExistente.id },
        data: {
          resposta,
          marcadaRevisao: marcadaRevisao ?? respostaExistente.marcadaRevisao,
          tempoResposta: tempoResposta ?? respostaExistente.tempoResposta,
        },
      });
    } else {
      respostaSalva = await db.resposta.create({
        data: {
          tentativaId: id,
          questaoId,
          provaQuestaoId,
          resposta,
          marcadaRevisao: marcadaRevisao ?? false,
          tempoResposta,
        },
      });
    }

    return NextResponse.json({
      success: true,
      resposta: {
        id: respostaSalva.id,
        resposta: respostaSalva.resposta,
        marcadaRevisao: respostaSalva.marcadaRevisao,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar resposta:", error);
    return NextResponse.json(
      { error: "Erro ao salvar resposta" },
      { status: 500 }
    );
  }
}
