import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { importarQuestoesSchema } from "@/lib/validations/questao";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/simulados/[id]/questoes/importar - Importar questões via JSON
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: simuladoId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify simulado ownership
    const simulado = await db.simulado.findUnique({
      where: { id: simuladoId },
      select: { docenteId: true },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (
      simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = importarQuestoesSchema.parse(body);

    // Validate each question
    const errors: { index: number; error: string }[] = [];
    validatedData.questoes.forEach((q, index) => {
      const corretas = q.alternativas.filter((a) => a.correta);

      if (q.tipo === "MULTIPLA_ESCOLHA_UNICA" && corretas.length !== 1) {
        errors.push({
          index,
          error: `Questão ${index + 1}: Múltipla escolha única deve ter exatamente 1 correta`,
        });
      }

      if (q.tipo === "MULTIPLA_ESCOLHA_MULTIPLA" && corretas.length < 1) {
        errors.push({
          index,
          error: `Questão ${index + 1}: Múltipla escolha múltipla deve ter ao menos 1 correta`,
        });
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Erros de validação", details: errors },
        { status: 400 }
      );
    }

    // Get max ordem
    const maxOrdem = await db.questao.aggregate({
      where: { simuladoId },
      _max: { ordem: true },
    });

    let currentOrdem = (maxOrdem._max.ordem || 0) + 1;

    // Create all questions in a transaction
    const createdQuestoes = await db.$transaction(
      validatedData.questoes.map((q) => {
        const ordem = currentOrdem++;
        return db.questao.create({
          data: {
            simuladoId,
            tipo: q.tipo,
            enunciado: q.enunciado,
            dificuldade: q.dificuldade,
            tags: q.tags || [],
            explicacao: q.explicacao,
            ordem,
            alternativas: {
              create: q.alternativas.map((alt, index) => ({
                texto: alt.texto,
                correta: alt.correta,
                ordem: index,
              })),
            },
          },
          include: {
            alternativas: true,
          },
        });
      })
    );

    return NextResponse.json(
      {
        message: `${createdQuestoes.length} questões importadas com sucesso`,
        questoes: createdQuestoes,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "JSON inválido", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error importing questoes:", error);
    return NextResponse.json(
      { error: "Erro ao importar questões" },
      { status: 500 }
    );
  }
}
