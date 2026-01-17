import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusProvaBadge } from "@/components/provas/StatusProvaBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Users, Calendar, Settings, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prova = await db.prova.findUnique({
    where: { id },
    select: { codigo: true },
  });

  return {
    title: prova ? `Prova ${prova.codigo}` : "Prova",
  };
}

export default async function ProvaDetalhesPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const prova = await db.prova.findUnique({
    where: { id },
    include: {
      simulado: {
        select: {
          id: true,
          nome: true,
          categoria: true,
          subcategoria: true,
          docenteId: true,
        },
      },
      _count: {
        select: {
          questoes: true,
          tentativas: true,
        },
      },
    },
  });

  if (!prova) {
    notFound();
  }

  if (prova.simulado.docenteId !== user.id && user.role !== "SUPERADMIN") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/docente/simulados/${prova.simulado.id}/provas`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar às Provas
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{prova.codigo}</h1>
            <StatusProvaBadge status={prova.status} />
          </div>
          <p className="text-muted-foreground">
            {prova.simulado.nome} - {prova.simulado.categoria}
            {prova.simulado.subcategoria && ` / ${prova.simulado.subcategoria}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/docente/provas/${prova.id}/questoes`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Ver Questões
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Questões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prova._count.questoes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tentativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prova._count.tentativas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Criada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatDistanceToNow(prova.createdAt, {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {prova.embaralharQuestoes && prova.embaralharAlternativas
                ? "Tudo embaralhado"
                : prova.embaralharQuestoes
                ? "Questões embaralhadas"
                : prova.embaralharAlternativas
                ? "Alternativas embaralhadas"
                : "Ordem fixa"}
            </div>
          </CardContent>
        </Card>
      </div>

      {prova.status === "RASCUNHO" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prova em rascunho</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Esta prova ainda não foi publicada. Os alunos não poderão acessá-la até que seja publicada.
            </p>
            <p className="text-sm text-muted-foreground">
              Revise as questões e publique quando estiver pronta.
            </p>
          </CardContent>
        </Card>
      )}

      {prova.status === "ENCERRADA" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prova encerrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Esta prova foi encerrada e não está mais disponível para os alunos.
              {prova._count.tentativas > 0 && (
                <span className="block mt-2">
                  Foram realizadas {prova._count.tentativas} tentativa(s).
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
