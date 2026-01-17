import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { GerarProvasWizard } from "@/components/provas/GerarProvasWizard";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Gerar Provas",
};

export default async function GerarProvasPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const simulado = await db.simulado.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      docenteId: true,
      _count: {
        select: {
          questoes: {
            where: { ativo: true },
          },
        },
      },
    },
  });

  if (!simulado) {
    notFound();
  }

  if (simulado.docenteId !== user.id && user.role !== "SUPERADMIN") {
    notFound();
  }

  if (simulado._count.questoes < 5) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/docente/simulados/${simulado.id}/provas`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar às Provas
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-xl font-semibold">Questões insuficientes</h2>
          <p className="mt-2 text-muted-foreground">
            O simulado precisa ter pelo menos 5 questões ativas para gerar provas.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualmente há {simulado._count.questoes} questão(ões) ativa(s).
          </p>
          <Link
            href={`/docente/simulados/${simulado.id}/questoes/nova`}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Criar Questões
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/docente/simulados/${simulado.id}/provas`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar às Provas
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerar Provas</h1>
        <p className="text-muted-foreground">{simulado.nome}</p>
      </div>

      <GerarProvasWizard simuladoId={simulado.id} simuladoNome={simulado.nome} />
    </div>
  );
}
