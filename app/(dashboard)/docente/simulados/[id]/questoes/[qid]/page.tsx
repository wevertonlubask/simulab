import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestaoForm } from "@/components/questoes/QuestaoForm";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; qid: string }>;
}

export const metadata: Metadata = {
  title: "Editar Questão",
};

export default async function EditarQuestaoPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id, qid } = await params;

  const simulado = await db.simulado.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      docenteId: true,
    },
  });

  if (!simulado) {
    notFound();
  }

  if (simulado.docenteId !== user.id && user.role !== "SUPERADMIN") {
    notFound();
  }

  const questao = await db.questao.findUnique({
    where: { id: qid },
    include: {
      alternativas: {
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!questao || questao.simuladoId !== simulado.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/docente/simulados/${simulado.id}/questoes`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar às Questões
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Questão</h1>
        <p className="text-muted-foreground">{simulado.nome}</p>
      </div>

      <QuestaoForm simuladoId={simulado.id} questao={questao} mode="edit" />
    </div>
  );
}
