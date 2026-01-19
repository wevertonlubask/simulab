import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Iniciar uma nova tentativa de prova
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { totalQuestoes } = body;

    // Buscar a prova
    const prova = await db.prova.findUnique({
      where: { id },
      include: {
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

    if (!disponivel) {
      return NextResponse.json(
        { error: "Esta prova não está disponível no momento" },
        { status: 403 }
      );
    }

    // Verificar tentativas existentes
    const tentativasExistentes = await db.tentativa.findMany({
      where: {
        provaId: id,
        alunoId: session.user.id,
      },
      orderBy: {
        numero: "desc",
      },
    });

    // Verificar se existe tentativa em andamento
    const tentativaEmAndamento = tentativasExistentes.find(
      (t) => t.status === "EM_ANDAMENTO"
    );

    if (tentativaEmAndamento) {
      return NextResponse.json(
        {
          error: "Você já tem uma tentativa em andamento",
          tentativaId: tentativaEmAndamento.id,
        },
        { status: 400 }
      );
    }

    // Verificar limite de tentativas (null = ilimitado)
    if (prova.tentativasMax !== null && tentativasExistentes.length >= prova.tentativasMax) {
      return NextResponse.json(
        { error: "Você atingiu o limite de tentativas" },
        { status: 403 }
      );
    }

    // Verificar intervalo entre tentativas
    const ultimaTentativa = tentativasExistentes.find((t) => t.dataFim !== null);
    if (ultimaTentativa?.dataFim) {
      const intervaloMs = prova.intervaloTentativas * 60 * 60 * 1000; // horas para ms
      const proximaDisponivel = new Date(
        ultimaTentativa.dataFim.getTime() + intervaloMs
      );

      if (proximaDisponivel > now) {
        return NextResponse.json(
          {
            error: "Aguarde o intervalo entre tentativas",
            proximaDisponivel,
          },
          { status: 403 }
        );
      }
    }

    // Criar nova tentativa
    const novoNumero = tentativasExistentes.length + 1;
    const tentativa = await db.tentativa.create({
      data: {
        provaId: id,
        alunoId: session.user.id,
        numero: novoNumero,
        totalQuestoes: totalQuestoes || prova._count.questoes,
        status: "EM_ANDAMENTO",
      },
    });

    return NextResponse.json({
      tentativaId: tentativa.id,
      message: "Tentativa iniciada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao iniciar prova:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar prova" },
      { status: 500 }
    );
  }
}
