import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { notifyNewProva } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addProvaSchema = z.object({
  provaId: z.string().min(1, "ID da prova é obrigatório"),
  dataInicio: z.string().datetime().optional().nullable(),
  dataFim: z.string().datetime().optional().nullable(),
});

// POST - Vincular prova à turma
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

    const body = await request.json();
    const validation = addProvaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verificar se a prova existe e pertence ao docente
    const prova = await db.prova.findUnique({
      where: { id: validation.data.provaId },
      include: {
        simulado: {
          select: { docenteId: true },
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
      return NextResponse.json(
        { error: "Você não tem permissão para vincular esta prova" },
        { status: 403 }
      );
    }

    // Verificar se já está vinculada
    const existingLink = await db.turmaProva.findUnique({
      where: {
        turmaId_provaId: {
          turmaId: id,
          provaId: validation.data.provaId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Esta prova já está vinculada a esta turma" },
        { status: 400 }
      );
    }

    // Vincular prova
    const turmaProva = await db.turmaProva.create({
      data: {
        turmaId: id,
        provaId: validation.data.provaId,
        dataInicio: validation.data.dataInicio
          ? new Date(validation.data.dataInicio)
          : null,
        dataFim: validation.data.dataFim
          ? new Date(validation.data.dataFim)
          : null,
      },
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
    });

    // Notificar alunos se a prova estiver publicada
    if (prova.status === "PUBLICADA") {
      notifyNewProva(id, {
        id: prova.id,
        nome: prova.nome,
        codigo: prova.codigo,
      }).catch((err) => console.error("Erro ao notificar alunos:", err));
    }

    return NextResponse.json({ turmaProva }, { status: 201 });
  } catch (error) {
    console.error("Erro ao vincular prova:", error);
    return NextResponse.json(
      { error: "Erro ao vincular prova" },
      { status: 500 }
    );
  }
}
