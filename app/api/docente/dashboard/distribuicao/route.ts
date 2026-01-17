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

    // Get tentativas with notas
    const tentativas = await db.tentativa.findMany({
      where: tentativaWhere,
      select: {
        nota: true,
      },
    });

    // Define faixas
    const faixas = [
      { faixa: "0-50%", min: 0, max: 50, cor: "#EF4444" },
      { faixa: "51-70%", min: 51, max: 70, cor: "#F59E0B" },
      { faixa: "71-85%", min: 71, max: 85, cor: "#3B82F6" },
      { faixa: "86-100%", min: 86, max: 100, cor: "#22C55E" },
    ];

    const distribuicao = faixas.map((f) => {
      const quantidade = tentativas.filter(
        (t) => (t.nota || 0) >= f.min && (t.nota || 0) <= f.max
      ).length;
      return {
        faixa: f.faixa,
        quantidade,
        percentual:
          tentativas.length > 0 ? Math.round((quantidade / tentativas.length) * 100) : 0,
        cor: f.cor,
      };
    });

    return NextResponse.json(distribuicao);
  } catch (error) {
    console.error("Erro ao buscar distribuição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
