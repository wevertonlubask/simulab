import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/questoes/[id]/duplicar - Duplicar questão
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const questaoOriginal = await db.questao.findUnique({
      where: { id },
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
        simulado: {
          select: { docenteId: true },
        },
      },
    });

    if (!questaoOriginal) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    if (
      questaoOriginal.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Get max ordem
    const maxOrdem = await db.questao.aggregate({
      where: { simuladoId: questaoOriginal.simuladoId },
      _max: { ordem: true },
    });

    // Create duplicate
    const novaQuestao = await db.questao.create({
      data: {
        simuladoId: questaoOriginal.simuladoId,
        tipo: questaoOriginal.tipo,
        enunciado: `${questaoOriginal.enunciado} (cópia)`,
        imagemUrl: questaoOriginal.imagemUrl,
        explicacao: questaoOriginal.explicacao,
        dificuldade: questaoOriginal.dificuldade,
        peso: questaoOriginal.peso,
        tags: questaoOriginal.tags,
        ordem: (maxOrdem._max.ordem || 0) + 1,
        configuracao: questaoOriginal.configuracao ?? undefined,
        alternativas: {
          create: questaoOriginal.alternativas.map((alt) => ({
            texto: alt.texto,
            imagemUrl: alt.imagemUrl,
            correta: alt.correta,
            ordem: alt.ordem,
          })),
        },
      },
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return NextResponse.json(novaQuestao, { status: 201 });
  } catch (error) {
    console.error("Error duplicating questao:", error);
    return NextResponse.json(
      { error: "Erro ao duplicar questão" },
      { status: 500 }
    );
  }
}
