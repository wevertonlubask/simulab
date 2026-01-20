import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { QuestaoImport } from "@/lib/validations/importacao";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/simulados/[id]/importar - Importar questões
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id: simuladoId } = await params;

    // Verificar se o simulado existe e pertence ao docente
    const simulado = await db.simulado.findFirst({
      where: {
        id: simuladoId,
        docenteId: user.id,
      },
      include: {
        _count: { select: { questoes: true } },
      },
    });

    if (!simulado) {
      return NextResponse.json(
        { error: "Simulado não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { questoes, modo = "adicionar" } = body as {
      questoes: QuestaoImport[];
      modo: "adicionar" | "substituir";
    };

    if (!questoes || !Array.isArray(questoes) || questoes.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão válida para importar" },
        { status: 400 }
      );
    }

    // Se modo for substituir, deletar questões existentes
    if (modo === "substituir") {
      await db.questao.deleteMany({
        where: { simuladoId },
      });
    }

    // Obter a maior ordem atual
    const ultimaOrdem = modo === "substituir" ? 0 : (
      await db.questao.aggregate({
        where: { simuladoId },
        _max: { ordem: true },
      })
    )._max?.ordem || 0;

    const resultado = {
      importadas: 0,
      ignoradas: 0,
      erros: 0,
      total: questoes.length,
      detalhes: [] as { index: number; status: "success" | "error"; message?: string }[],
    };

    // Processar em batches de 50
    const BATCH_SIZE = 50;
    const batches: typeof questoes[] = [];

    for (let i = 0; i < questoes.length; i += BATCH_SIZE) {
      batches.push(questoes.slice(i, i + BATCH_SIZE));
    }

    let ordemAtual = ultimaOrdem;

    for (const batch of batches) {
      const batchPromises = batch.map(async (questao, batchIndex) => {
        const index = batches.indexOf(batch) * BATCH_SIZE + batchIndex;
        ordemAtual++;

        try {
          // Criar questão
          const novaQuestao = await db.questao.create({
            data: {
              simuladoId,
              tipo: questao.tipo,
              enunciado: questao.enunciado,
              dificuldade: questao.dificuldade,
              tags: questao.tags || [],
              explicacao: questao.explicacao || null,
              imagemUrl: questao.imagemUrl || null,
              ordem: ordemAtual,
              configuracao: questao.tipo !== "MULTIPLA_ESCOLHA_UNICA" && questao.tipo !== "MULTIPLA_ESCOLHA_MULTIPLA"
                ? ((questao as unknown as { configuracao?: unknown }).configuracao ?? undefined)
                : undefined,
              alternativas: questao.tipo === "MULTIPLA_ESCOLHA_UNICA" || questao.tipo === "MULTIPLA_ESCOLHA_MULTIPLA"
                ? {
                    create: questao.alternativas.map((alt: { texto: string; correta: boolean }, altIndex: number) => ({
                      texto: alt.texto,
                      correta: alt.correta,
                      ordem: altIndex,
                    })),
                  }
                : undefined,
            },
          });

          resultado.importadas++;
          resultado.detalhes.push({ index, status: "success" });

          return novaQuestao;
        } catch (error) {
          resultado.erros++;
          resultado.detalhes.push({
            index,
            status: "error",
            message: error instanceof Error ? error.message : "Erro ao criar questão",
          });
          return null;
        }
      });

      await Promise.all(batchPromises);
    }

    resultado.ignoradas = resultado.total - resultado.importadas - resultado.erros;

    return NextResponse.json({
      success: true,
      resultado,
    });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
