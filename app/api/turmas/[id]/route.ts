import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateTurmaSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
  ativa: z.boolean().optional(),
});

// GET - Detalhes da turma
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const turma = await db.turma.findUnique({
      where: { id },
      include: {
        alunos: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            dataEntrada: "desc",
          },
        },
        provas: {
          include: {
            prova: {
              select: {
                id: true,
                codigo: true,
                nome: true,
                status: true,
                tempoLimite: true,
                tentativasMax: true,
                simulado: {
                  select: {
                    nome: true,
                    categoria: true,
                  },
                },
                _count: {
                  select: {
                    questoes: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            alunos: true,
            provas: true,
          },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se é o docente da turma ou SUPERADMIN
    if (
      turma.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ turma });
  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    return NextResponse.json({ error: "Erro ao buscar turma" }, { status: 500 });
  }
}

// PUT - Atualizar turma
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

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

    const body = await request.json();
    const validation = updateTurmaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const turmaAtualizada = await db.turma.update({
      where: { id },
      data: validation.data,
      include: {
        _count: {
          select: {
            alunos: true,
            provas: true,
          },
        },
      },
    });

    return NextResponse.json({ turma: turmaAtualizada });
  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar turma" },
      { status: 500 }
    );
  }
}

// DELETE - Desativar turma (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

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

    await db.turma.update({
      where: { id },
      data: { ativa: false },
    });

    return NextResponse.json({ message: "Turma desativada com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar turma:", error);
    return NextResponse.json(
      { error: "Erro ao desativar turma" },
      { status: 500 }
    );
  }
}
