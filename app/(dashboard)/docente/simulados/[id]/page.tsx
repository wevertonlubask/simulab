import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SimuladoForm } from "@/components/simulados/SimuladoForm";
import { StatusBadge } from "@/components/simulados/StatusBadge";
import {
  ChevronLeft,
  FileQuestion,
  ClipboardList,
  BarChart3,
} from "lucide-react";

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
    title: simulado?.nome || "Simulado",
  };
}

export default async function SimuladoPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const simulado = await db.simulado.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          questoes: true,
          provas: true,
        },
      },
      questoes: {
        select: {
          dificuldade: true,
          tipo: true,
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

  // Calculate statistics
  const stats = {
    porDificuldade: {
      FACIL: simulado.questoes.filter((q) => q.dificuldade === "FACIL").length,
      MEDIO: simulado.questoes.filter((q) => q.dificuldade === "MEDIO").length,
      DIFICIL: simulado.questoes.filter((q) => q.dificuldade === "DIFICIL").length,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/docente/simulados"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{simulado.nome}</h1>
            <StatusBadge status={simulado.status} />
          </div>
          <p className="text-muted-foreground">
            {simulado.categoria}
            {simulado.subcategoria && ` - ${simulado.subcategoria}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/docente/simulados/${simulado.id}/questoes`}>
            <Button variant="outline">
              <FileQuestion className="mr-2 h-4 w-4" />
              Questões ({simulado._count.questoes})
            </Button>
          </Link>
          <Link href={`/docente/simulados/${simulado.id}/provas`}>
            <Button variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Provas ({simulado._count.provas})
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Questões</CardDescription>
            <CardTitle className="text-3xl">{simulado._count.questoes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {simulado._count.questoes >= 10
                ? "Pronto para ativar"
                : `Faltam ${10 - simulado._count.questoes} para ativar`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fácil</CardDescription>
            <CardTitle className="text-3xl text-success">
              {stats.porDificuldade.FACIL}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {simulado._count.questoes > 0
                ? `${Math.round((stats.porDificuldade.FACIL / simulado._count.questoes) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Médio</CardDescription>
            <CardTitle className="text-3xl text-warning">
              {stats.porDificuldade.MEDIO}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {simulado._count.questoes > 0
                ? `${Math.round((stats.porDificuldade.MEDIO / simulado._count.questoes) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Difícil</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {stats.porDificuldade.DIFICIL}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {simulado._count.questoes > 0
                ? `${Math.round((stats.porDificuldade.DIFICIL / simulado._count.questoes) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Simulado</CardTitle>
          <CardDescription>
            Atualize as informações do simulado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimuladoForm simulado={simulado} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
