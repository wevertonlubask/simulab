"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Validar certificado pelo código (API pública)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json(
        { error: "Código do certificado é obrigatório" },
        { status: 400 }
      );
    }

    const certificado = await db.certificado.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
      include: {
        aluno: {
          select: {
            nome: true,
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
        {
          valid: false,
          error: "Certificado não encontrado"
        },
        { status: 404 }
      );
    }

    // Verificar validade se houver data de expiração
    const isExpired = certificado.dataValidade
      ? new Date() > certificado.dataValidade
      : false;

    return NextResponse.json({
      valid: !isExpired,
      expired: isExpired,
      certificado: {
        codigo: certificado.codigo,
        titulo: certificado.titulo,
        categoria: certificado.categoria,
        nota: certificado.nota,
        notaMinima: certificado.notaMinima,
        dataEmissao: certificado.dataEmissao.toISOString(),
        dataValidade: certificado.dataValidade?.toISOString() || null,
        aluno: certificado.aluno.nome,
        prova: certificado.tentativa.prova.nome,
        simulado: certificado.tentativa.prova.simulado.nome,
        docente: certificado.tentativa.prova.simulado.docente.nome,
        acertos: (certificado.metadata as { totalAcertos?: number })?.totalAcertos,
        totalQuestoes: (certificado.metadata as { totalQuestoes?: number })?.totalQuestoes,
      },
    });
  } catch (error) {
    console.error("Erro ao validar certificado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
