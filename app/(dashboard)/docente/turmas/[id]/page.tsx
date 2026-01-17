import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { TurmaDetail } from "@/components/turmas/TurmaDetail";

export const metadata: Metadata = {
  title: "Detalhes da Turma",
};

interface TurmaPageProps {
  params: Promise<{ id: string }>;
}

export default async function TurmaPage({ params }: TurmaPageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const turma = await db.turma.findFirst({
    where: {
      id,
      docenteId: user.id,
    },
    include: {
      alunos: {
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          dataEntrada: "desc",
        },
      },
      provas: {
        include: {
          prova: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              status: true,
              tempoLimite: true,
              tentativasMax: true,
              simulado: {
                select: {
                  nome: true,
                  categoria: true,
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
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          alunos: true,
          provas: true,
        },
      },
    },
  });

  if (!turma) {
    notFound();
  }

  // Buscar provas disponíveis para vincular (do mesmo docente, publicadas)
  const provasDisponiveis = await db.prova.findMany({
    where: {
      simulado: {
        docenteId: user.id,
      },
      status: "PUBLICADA",
      NOT: {
        turmas: {
          some: {
            turmaId: id,
          },
        },
      },
    },
    select: {
      id: true,
      codigo: true,
      nome: true,
      simulado: {
        select: {
          nome: true,
          categoria: true,
        },
      },
      _count: {
        select: {
          questoes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <TurmaDetail turma={turma} provasDisponiveis={provasDisponiveis} />
    </div>
  );
}
