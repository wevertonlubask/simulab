import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCertificateCode } from "@/lib/certificado/generateCertificate";

interface RouteParams {
  params: Promise<{ tentativaId: string }>;
}

// GET /api/certificados/[tentativaId] - Obter ou criar certificado
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireRole(["ALUNO", "DOCENTE", "SUPERADMIN"]);
    const { tentativaId } = await params;

    // Buscar tentativa
    const tentativa = await db.tentativa.findFirst({
      where: {
        id: tentativaId,
        alunoId: user.id,
        status: "SUBMETIDA",
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
        aluno: {
          select: {
            nome: true,
            email: true,
          },
        },
        certificado: true,
      },
    });

    if (!tentativa) {
      return NextResponse.json(
        { error: "Tentativa não encontrada ou não pertence a você" },
        { status: 404 }
      );
    }

    // Verificar se foi aprovado
    if (tentativa.nota === null || tentativa.nota < tentativa.prova.notaMinima) {
      return NextResponse.json(
        { error: "Apenas tentativas aprovadas podem gerar certificado" },
        { status: 400 }
      );
    }

    // Se já existe certificado, retornar
    if (tentativa.certificado) {
      return NextResponse.json({
        certificado: tentativa.certificado,
        dados: {
          alunoNome: tentativa.aluno.nome,
          titulo: tentativa.prova.simulado.nome,
          categoria: tentativa.prova.simulado.categoria,
          nota: tentativa.nota,
          notaMinima: tentativa.prova.notaMinima,
          dataEmissao: tentativa.certificado.dataEmissao.toISOString(),
          codigo: tentativa.certificado.codigo,
        },
      });
    }

    // Criar novo certificado
    const codigo = generateCertificateCode({
      alunoNome: tentativa.aluno.nome,
      alunoEmail: tentativa.aluno.email,
      titulo: tentativa.prova.simulado.nome,
      categoria: tentativa.prova.simulado.categoria,
      nota: tentativa.nota,
      notaMinima: tentativa.prova.notaMinima,
      dataEmissao: new Date(),
      tentativaId: tentativa.id,
    });

    const certificado = await db.certificado.create({
      data: {
        codigo,
        alunoId: user.id,
        tentativaId: tentativa.id,
        titulo: tentativa.prova.simulado.nome,
        categoria: tentativa.prova.simulado.categoria,
        nota: tentativa.nota,
        notaMinima: tentativa.prova.notaMinima,
      },
    });

    return NextResponse.json({
      certificado,
      dados: {
        alunoNome: tentativa.aluno.nome,
        titulo: tentativa.prova.simulado.nome,
        categoria: tentativa.prova.simulado.categoria,
        nota: tentativa.nota,
        notaMinima: tentativa.prova.notaMinima,
        dataEmissao: certificado.dataEmissao.toISOString(),
        codigo: certificado.codigo,
      },
    });
  } catch (error) {
    console.error("Erro ao obter certificado:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
