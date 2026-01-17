import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { simuladoStatusSchema } from "@/lib/validations/simulado";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/simulados/[id]/status - Alterar status do simulado
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingSimulado = await db.simulado.findUnique({
      where: { id },
      include: {
        _count: {
          select: { questoes: true },
        },
      },
    });

    if (!existingSimulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (
      existingSimulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = simuladoStatusSchema.parse(body);

    // Validate: Can only activate if has minimum 10 questions
    if (status === "ATIVO" && existingSimulado._count.questoes < 10) {
      return NextResponse.json(
        {
          error: `Só é possível ativar um simulado com no mínimo 10 questões. Atualmente: ${existingSimulado._count.questoes}`,
        },
        { status: 400 }
      );
    }

    const simulado = await db.simulado.update({
      where: { id },
      data: { status },
      include: {
        _count: {
          select: {
            questoes: true,
            provas: true,
          },
        },
      },
    });

    return NextResponse.json(simulado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating simulado status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}
