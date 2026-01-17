import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { questaoSchema, validateMultiplaEscolha } from "@/lib/validations/questao";
import { z } from "zod";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/simulados/[id]/questoes - Listar questões do simulado
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
    const tipo = searchParams.get("tipo");
    const dificuldade = searchParams.get("dificuldade");
    const tag = searchParams.get("tag");
    const busca = searchParams.get("busca");
    const ativo = searchParams.get("ativo");

    const where: Prisma.QuestaoWhereInput = {
      simuladoId,
    };

    if (tipo && tipo !== "todos") {
      where.tipo = tipo as Prisma.EnumTipoQuestaoFilter;
    }

    if (dificuldade && dificuldade !== "todos") {
      where.dificuldade = dificuldade as Prisma.EnumDificuldadeFilter;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (busca) {
      where.enunciado = { contains: busca, mode: "insensitive" };
    }

    if (ativo !== null && ativo !== "todos") {
      where.ativo = ativo === "true";
    }

    const questoes = await db.questao.findMany({
      where,
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
      },
      orderBy: { ordem: "asc" },
    });

    // Get statistics
    const stats = await db.questao.groupBy({
      by: ["dificuldade"],
      where: { simuladoId, ativo: true },
      _count: true,
    });

    const statsMap = {
      total: questoes.length,
      ativas: questoes.filter((q) => q.ativo).length,
      porDificuldade: {
        FACIL: stats.find((s) => s.dificuldade === "FACIL")?._count || 0,
        MEDIO: stats.find((s) => s.dificuldade === "MEDIO")?._count || 0,
        DIFICIL: stats.find((s) => s.dificuldade === "DIFICIL")?._count || 0,
      },
    };

    return NextResponse.json({ questoes, stats: statsMap });
  } catch (error) {
    console.error("Error fetching questoes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar questões" },
      { status: 500 }
    );
  }
}

// POST /api/simulados/[id]/questoes - Criar questão
export async function POST(request: Request, { params }: RouteParams) {
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

    const body = await request.json();
    const validatedData = questaoSchema.parse(body);

    // Validate multiple choice rules
    const validationError = validateMultiplaEscolha(
      validatedData.tipo,
      validatedData.alternativas
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Get max ordem
    const maxOrdem = await db.questao.aggregate({
      where: { simuladoId },
      _max: { ordem: true },
    });

    const questao = await db.questao.create({
      data: {
        simuladoId,
        tipo: validatedData.tipo,
        enunciado: validatedData.enunciado,
        imagemUrl: validatedData.imagemUrl,
        explicacao: validatedData.explicacao,
        dificuldade: validatedData.dificuldade,
        peso: validatedData.peso,
        tags: validatedData.tags,
        ordem: (maxOrdem._max.ordem || 0) + 1,
        alternativas: {
          create: validatedData.alternativas.map((alt, index) => ({
            texto: alt.texto,
            imagemUrl: alt.imagemUrl,
            correta: alt.correta,
            ordem: index,
          })),
        },
      },
      include: {
        alternativas: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return NextResponse.json(questao, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating questao:", error);
    return NextResponse.json(
      { error: "Erro ao criar questão" },
      { status: 500 }
    );
  }
}
