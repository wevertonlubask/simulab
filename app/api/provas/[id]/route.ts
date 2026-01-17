import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { provaConfigSchema } from "@/lib/validations/prova";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/provas/[id] - Detalhes da prova
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const prova = await db.prova.findUnique({
      where: { id },
      include: {
        simulado: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            docenteId: true,
          },
        },
        _count: {
          select: {
            questoes: true,
            tentativas: true,
          },
        },
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (
      prova.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json(prova);
  } catch (error) {
    console.error("Error fetching prova:", error);
    return NextResponse.json(
      { error: "Erro ao buscar prova" },
      { status: 500 }
    );
  }
}

// PUT /api/provas/[id] - Atualizar configurações da prova
export async function PUT(request: Request, { params }: RouteParams) {
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

    // Cannot edit published or closed provas
    if (existingProva.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é possível editar provas em rascunho" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = provaConfigSchema.parse(body);

    const prova = await db.prova.update({
      where: { id },
      data: validatedData,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating prova:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar prova" },
      { status: 500 }
    );
  }
}

// DELETE /api/provas/[id] - Excluir prova
export async function DELETE(request: Request, { params }: RouteParams) {
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
          select: { tentativas: true },
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

    // Cannot delete if has tentativas
    if (existingProva._count.tentativas > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir prova com tentativas registradas" },
        { status: 400 }
      );
    }

    // Delete prova (cascade will delete ProvaQuestao)
    await db.prova.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Prova excluída com sucesso" });
  } catch (error) {
    console.error("Error deleting prova:", error);
    return NextResponse.json(
      { error: "Erro ao excluir prova" },
      { status: 500 }
    );
  }
}
