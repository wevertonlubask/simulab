"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

// GET - Buscar certificado por tentativa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tentativaId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { tentativaId } = await params;

    // Buscar certificado existente
    const certificado = await db.certificado.findUnique({
      where: {
        tentativaId,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        tentativa: {
          include: {
            prova: {
              include: {
                simulado: {
                  select: {
                    nome: true,
                    categoria: true,
                    descricao: true,
                    imagemUrl: true,
                    docente: {
                      select: {
                        nome: true,
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

    if (!certificado) {
      return NextResponse.json(
        { error: "Certificado não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o certificado pertence ao usuário (a menos que seja docente/admin)
    if (
      session.user.role === "ALUNO" &&
      certificado.alunoId !== session.user.id
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({
      id: certificado.id,
      codigo: certificado.codigo,
      titulo: certificado.titulo,
      categoria: certificado.categoria,
      nota: certificado.nota,
      notaMinima: certificado.notaMinima,
      dataEmissao: certificado.dataEmissao.toISOString(),
      dataValidade: certificado.dataValidade?.toISOString() || null,
      aluno: certificado.aluno,
      prova: {
        id: certificado.tentativa.prova.id,
        nome: certificado.tentativa.prova.nome,
        codigo: certificado.tentativa.prova.codigo,
      },
      simulado: {
        nome: certificado.tentativa.prova.simulado.nome,
        categoria: certificado.tentativa.prova.simulado.categoria,
        descricao: certificado.tentativa.prova.simulado.descricao,
        imagemUrl: certificado.tentativa.prova.simulado.imagemUrl,
        docente: certificado.tentativa.prova.simulado.docente.nome,
      },
      tentativa: {
        id: certificado.tentativaId,
        dataFim: certificado.tentativa.dataFim?.toISOString(),
        totalAcertos: certificado.tentativa.totalAcertos,
        totalQuestoes: certificado.tentativa.totalQuestoes,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Gerar certificado para uma tentativa aprovada
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tentativaId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { tentativaId } = await params;

    // Verificar se já existe certificado para esta tentativa
    const certificadoExistente = await db.certificado.findUnique({
      where: {
        tentativaId,
      },
    });

    if (certificadoExistente) {
      return NextResponse.json(
        { error: "Certificado já existe para esta tentativa", certificado: certificadoExistente },
        { status: 409 }
      );
    }

    // Buscar a tentativa
    const tentativa = await db.tentativa.findUnique({
      where: {
        id: tentativaId,
      },
      include: {
        prova: {
          include: {
            simulado: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
        },
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a tentativa pertence ao usuário
    if (tentativa.alunoId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se a tentativa foi submetida
    if (tentativa.status !== "SUBMETIDA") {
      return NextResponse.json(
        { error: "Tentativa não foi finalizada" },
        { status: 400 }
      );
    }

    // Verificar se foi aprovado
    const nota = tentativa.nota || 0;
    const notaMinima = tentativa.prova.notaMinima;

    if (nota < notaMinima) {
      return NextResponse.json(
        { error: "Nota insuficiente para gerar certificado" },
        { status: 400 }
      );
    }

    // Gerar código único para o certificado
    const codigo = `CERT-${nanoid(10).toUpperCase()}`;

    // Criar o certificado
    const certificado = await db.certificado.create({
      data: {
        codigo,
        alunoId: session.user.id,
        tentativaId,
        titulo: `${tentativa.prova.simulado.nome} - ${tentativa.prova.nome}`,
        categoria: tentativa.prova.simulado.categoria,
        nota,
        notaMinima,
        metadata: {
          totalQuestoes: tentativa.totalQuestoes,
          totalAcertos: tentativa.totalAcertos,
          tempoGasto: tentativa.tempoGasto,
          dataRealizacao: tentativa.dataFim?.toISOString(),
        },
      },
    });

    return NextResponse.json({
      message: "Certificado gerado com sucesso",
      certificado: {
        id: certificado.id,
        codigo: certificado.codigo,
        titulo: certificado.titulo,
        categoria: certificado.categoria,
        nota: certificado.nota,
        dataEmissao: certificado.dataEmissao.toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
