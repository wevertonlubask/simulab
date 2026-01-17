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

    if (!["DOCENTE", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const periodo = parseInt(searchParams.get("periodo") || "30");
    const turmaId = searchParams.get("turmaId");
    const simuladoId = searchParams.get("simuladoId");

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo);

    // Build where clause for docente's simulados
    const simuladoWhere: Record<string, unknown> = {};
    if (session.user.role !== "SUPERADMIN") {
      simuladoWhere.docenteId = session.user.id;
    }
    if (simuladoId) {
      simuladoWhere.id = simuladoId;
    }

    // Get docente's simulados
    const simulados = await db.simulado.findMany({
      where: simuladoWhere,
      select: { id: true },
    });
    const simuladoIds = simulados.map((s) => s.id);

    // Get provas from these simulados
    const provas = await db.prova.findMany({
      where: {
        simuladoId: { in: simuladoIds },
      },
      select: { id: true },
    });
    const provaIds = provas.map((p) => p.id);

    // Build tentativa where clause
    const tentativaWhere: Record<string, unknown> = {
      provaId: { in: provaIds },
      status: "SUBMETIDA",
      dataFim: { gte: dataInicio },
    };

    // If filtering by turma, get alunos from that turma
    if (turmaId) {
      const turmaAlunos = await db.turmaAluno.findMany({
        where: { turmaId },
        select: { alunoId: true },
      });
      const alunoIds = turmaAlunos.map((ta) => ta.alunoId);
      tentativaWhere.alunoId = { in: alunoIds };
    }

    // Get tentativas grouped by date
    const tentativas = await db.tentativa.findMany({
      where: tentativaWhere,
      select: {
        dataFim: true,
      },
      orderBy: { dataFim: "asc" },
    });

    // Group by date
    const realizacoesPorDia = new Map<string, number>();

    // Initialize all dates in the period
    for (let i = 0; i < periodo; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      realizacoesPorDia.set(dateStr, 0);
    }

    tentativas.forEach((t) => {
      if (t.dataFim) {
        const dateStr = t.dataFim.toISOString().split("T")[0];
        const count = realizacoesPorDia.get(dateStr) || 0;
        realizacoesPorDia.set(dateStr, count + 1);
      }
    });

    const realizacoes = Array.from(realizacoesPorDia.entries())
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return NextResponse.json(realizacoes);
  } catch (error) {
    console.error("Erro ao buscar realizações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
