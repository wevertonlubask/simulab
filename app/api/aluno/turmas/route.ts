import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireRole(["ALUNO"]);

    const turmaAlunos = await db.turmaAluno.findMany({
      where: { alunoId: user.id },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            docente: {
              select: {
                nome: true,
              },
            },
            _count: {
              select: {
                alunos: true,
                provas: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataEntrada: "desc",
      },
    });

    const turmas = turmaAlunos.map((ta) => ({
      id: ta.turma.id,
      nome: ta.turma.nome,
      codigo: ta.turma.codigo,
      docente: ta.turma.docente.nome,
      totalAlunos: ta.turma._count.alunos,
      totalProvas: ta.turma._count.provas,
      dataEntrada: ta.dataEntrada,
    }));

    return NextResponse.json({ turmas });
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar turmas" },
      { status: 500 }
    );
  }
}
