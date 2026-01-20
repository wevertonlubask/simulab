import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/provas/[id]/duplicar - Duplicar prova
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
    const { id: provaId } = await params;

    const body = await request.json();
    const { modo = "mesmas_questoes" } = body as {
      modo: "mesmas_questoes" | "novo_sorteio";
    };

    // Buscar prova original
    const provaOriginal = await db.prova.findFirst({
      where: {
        id: provaId,
        simulado: {
          docenteId: user.id,
        },
      },
      include: {
        questoes: {
          include: {
            questao: true,
          },
          orderBy: { ordem: "asc" },
        },
        simulado: {
          include: {
            questoes: {
              where: { ativo: true },
            },
          },
        },
      },
    });

    if (!provaOriginal) {
      return NextResponse.json(
        { error: "Prova não encontrada" },
        { status: 404 }
      );
    }

    // Gerar código único
    const codigo = nanoid(8).toUpperCase();

    // Criar nome único para a cópia
    let novoNome = `${provaOriginal.nome} (cópia)`;
    let contador = 1;

    while (await db.prova.findFirst({
      where: {
        nome: novoNome,
        simuladoId: provaOriginal.simuladoId,
      },
    })) {
      contador++;
      novoNome = `${provaOriginal.nome} (cópia ${contador})`;
    }

    // Determinar questões para a nova prova
    let questoesParaCopiar: { questaoId: string; ordem: number }[] = [];

    if (modo === "mesmas_questoes") {
      // Copiar mesmas questões na mesma ordem
      questoesParaCopiar = provaOriginal.questoes.map((pq) => ({
        questaoId: pq.questaoId,
        ordem: pq.ordem,
      }));
    } else {
      // Novo sorteio: selecionar aleatoriamente da mesma quantidade
      const questoesDisponiveis = provaOriginal.simulado.questoes;
      const quantidadeQuestoes = provaOriginal.questoes.length;

      if (questoesDisponiveis.length < quantidadeQuestoes) {
        return NextResponse.json(
          {
            error: `O simulado possui apenas ${questoesDisponiveis.length} questões, mas a prova original tem ${quantidadeQuestoes}`,
          },
          { status: 400 }
        );
      }

      // Embaralhar e selecionar
      const questoesEmbaralhadas = [...questoesDisponiveis].sort(() => Math.random() - 0.5);
      const questoesSelecionadas = questoesEmbaralhadas.slice(0, quantidadeQuestoes);

      questoesParaCopiar = questoesSelecionadas.map((q, i) => ({
        questaoId: q.id,
        ordem: i + 1,
      }));
    }

    // Criar nova prova
    const novaProva = await db.prova.create({
      data: {
        simuladoId: provaOriginal.simuladoId,
        codigo,
        nome: novoNome,
        descricao: provaOriginal.descricao,
        tempoLimite: provaOriginal.tempoLimite,
        tentativasMax: provaOriginal.tentativasMax,
        intervaloTentativas: provaOriginal.intervaloTentativas,
        notaMinima: provaOriginal.notaMinima,
        notaConsiderada: provaOriginal.notaConsiderada,
        mostrarResultado: provaOriginal.mostrarResultado,
        dataResultado: provaOriginal.dataResultado,
        embaralharQuestoes: provaOriginal.embaralharQuestoes,
        embaralharAlternativas: provaOriginal.embaralharAlternativas,
        status: "RASCUNHO",
        questoes: {
          create: questoesParaCopiar.map((q) => ({
            questaoId: q.questaoId,
            ordem: q.ordem,
          })),
        },
      },
      include: {
        _count: { select: { questoes: true } },
      },
    });

    return NextResponse.json({
      success: true,
      prova: novaProva,
      message: modo === "mesmas_questoes"
        ? `Prova duplicada com ${novaProva._count.questoes} questões (mesmas da original)`
        : `Prova duplicada com ${novaProva._count.questoes} questões sorteadas aleatoriamente`,
    });
  } catch (error) {
    console.error("Erro ao duplicar prova:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
