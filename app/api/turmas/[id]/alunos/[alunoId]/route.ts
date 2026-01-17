import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string; alunoId: string }>;
}

// DELETE - Remover aluno da turma
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id, alunoId } = await params;

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

    const turmaAluno = await db.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId: id,
          alunoId,
        },
      },
    });

    if (!turmaAluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado nesta turma" },
        { status: 404 }
      );
    }

    await db.turmaAluno.delete({
      where: { id: turmaAluno.id },
    });

    return NextResponse.json({ message: "Aluno removido da turma com sucesso" });
  } catch (error) {
    console.error("Erro ao remover aluno:", error);
    return NextResponse.json(
      { error: "Erro ao remover aluno" },
      { status: 500 }
    );
  }
}
