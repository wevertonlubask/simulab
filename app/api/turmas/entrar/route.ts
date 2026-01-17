import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { notifyNovaTurma } from "@/lib/notifications";

const entrarTurmaSchema = z.object({
  codigo: z
    .string()
    .length(6, "Código deve ter 6 caracteres")
    .toUpperCase(),
});

// POST - Aluno entra em turma por código
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ALUNO") {
      return NextResponse.json(
        { error: "Apenas alunos podem entrar em turmas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = entrarTurmaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const turma = await db.turma.findUnique({
      where: { codigo: validation.data.codigo },
      select: {
        id: true,
        nome: true,
        ativa: true,
        docente: {
          select: { nome: true },
        },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada. Verifique o código." },
        { status: 404 }
      );
    }

    if (!turma.ativa) {
      return NextResponse.json(
        { error: "Esta turma não está mais ativa" },
        { status: 400 }
      );
    }

    // Verificar se já está na turma
    const existingMembership = await db.turmaAluno.findUnique({
      where: {
        turmaId_alunoId: {
          turmaId: turma.id,
          alunoId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Você já está nesta turma" },
        { status: 400 }
      );
    }

    // Entrar na turma
    await db.turmaAluno.create({
      data: {
        turmaId: turma.id,
        alunoId: session.user.id,
      },
    });

    // Notificar o aluno
    notifyNovaTurma(session.user.id, {
      id: turma.id,
      nome: turma.nome,
    }).catch((err) => console.error("Erro ao notificar aluno:", err));

    return NextResponse.json({
      message: "Você entrou na turma com sucesso!",
      turma: {
        id: turma.id,
        nome: turma.nome,
        docente: turma.docente.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao entrar na turma:", error);
    return NextResponse.json(
      { error: "Erro ao entrar na turma" },
      { status: 500 }
    );
  }
}
