import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/simulados/[id]/duplicar - Duplicar simulado
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id: simuladoId } = await params;

    // Buscar simulado original com questões e alternativas
    const simuladoOriginal = await db.simulado.findFirst({
      where: {
        id: simuladoId,
        docenteId: user.id,
      },
      include: {
        questoes: {
          include: {
            alternativas: true,
          },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!simuladoOriginal) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    // Criar nome único para a cópia
    let novoNome = `${simuladoOriginal.nome} (cópia)`;
    let contador = 1;

    // Verificar se já existe com esse nome
    while (await db.simulado.findFirst({
      where: {
        nome: novoNome,
        docenteId: user.id,
      },
    })) {
      contador++;
      novoNome = `${simuladoOriginal.nome} (cópia ${contador})`;
    }

    // Criar novo simulado
    const novoSimulado = await db.simulado.create({
      data: {
        nome: novoNome,
        descricao: simuladoOriginal.descricao,
        categoria: simuladoOriginal.categoria,
        subcategoria: simuladoOriginal.subcategoria,
        status: "EM_EDICAO",
        imagemUrl: simuladoOriginal.imagemUrl,
        docenteId: user.id,
        questoes: {
          create: simuladoOriginal.questoes.map((questao) => ({
            tipo: questao.tipo,
            enunciado: questao.enunciado,
            imagemUrl: questao.imagemUrl,
            explicacao: questao.explicacao,
            dificuldade: questao.dificuldade,
            peso: questao.peso,
            tags: questao.tags,
            ordem: questao.ordem,
            ativo: questao.ativo,
            configuracao: questao.configuracao ?? undefined,
            alternativas: {
              create: questao.alternativas.map((alt) => ({
                texto: alt.texto,
                imagemUrl: alt.imagemUrl,
                correta: alt.correta,
                ordem: alt.ordem,
              })),
            },
          })),
        },
      },
      include: {
        _count: { select: { questoes: true } },
      },
    });

    return NextResponse.json({
      success: true,
      simulado: novoSimulado,
      message: `Simulado duplicado com sucesso! ${novoSimulado._count.questoes} questões copiadas.`,
    });
  } catch (error) {
    console.error("Erro ao duplicar simulado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
