import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id: simuladoId } = await params;

    // Verificar se o simulado existe e pertence ao docente
    const simulado = await db.simulado.findUnique({
      where: { id: simuladoId },
      select: {
        id: true,
        docenteId: true,
      },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (user.role !== "SUPERADMIN" && simulado.docenteId !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este simulado" },
        { status: 403 }
      );
    }

    // Buscar provas do simulado
    const provas = await db.prova.findMany({
      where: { simuladoId },
      select: {
        id: true,
        nome: true,
        codigo: true,
        status: true,
        notaMinima: true,
        tempoLimite: true,
        _count: {
          select: {
            tentativas: true,
            questoes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ provas });
  } catch (error) {
    console.error("Erro ao buscar provas do simulado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
