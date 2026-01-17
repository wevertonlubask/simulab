import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { StatusProvaBadge } from "@/components/provas/StatusProvaBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";

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
    title: prova ? `Questões - ${prova.codigo}` : "Questões da Prova",
  };
}

export default async function ProvaQuestoesPage({ params }: PageProps) {
  const user = await requireRole(["DOCENTE", "SUPERADMIN"]);
  const { id } = await params;

  const prova = await db.prova.findUnique({
    where: { id },
    include: {
      simulado: {
        select: {
          id: true,
          nome: true,
          docenteId: true,
        },
      },
      questoes: {
        include: {
          questao: {
            include: {
              alternativas: {
                orderBy: { ordem: "asc" },
              },
            },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!prova) {
    notFound();
  }

  if (prova.simulado.docenteId !== user.id && user.role !== "SUPERADMIN") {
    notFound();
  }

  const dificuldadeColors = {
    FACIL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    MEDIO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    DIFICIL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  const dificuldadeLabels = {
    FACIL: "Fácil",
    MEDIO: "Médio",
    DIFICIL: "Difícil",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/docente/provas/${prova.id}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar aos Detalhes
        </Link>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Questões da Prova {prova.codigo}
            </h1>
            <StatusProvaBadge status={prova.status} />
          </div>
          <p className="text-muted-foreground">
            {prova.simulado.nome} - {prova.questoes.length} questões
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {prova.questoes.map((pq, index) => (
          <Card key={pq.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Questão {index + 1}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={dificuldadeColors[pq.questao.dificuldade]}
                  >
                    {dificuldadeLabels[pq.questao.dificuldade]}
                  </Badge>
                  <Badge variant="secondary">
                    {pq.questao.tipo === "MULTIPLA_ESCOLHA_UNICA"
                      ? "Única escolha"
                      : "Múltipla escolha"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{pq.questao.enunciado}</p>
              </div>

              {pq.questao.explicacao && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium mb-1">Explicação:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {pq.questao.explicacao}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Alternativas:</p>
                {pq.questao.alternativas.map((alt, altIndex) => (
                  <div
                    key={alt.id}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      alt.correta
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : ""
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {String.fromCharCode(65 + altIndex)}
                    </span>
                    <span className="flex-1 text-sm">{alt.texto}</span>
                    {alt.correta && (
                      <Badge variant="default" className="bg-green-600">
                        Correta
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
