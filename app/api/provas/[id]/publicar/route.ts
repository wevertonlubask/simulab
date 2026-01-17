import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/provas/[id]/publicar - Publicar prova
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingProva = await db.prova.findUnique({
      where: { id },
      include: {
        simulado: {
          select: { docenteId: true },
        },
        _count: {
          select: { questoes: true },
        },
      },
    });

    if (!existingProva) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (
      existingProva.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Only RASCUNHO can be published
    if (existingProva.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é possível publicar provas em rascunho" },
        { status: 400 }
      );
    }

    // Must have at least 10 questions
    if (existingProva._count.questoes < 10) {
      return NextResponse.json(
        { error: "Prova deve ter pelo menos 10 questões para ser publicada" },
        { status: 400 }
      );
    }

    const prova = await db.prova.update({
      where: { id },
      data: { status: "PUBLICADA" },
      include: {
        _count: {
          select: {
            questoes: true,
            tentativas: true,
          },
        },
      },
    });

    return NextResponse.json(prova);
  } catch (error) {
    console.error("Error publishing prova:", error);
    return NextResponse.json(
      { error: "Erro ao publicar prova" },
      { status: 500 }
    );
  }
}
