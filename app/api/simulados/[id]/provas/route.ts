import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/simulados/[id]/provas - Listar provas do simulado
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: simuladoId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify simulado ownership
    const simulado = await db.simulado.findUnique({
      where: { id: simuladoId },
      select: { docenteId: true },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    if (
      simulado.docenteId !== session.user.id &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.ProvaWhereInput = {
      simuladoId,
    };

    if (status && status !== "todos") {
      where.status = status as "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
    }

    const provas = await db.prova.findMany({
      where,
      include: {
        _count: {
          select: {
            questoes: true,
            tentativas: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Stats
    const stats = {
      total: provas.length,
      rascunho: provas.filter((p) => p.status === "RASCUNHO").length,
      publicadas: provas.filter((p) => p.status === "PUBLICADA").length,
      encerradas: provas.filter((p) => p.status === "ENCERRADA").length,
    };

    return NextResponse.json({ provas, stats });
  } catch (error) {
    console.error("Error fetching provas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar provas" },
      { status: 500 }
    );
  }
}
