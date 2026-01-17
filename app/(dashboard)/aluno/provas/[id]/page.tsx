import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ClipboardList,
  ArrowLeft,
  Target,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { IniciarProvaButton } from "@/components/aluno/IniciarProvaButton";

export const metadata: Metadata = {
  title: "Detalhes da Prova",
};

interface ProvaPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlunoProvaPage({ params }: ProvaPageProps) {
  const user = await requireRole(["ALUNO"]);
  const { id } = await params;

  // Buscar a prova
  const prova = await db.prova.findUnique({
    where: { id },
    include: {
      simulado: {
        select: {
          nome: true,
          categoria: true,
          subcategoria: true,
          descricao: true,
        },
      },
      _count: {
        select: {
          questoes: true,
        },
      },
    },
  });

  if (!prova || prova.status !== "PUBLICADA") {
    notFound();
  }

  // Verificar se o aluno tem acesso (está em alguma turma com esta prova)
  const turmaProva = await db.turmaProva.findFirst({
    where: {
      provaId: id,
      turma: {
        ativa: true,
        alunos: {
          some: {
            alunoId: user.id,
          },
        },
      },
    },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  if (!turmaProva) {
    notFound();
  }

  // Verificar período de disponibilidade
  const now = new Date();
  const disponivel =
    (!turmaProva.dataInicio || turmaProva.dataInicio <= now) &&
    (!turmaProva.dataFim || turmaProva.dataFim >= now);

  // Buscar tentativas do aluno
  const tentativas = await db.tentativa.findMany({
    where: {
      provaId: id,
      alunoId: user.id,
    },
    orderBy: {
      numero: "desc",
    },
    select: {
      id: true,
      numero: true,
      dataInicio: true,
      dataFim: true,
      nota: true,
      status: true,
      tempoGasto: true,
      totalAcertos: true,
      totalQuestoes: true,
    },
  });

  const tentativasRealizadas = tentativas.length;
  const tentativasRestantes = Math.max(
    0,
    prova.tentativasMax - tentativasRealizadas
  );

  // Verificar se existe tentativa em andamento
  const tentativaEmAndamento = tentativas.find(
    (t) => t.status === "EM_ANDAMENTO"
  );

  // Calcular próxima tentativa disponível (intervalo entre tentativas)
  let proximaTentativaDisponivel: Date | null = null;
  const ultimaTentativa = tentativas.find((t) => t.dataFim !== null);

  if (ultimaTentativa?.dataFim && tentativasRestantes > 0) {
    const intervaloMs = prova.intervaloTentativas * 60 * 60 * 1000; // horas para ms
    const proximaDisponivel = new Date(
      ultimaTentativa.dataFim.getTime() + intervaloMs
    );

    if (proximaDisponivel > now) {
      proximaTentativaDisponivel = proximaDisponivel;
    }
  }

  // Calcular melhor nota
  const melhorNota = tentativas.reduce((max, t) => {
    if (t.nota !== null && t.nota > max) return t.nota;
    return max;
  }, 0);

  const aprovado = melhorNota >= prova.notaMinima;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/aluno/provas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <Badge variant="secondary" className="mb-1">
            {prova.simulado.categoria}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{prova.nome}</h1>
          <p className="text-muted-foreground">{prova.simulado.nome}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações da Prova */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Prova</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prova.descricao && (
                <p className="text-muted-foreground">{prova.descricao}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Questões</p>
                    <p className="font-semibold">{prova._count.questoes}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Limite</p>
                    <p className="font-semibold">
                      {prova.tempoLimite
                        ? `${prova.tempoLimite} minutos`
                        : "Sem limite"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Mínima</p>
                    <p className="font-semibold">{prova.notaMinima}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tentativas</p>
                    <p className="font-semibold">
                      {tentativasRealizadas}/{prova.tentativasMax}
                    </p>
                  </div>
                </div>
              </div>

              {/* Disponibilidade */}
              {(turmaProva.dataInicio || turmaProva.dataFim) && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Período de Disponibilidade</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {turmaProva.dataInicio && (
                      <p>
                        Início:{" "}
                        {format(
                          new Date(turmaProva.dataInicio),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    )}
                    {turmaProva.dataFim && (
                      <p>
                        Término:{" "}
                        {format(
                          new Date(turmaProva.dataFim),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Tentativas */}
          {tentativas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Tentativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tentativas.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            t.status === "EM_ANDAMENTO"
                              ? "bg-blue-100 text-blue-600"
                              : t.status === "SUBMETIDA"
                              ? t.nota !== null && t.nota >= prova.notaMinima
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t.status === "EM_ANDAMENTO" ? (
                            <Clock className="h-5 w-5" />
                          ) : t.status === "SUBMETIDA" ? (
                            t.nota !== null && t.nota >= prova.notaMinima ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Tentativa {t.numero}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(
                              new Date(t.dataInicio),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {t.status === "EM_ANDAMENTO" ? (
                          <Badge variant="outline">Em andamento</Badge>
                        ) : t.status === "SUBMETIDA" ? (
                          <div>
                            <span
                              className={`text-lg font-bold ${
                                t.nota !== null && t.nota >= prova.notaMinima
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {t.nota?.toFixed(1)}%
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {t.totalAcertos}/{t.totalQuestoes} acertos
                            </p>
                          </div>
                        ) : (
                          <Badge variant="destructive">Expirada</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Ações */}
        <div className="space-y-6">
          {/* Status e Ação Principal */}
          <Card>
            <CardContent className="pt-6">
              {!disponivel ? (
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-3" />
                  <h3 className="font-semibold mb-1">Prova Indisponível</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {turmaProva.dataInicio && turmaProva.dataInicio > now
                      ? `Disponível a partir de ${format(
                          new Date(turmaProva.dataInicio),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}`
                      : "O período desta prova já encerrou"}
                  </p>
                  <Button className="w-full" disabled>
                    Indisponível
                  </Button>
                </div>
              ) : tentativaEmAndamento ? (
                <div className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-blue-500 mb-3" />
                  <h3 className="font-semibold mb-1">Tentativa em Andamento</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você tem uma tentativa em andamento
                  </p>
                  <IniciarProvaButton
                    provaId={prova.id}
                    tentativaId={tentativaEmAndamento.id}
                    label="Continuar Prova"
                  />
                </div>
              ) : tentativasRestantes === 0 ? (
                <div className="text-center">
                  <XCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                  <h3 className="font-semibold mb-1">Sem Tentativas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você usou todas as suas tentativas
                  </p>
                  <Button className="w-full" disabled>
                    Sem tentativas restantes
                  </Button>
                </div>
              ) : proximaTentativaDisponivel ? (
                <div className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-orange-500 mb-3" />
                  <h3 className="font-semibold mb-1">Aguarde</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Próxima tentativa disponível em{" "}
                    {format(
                      proximaTentativaDisponivel,
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                  <Button className="w-full" disabled>
                    Aguardando intervalo
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Target className="mx-auto h-12 w-12 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">
                    {tentativasRealizadas > 0
                      ? "Tentar Novamente"
                      : "Pronta para Começar"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tentativasRestantes} tentativa
                    {tentativasRestantes > 1 ? "s" : ""} restante
                    {tentativasRestantes > 1 ? "s" : ""}
                  </p>
                  <IniciarProvaButton
                    provaId={prova.id}
                    label={
                      tentativasRealizadas > 0 ? "Iniciar Nova Tentativa" : "Iniciar Prova"
                    }
                    totalQuestoes={prova._count.questoes}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Desempenho */}
          {tentativas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seu Desempenho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center rounded-full h-16 w-16 ${
                      aprovado
                        ? "bg-green-100 text-green-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {aprovado ? (
                      <CheckCircle className="h-8 w-8" />
                    ) : (
                      <Target className="h-8 w-8" />
                    )}
                  </div>
                  <p className="mt-2 font-semibold">
                    {aprovado ? "Aprovado!" : "Continue Tentando"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Melhor nota</span>
                    <span className="font-medium">{melhorNota.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nota mínima</span>
                    <span className="font-medium">{prova.notaMinima}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tentativas</span>
                    <span className="font-medium">
                      {tentativasRealizadas}/{prova.tentativasMax}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
