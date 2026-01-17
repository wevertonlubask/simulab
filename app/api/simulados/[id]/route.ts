import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { simuladoUpdateSchema } from "@/lib/validations/simulado";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/simulados/[id] - Detalhes do simulado
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const simulado = await db.simulado.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questoes: true,
            provas: true,
          },
        },
        questoes: {
          select: {
            id: true,
            tipo: true,
            dificuldade: true,
          },
        },
      },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (
      simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Calculate statistics
    const stats = {
      totalQuestoes: simulado._count.questoes,
      totalProvas: simulado._count.provas,
      porDificuldade: {
        FACIL: simulado.questoes.filter((q) => q.dificuldade === "FACIL").length,
        MEDIO: simulado.questoes.filter((q) => q.dificuldade === "MEDIO").length,
        DIFICIL: simulado.questoes.filter((q) => q.dificuldade === "DIFICIL").length,
      },
      porTipo: simulado.questoes.reduce(
        (acc, q) => {
          acc[q.tipo] = (acc[q.tipo] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({
      ...simulado,
      questoes: undefined, // Remove questoes array from response
      stats,
    });
  } catch (error) {
    console.error("Error fetching simulado:", error);
    return NextResponse.json(
      { error: "Erro ao buscar simulado" },
      { status: 500 }
    );
  }
}

// PUT /api/simulados/[id] - Atualizar simulado
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingSimulado = await db.simulado.findUnique({
      where: { id },
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
    const validatedData = simuladoUpdateSchema.parse(body);

    // Check if new name conflicts with existing simulado
    if (validatedData.nome && validatedData.nome !== existingSimulado.nome) {
      const nameConflict = await db.simulado.findUnique({
        where: {
          nome_docenteId: {
            nome: validatedData.nome,
            docenteId: session.user.id,
          },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Você já possui um simulado com este nome" },
          { status: 400 }
        );
      }
    }

    const simulado = await db.simulado.update({
      where: { id },
      data: validatedData,
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

    console.error("Error updating simulado:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar simulado" },
      { status: 500 }
    );
  }
}

// DELETE /api/simulados/[id] - Soft delete (muda status para INATIVO)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existingSimulado = await db.simulado.findUnique({
      where: { id },
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

    // Soft delete - change status to INATIVO
    const simulado = await db.simulado.update({
      where: { id },
      data: { status: "INATIVO" },
    });

    return NextResponse.json({
      message: "Simulado desativado com sucesso",
      simulado,
    });
  } catch (error) {
    console.error("Error deleting simulado:", error);
    return NextResponse.json(
      { error: "Erro ao excluir simulado" },
      { status: 500 }
    );
  }
}
