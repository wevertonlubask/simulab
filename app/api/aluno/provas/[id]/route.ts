import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Detalhes de uma prova para o aluno
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar a prova
    const prova = await db.prova.findUnique({
      where: { id },
      include: {
        simulado: {
          select: {
            nome: true,
            categoria: true,
            subcategoria: true,
            descricao: true,
          },
        },
        _count: {
          select: {
            questoes: true,
          },
        },
      },
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    if (prova.status !== "PUBLICADA") {
      return NextResponse.json(
        { error: "Esta prova não está disponível" },
        { status: 403 }
      );
    }

    // Verificar se o aluno tem acesso (está em alguma turma com esta prova)
    const turmaProva = await db.turmaProva.findFirst({
      where: {
        provaId: id,
        turma: {
          ativa: true,
          alunos: {
            some: {
              alunoId: session.user.id,
            },
          },
        },
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!turmaProva) {
      return NextResponse.json(
        { error: "Você não tem acesso a esta prova" },
        { status: 403 }
      );
    }

    // Verificar período de disponibilidade
    const now = new Date();
    const disponivel =
      (!turmaProva.dataInicio || turmaProva.dataInicio <= now) &&
      (!turmaProva.dataFim || turmaProva.dataFim >= now);

    // Buscar tentativas do aluno
    const tentativas = await db.tentativa.findMany({
      where: {
        provaId: id,
        alunoId: session.user.id,
      },
      orderBy: {
        numero: "desc",
      },
      select: {
        id: true,
        numero: true,
        dataInicio: true,
        dataFim: true,
        nota: true,
        status: true,
        tempoGasto: true,
      },
    });

    const tentativasRealizadas = tentativas.length;
    const tentativasRestantes = Math.max(
      0,
      prova.tentativasMax - tentativasRealizadas
    );

    // Verificar se existe tentativa em andamento
    const tentativaEmAndamento = tentativas.find(
      (t) => t.status === "EM_ANDAMENTO"
    );

    // Calcular próxima tentativa disponível (intervalo entre tentativas)
    let proximaTentativaDisponivel: Date | null = null;
    const ultimaTentativa = tentativas.find((t) => t.dataFim !== null);

    if (ultimaTentativa?.dataFim && tentativasRestantes > 0) {
      const intervaloMs = prova.intervaloTentativas * 60 * 60 * 1000; // horas para ms
      const proximaDisponivel = new Date(
        ultimaTentativa.dataFim.getTime() + intervaloMs
      );

      if (proximaDisponivel > now) {
        proximaTentativaDisponivel = proximaDisponivel;
      }
    }

    // Calcular melhor nota
    const melhorNota = tentativas.reduce((max, t) => {
      if (t.nota !== null && t.nota > max) return t.nota;
      return max;
    }, 0);

    return NextResponse.json({
      prova: {
        id: prova.id,
        codigo: prova.codigo,
        nome: prova.nome,
        descricao: prova.descricao,
        tempoLimite: prova.tempoLimite,
        tentativasMax: prova.tentativasMax,
        intervaloTentativas: prova.intervaloTentativas,
        notaMinima: prova.notaMinima,
        mostrarResultado: prova.mostrarResultado,
        totalQuestoes: prova._count.questoes,
        simulado: prova.simulado,
      },
      turma: turmaProva.turma,
      disponibilidade: {
        dataInicio: turmaProva.dataInicio,
        dataFim: turmaProva.dataFim,
        disponivel,
      },
      tentativas: {
        realizadas: tentativasRealizadas,
        restantes: tentativasRestantes,
        emAndamento: tentativaEmAndamento || null,
        proximaDisponivel: proximaTentativaDisponivel,
        melhorNota,
        historico: tentativas,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar prova:", error);
    return NextResponse.json({ error: "Erro ao buscar prova" }, { status: 500 });
  }
}
