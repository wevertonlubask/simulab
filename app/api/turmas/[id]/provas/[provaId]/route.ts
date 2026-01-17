import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string; provaId: string }>;
}

// DELETE - Desvincular prova da turma
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id, provaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const turma = await db.turma.findUnique({
      where: { id },
      select: { docenteId: true },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    if (
      turma.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const turmaProva = await db.turmaProva.findUnique({
      where: {
        turmaId_provaId: {
          turmaId: id,
          provaId,
        },
      },
    });

    if (!turmaProva) {
      return NextResponse.json(
        { error: "Prova não encontrada nesta turma" },
        { status: 404 }
      );
    }

    await db.turmaProva.delete({
      where: { id: turmaProva.id },
    });

    return NextResponse.json({
      message: "Prova desvinculada da turma com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desvincular prova:", error);
    return NextResponse.json(
      { error: "Erro ao desvincular prova" },
      { status: 500 }
    );
  }
}
