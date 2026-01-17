import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/provas/[id]/encerrar - Encerrar prova
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

    // Only PUBLICADA can be closed
    if (existingProva.status !== "PUBLICADA") {
      return NextResponse.json(
        { error: "Só é possível encerrar provas publicadas" },
        { status: 400 }
      );
    }

    const prova = await db.prova.update({
      where: { id },
      data: { status: "ENCERRADA" },
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
    console.error("Error closing prova:", error);
    return NextResponse.json(
      { error: "Erro ao encerrar prova" },
      { status: 500 }
    );
  }
}
