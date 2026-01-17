import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Listar provas disponíveis para o aluno
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();

    // Buscar turmas do aluno
    const turmasAluno = await db.turmaAluno.findMany({
      where: { alunoId: session.user.id },
      include: {
        turma: {
          include: {
            provas: {
              where: {
                prova: {
                  status: "PUBLICADA",
                },
              },
              include: {
                prova: {
                  include: {
                    simulado: {
                      select: {
                        nome: true,
                        categoria: true,
                        subcategoria: true,
                      },
                    },
                    _count: {
                      select: {
                        questoes: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Processar provas disponíveis
    const provasDisponiveis: Array<{
      id: string;
      codigo: string;
      nome: string;
      descricao: string | null;
      tempoLimite: number | null;
      tentativasMax: number;
      totalQuestoes: number;
      simulado: {
        nome: string;
        categoria: string;
        subcategoria: string | null;
      };
      turma: {
        id: string;
        nome: string;
      };
      dataInicio: Date | null;
      dataFim: Date | null;
      disponivel: boolean;
      tentativasRealizadas: number;
      tentativasRestantes: number;
    }> = [];

    for (const turmaAluno of turmasAluno) {
      if (!turmaAluno.turma.ativa) continue;

      for (const turmaProva of turmaAluno.turma.provas) {
        // Verificar período de disponibilidade
        const disponivel =
          (!turmaProva.dataInicio || turmaProva.dataInicio <= now) &&
          (!turmaProva.dataFim || turmaProva.dataFim >= now);

        // Contar tentativas do aluno nesta prova
        const tentativasRealizadas = await db.tentativa.count({
          where: {
            provaId: turmaProva.provaId,
            alunoId: session.user.id,
          },
        });

        const tentativasRestantes = Math.max(
          0,
          turmaProva.prova.tentativasMax - tentativasRealizadas
        );

        provasDisponiveis.push({
          id: turmaProva.prova.id,
          codigo: turmaProva.prova.codigo,
          nome: turmaProva.prova.nome,
          descricao: turmaProva.prova.descricao,
          tempoLimite: turmaProva.prova.tempoLimite,
          tentativasMax: turmaProva.prova.tentativasMax,
          totalQuestoes: turmaProva.prova._count.questoes,
          simulado: turmaProva.prova.simulado,
          turma: {
            id: turmaAluno.turma.id,
            nome: turmaAluno.turma.nome,
          },
          dataInicio: turmaProva.dataInicio,
          dataFim: turmaProva.dataFim,
          disponivel,
          tentativasRealizadas,
          tentativasRestantes,
        });
      }
    }

    // Remover duplicatas (mesma prova em múltiplas turmas)
    const provasUnicas = provasDisponiveis.reduce(
      (acc, prova) => {
        const existing = acc.find((p) => p.id === prova.id);
        if (!existing) {
          acc.push(prova);
        }
        return acc;
      },
      [] as typeof provasDisponiveis
    );

    return NextResponse.json({ provas: provasUnicas });
  } catch (error) {
    console.error("Erro ao listar provas:", error);
    return NextResponse.json(
      { error: "Erro ao listar provas" },
      { status: 500 }
    );
  }
}
