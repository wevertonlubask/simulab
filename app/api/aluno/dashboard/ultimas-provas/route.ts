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
    const limit = parseInt(searchParams.get("limit") || "5");

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
            notaMinima: true,
            simulado: {
              select: {
                categoria: true,
              },
            },
          },
        },
      },
      orderBy: { dataFim: "desc" },
      take: limit,
    });

    const ultimasProvas = tentativas.map(t => ({
      id: t.id,
      titulo: t.prova.nome,
      categoria: t.prova.simulado.categoria,
      nota: Math.round(t.nota || 0),
      aprovado: (t.nota || 0) >= t.prova.notaMinima,
      data: t.dataFim?.toISOString() || "",
    }));

    return NextResponse.json(ultimasProvas);
  } catch (error) {
    console.error("Erro ao buscar últimas provas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
