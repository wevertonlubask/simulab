import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProvasList } from "@/components/provas/ProvasList";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const simulado = await db.simulado.findUnique({
    where: { id },
    select: { nome: true },
  });

  return {
    title: simulado ? `Provas - ${simulado.nome}` : "Provas",
  };
}

export default async function ProvasPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const simulado = await db.simulado.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      categoria: true,
      subcategoria: true,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/docente/simulados/${simulado.id}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar ao Simulado
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provas</h1>
        <p className="text-muted-foreground">
          {simulado.nome} - {simulado.categoria}
          {simulado.subcategoria && ` / ${simulado.subcategoria}`}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {simulado._count.questoes} questões ativas disponíveis
        </p>
      </div>

      <ProvasList simuladoId={simulado.id} />
    </div>
  );
}
