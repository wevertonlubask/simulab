"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");

    const tentativas = await db.tentativa.findMany({
      where: {
        alunoId: session.user.id,
        status: "SUBMETIDA",
      },
      select: {
        id: true,
        nota: true,
        dataFim: true,
        prova: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: { dataFim: "desc" },
      take: limit,
    });

    const evolucao = tentativas.reverse().map(t => ({
      data: t.dataFim?.toISOString().split('T')[0] || "",
      prova: t.prova.nome,
      nota: Math.round(t.nota || 0),
    }));

    return NextResponse.json(evolucao);
  } catch (error) {
    console.error("Erro ao buscar evolução:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
