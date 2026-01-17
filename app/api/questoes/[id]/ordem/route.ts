import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reordenarSchema } from "@/lib/validations/questao";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/questoes/[id]/ordem - Alterar ordem da questão
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const questao = await db.questao.findUnique({
      where: { id },
      include: {
        simulado: {
          select: { docenteId: true },
        },
      },
    });

    if (!questao) {
      return NextResponse.json(
        { error: "Questão não encontrada" },
        { status: 404 }
      );
    }

    if (
      questao.simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { ordem } = reordenarSchema.parse(body);

    await db.questao.update({
      where: { id },
      data: { ordem },
    });

    return NextResponse.json({ message: "Ordem atualizada" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating ordem:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ordem" },
      { status: 500 }
    );
  }
}
