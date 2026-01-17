import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/provas/[id]/questoes - Listar questões da prova
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
          select: { docenteId: true },
        },
        questoes: {
          include: {
            questao: {
              include: {
                alternativas: {
                  orderBy: { ordem: "asc" },
                },
              },
            },
          },
          orderBy: { ordem: "asc" },
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

    // Format response
    const questoes = prova.questoes.map((pq) => ({
      ...pq.questao,
      ordemNaProva: pq.ordem,
    }));

    return NextResponse.json({ questoes });
  } catch (error) {
    console.error("Error fetching prova questoes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar questões da prova" },
      { status: 500 }
    );
  }
}
