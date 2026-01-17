"use server";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Listar todos os certificados do aluno
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ALUNO") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const certificados = await db.certificado.findMany({
      where: {
        alunoId: session.user.id,
      },
      include: {
        tentativa: {
          include: {
            prova: {
              include: {
                simulado: {
                  select: {
                    nome: true,
                    categoria: true,
                    imagemUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dataEmissao: "desc",
      },
    });

    const formattedCertificados = certificados.map((cert) => ({
      id: cert.id,
      codigo: cert.codigo,
      titulo: cert.titulo,
      categoria: cert.categoria,
      nota: cert.nota,
      notaMinima: cert.notaMinima,
      dataEmissao: cert.dataEmissao.toISOString(),
      dataValidade: cert.dataValidade?.toISOString() || null,
      prova: {
        id: cert.tentativa.prova.id,
        nome: cert.tentativa.prova.nome,
        simulado: cert.tentativa.prova.simulado.nome,
        imagemUrl: cert.tentativa.prova.simulado.imagemUrl,
      },
      tentativaId: cert.tentativaId,
    }));

    return NextResponse.json(formattedCertificados);
  } catch (error) {
    console.error("Erro ao buscar certificados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
