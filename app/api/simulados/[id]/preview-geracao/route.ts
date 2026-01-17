import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/simulados/[id]/preview-geracao - Preview de geração de provas
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questoesPorProva = parseInt(searchParams.get("questoesPorProva") || "10");
    const dificuldadesParam = searchParams.get("dificuldades");
    const percentualFacil = searchParams.get("percentualFacil");
    const percentualMedio = searchParams.get("percentualMedio");
    const percentualDificil = searchParams.get("percentualDificil");

    // Validate simulado ownership
    const simulado = await db.simulado.findUnique({
      where: { id },
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

    // Build where clause for questões
    const dificuldades = dificuldadesParam
      ? dificuldadesParam.split(",")
      : undefined;

    // Get all active questions not used in active provas
    const usedQuestionIds = await db.provaQuestao.findMany({
      where: {
        prova: {
          simuladoId: id,
          status: { in: ["PUBLICADA"] },
        },
      },
      select: { questaoId: true },
    });

    const usedIds = usedQuestionIds.map((pq) => pq.questaoId);

    const whereClause: Record<string, unknown> = {
      simuladoId: id,
      ativo: true,
      id: { notIn: usedIds },
    };

    if (dificuldades && dificuldades.length > 0) {
      whereClause.dificuldade = { in: dificuldades };
    }

    // Count questions by difficulty
    const allQuestions = await db.questao.findMany({
      where: whereClause,
      select: { dificuldade: true },
    });

    const questoesPorDificuldade = {
      FACIL: allQuestions.filter((q) => q.dificuldade === "FACIL").length,
      MEDIO: allQuestions.filter((q) => q.dificuldade === "MEDIO").length,
      DIFICIL: allQuestions.filter((q) => q.dificuldade === "DIFICIL").length,
    };

    const totalQuestoesDisponiveis = allQuestions.length;

    // Calculate possible provas
    let possibleProvas = 0;

    if (percentualFacil && percentualMedio && percentualDificil) {
      // With percentages
      const pFacil = parseInt(percentualFacil);
      const pMedio = parseInt(percentualMedio);
      const pDificil = parseInt(percentualDificil);

      const qFacil = Math.round((questoesPorProva * pFacil) / 100);
      const qMedio = Math.round((questoesPorProva * pMedio) / 100);
      const qDificil = questoesPorProva - qFacil - qMedio;

      // Check if we have enough questions of each type
      if (
        qFacil <= questoesPorDificuldade.FACIL &&
        qMedio <= questoesPorDificuldade.MEDIO &&
        qDificil <= questoesPorDificuldade.DIFICIL
      ) {
        // Calculate how many provas we can make
        const provasFacil =
          qFacil > 0 ? Math.floor(questoesPorDificuldade.FACIL / qFacil) : Infinity;
        const provasMedio =
          qMedio > 0 ? Math.floor(questoesPorDificuldade.MEDIO / qMedio) : Infinity;
        const provasDificil =
          qDificil > 0 ? Math.floor(questoesPorDificuldade.DIFICIL / qDificil) : Infinity;

        possibleProvas = Math.min(provasFacil, provasMedio, provasDificil);
        if (possibleProvas === Infinity) possibleProvas = 0;
      }
    } else {
      // Without percentages - simple division
      possibleProvas = Math.floor(totalQuestoesDisponiveis / questoesPorProva);
    }

    const questoesRestantes = totalQuestoesDisponiveis - possibleProvas * questoesPorProva;

    return NextResponse.json({
      possibleProvas,
      totalQuestoesDisponiveis,
      questoesPorDificuldade,
      questoesRestantes: Math.max(0, questoesRestantes),
    });
  } catch (error) {
    console.error("Error in preview-geracao:", error);
    return NextResponse.json(
      { error: "Erro ao calcular preview" },
      { status: 500 }
    );
  }
}
