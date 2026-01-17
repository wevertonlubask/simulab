import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addAlunoSchema = z.object({
  email: z.string().email("Email inválido"),
});

// POST - Adicionar aluno à turma (por email)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const turma = await db.turma.findUnique({
      where: { id },
      select: { docenteId: true, ativa: true },
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

    if (!turma.ativa) {
      return NextResponse.json(
        { error: "Não é possível adicionar alunos a uma turma inativa" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = addAlunoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Buscar aluno pelo email
    const aluno = await db.user.findUnique({
      where: { email: validation.data.email },
      select: { id: true, nome: true, email: true, role: true },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado com este email" },
        { status: 404 }
      );
    }

    if (aluno.role !== "ALUNO") {
      return NextResponse.json(
        { error: "Este usuário não é um aluno" },
        { status: 400 }
      );
    }

    // Verificar se já está na turma
    const existingMembership = await db.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId: id,
          alunoId: aluno.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Este aluno já está nesta turma" },
        { status: 400 }
      );
    }

    // Adicionar aluno
    const turmaAluno = await db.turmaAluno.create({
      data: {
        turmaId: id,
        alunoId: aluno.id,
      },
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
    });

    return NextResponse.json({ turmaAluno }, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar aluno:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar aluno" },
      { status: 500 }
    );
  }
}
