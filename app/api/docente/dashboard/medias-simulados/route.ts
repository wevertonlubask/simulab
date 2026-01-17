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

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - periodo);

    // Build where clause for docente's simulados
    const simuladoWhere: Record<string, unknown> = {};
    if (session.user.role !== "SUPERADMIN") {
      simuladoWhere.docenteId = session.user.id;
    }

    // Get docente's simulados with their provas
    const simulados = await db.simulado.findMany({
      where: simuladoWhere,
      select: {
        id: true,
        nome: true,
        provas: {
          select: {
            id: true,
          },
        },
      },
    });

    // Get aluno IDs if filtering by turma
    let alunoIdsFilter: string[] | undefined;
    if (turmaId) {
      const turmaAlunos = await db.turmaAluno.findMany({
        where: { turmaId },
        select: { alunoId: true },
      });
      alunoIdsFilter = turmaAlunos.map((ta) => ta.alunoId);
    }

    // Calculate media for each simulado
    const medias = await Promise.all(
      simulados.map(async (s) => {
        const provaIds = s.provas.map((p) => p.id);

        const tentativaWhere: Record<string, unknown> = {
          provaId: { in: provaIds },
          status: "SUBMETIDA",
          dataFim: { gte: dataInicio },
        };

        if (alunoIdsFilter) {
          tentativaWhere.alunoId = { in: alunoIdsFilter };
        }

        const tentativas = await db.tentativa.findMany({
          where: tentativaWhere,
          select: {
            nota: true,
          },
        });

        if (tentativas.length === 0) {
          return null;
        }

        const media = Math.round(
          tentativas.reduce((acc, t) => acc + (t.nota || 0), 0) / tentativas.length
        );

        return {
          simulado: s.nome,
          media,
          totalProvas: tentativas.length,
        };
      })
    );

    // Filter out null results and sort by media
    const filteredMedias = medias
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.media - a.media);

    return NextResponse.json(filteredMedias);
  } catch (error) {
    console.error("Erro ao buscar médias por simulado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
