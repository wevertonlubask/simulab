import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Trophy,
  RotateCcw,
  Lightbulb,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TipoQuestao } from "@prisma/client";

export const metadata: Metadata = {
  title: "Resultado da Prova",
};

interface ResultadoPageProps {
  params: Promise<{ id: string; tentativaId: string }>;
}

export default async function ResultadoProvaPage({
  params,
}: ResultadoPageProps) {
  const user = await requireRole(["ALUNO"]);
  const { id: provaId, tentativaId } = await params;

  // Buscar tentativa com todas as informações necessárias
  const tentativa = await db.tentativa.findUnique({
    where: { id: tentativaId },
    include: {
      prova: {
        include: {
          simulado: {
            select: {
              nome: true,
              categoria: true,
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
      },
      respostas: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!tentativa) {
    notFound();
  }

  // Verificar acesso
  if (tentativa.alunoId !== user.id) {
    notFound();
  }

  // Verificar se pode ver resultado
  const podeVerResultado =
    tentativa.prova.mostrarResultado === "IMEDIATO" ||
    (tentativa.prova.mostrarResultado === "DATA" &&
      tentativa.prova.dataResultado &&
      new Date() >= tentativa.prova.dataResultado);

  const aprovado = (tentativa.nota || 0) >= tentativa.prova.notaMinima;

  // Formatar tempo gasto
  const formatarTempoGasto = (segundos: number | null) => {
    if (!segundos) return "--";
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}min ${segs}s`;
    }
    if (minutos > 0) {
      return `${minutos}min ${segs}s`;
    }
    return `${segs}s`;
  };

  // Mapear respostas por questão
  const respostasPorQuestao = new Map(
    tentativa.respostas.map((r) => [r.questaoId, r])
  );

  // Função para obter label do tipo de questão
  const getTipoLabel = (tipo: TipoQuestao) => {
    const labels: Record<TipoQuestao, string> = {
      MULTIPLA_ESCOLHA_UNICA: "Múltipla Escolha",
      MULTIPLA_ESCOLHA_MULTIPLA: "Múltipla Escolha (várias)",
      DRAG_DROP: "Arrastar e Soltar",
      ASSOCIACAO: "Associação",
      ORDENACAO: "Ordenação",
      LACUNA: "Preencher Lacunas",
      HOTSPOT: "Hotspot",
      COMANDO: "Comando",
    };
    return labels[tipo] || tipo;
  };

  // Função para renderizar a resposta do aluno
  const renderRespostaAluno = (
    questao: (typeof tentativa.prova.questoes)[0]["questao"],
    resposta: (typeof tentativa.respostas)[0] | undefined
  ) => {
    if (!resposta || !resposta.resposta) {
      return (
        <span className="text-muted-foreground italic">Não respondida</span>
      );
    }

    const respostaData = resposta.resposta as Record<string, unknown>;

    switch (questao.tipo) {
      case "MULTIPLA_ESCOLHA_UNICA": {
        const altId = respostaData.alternativaId as string;
        const alt = questao.alternativas.find((a) => a.id === altId);
        return alt?.texto || "Alternativa não encontrada";
      }

      case "MULTIPLA_ESCOLHA_MULTIPLA": {
        const altIds = respostaData.alternativasIds as string[];
        if (!altIds || altIds.length === 0) return "Nenhuma selecionada";
        return altIds
          .map((id) => questao.alternativas.find((a) => a.id === id)?.texto)
          .filter(Boolean)
          .join(", ");
      }

      case "ORDENACAO": {
        const ordem = respostaData.ordem as string[];
        if (!ordem || ordem.length === 0) return "Não ordenado";
        return ordem
          .map((id, i) => {
            const alt = questao.alternativas.find((a) => a.id === id);
            return `${i + 1}. ${alt?.texto || "?"}`;
          })
          .join(" → ");
      }

      case "LACUNA": {
        const lacunas = respostaData.lacunas as Record<string, string>;
        if (!lacunas) return "Não preenchida";
        return Object.entries(lacunas)
          .map(([key, value]) => `[${key}]: ${value}`)
          .join(", ");
      }

      case "COMANDO": {
        return respostaData.comando as string || "Não informado";
      }

      case "ASSOCIACAO": {
        const associacoes = respostaData.associacoes as Record<string, string>;
        if (!associacoes) return "Não associado";
        return Object.entries(associacoes)
          .map(([esq, dir]) => `${esq} → ${dir}`)
          .join(", ");
      }

      default:
        return JSON.stringify(respostaData);
    }
  };

  // Função para renderizar a resposta correta
  const renderRespostaCorreta = (
    questao: (typeof tentativa.prova.questoes)[0]["questao"]
  ) => {
    switch (questao.tipo) {
      case "MULTIPLA_ESCOLHA_UNICA": {
        const correta = questao.alternativas.find((a) => a.correta);
        return correta?.texto || "Não definida";
      }

      case "MULTIPLA_ESCOLHA_MULTIPLA": {
        const corretas = questao.alternativas.filter((a) => a.correta);
        if (corretas.length === 0) return "Não definida";
        return corretas.map((a) => a.texto).join(", ");
      }

      case "ORDENACAO": {
        return questao.alternativas
          .sort((a, b) => a.ordem - b.ordem)
          .map((a, i) => `${i + 1}. ${a.texto}`)
          .join(" → ");
      }

      case "LACUNA":
      case "COMANDO":
      case "ASSOCIACAO":
        return "Veja a explicação abaixo";

      default:
        return "Não disponível";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/aluno/provas/${provaId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <Badge variant="secondary" className="mb-1">
            {tentativa.prova.simulado.categoria}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            Resultado - {tentativa.prova.nome}
          </h1>
          <p className="text-muted-foreground">
            Tentativa {tentativa.numero} -{" "}
            {format(new Date(tentativa.dataInicio), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card
        className={
          aprovado
            ? "border-green-500/50 bg-green-500/5"
            : "border-red-500/50 bg-red-500/5"
        }
      >
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${
                aprovado ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {aprovado ? (
                <Trophy className="h-10 w-10 text-green-500" />
              ) : (
                <Target className="h-10 w-10 text-red-500" />
              )}
            </div>
            <h2
              className={`mt-4 text-2xl font-bold ${
                aprovado ? "text-green-600" : "text-red-600"
              }`}
            >
              {aprovado ? "Parabéns! Você foi aprovado!" : "Não foi dessa vez..."}
            </h2>
            {podeVerResultado ? (
              <div className="mt-4 text-5xl font-bold">
                {tentativa.nota?.toFixed(1)}%
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                O resultado detalhado estará disponível em{" "}
                {tentativa.prova.dataResultado
                  ? format(
                      new Date(tentativa.prova.dataResultado),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )
                  : "breve"}
              </p>
            )}
            <p className="text-muted-foreground">
              Nota mínima: {tentativa.prova.notaMinima}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acertos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {podeVerResultado ? tentativa.totalAcertos : "--"}/
              {tentativa.totalQuestoes}
            </div>
            {podeVerResultado && (
              <Progress
                value={
                  ((tentativa.totalAcertos || 0) / tentativa.totalQuestoes) * 100
                }
                className="mt-2 h-2"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {podeVerResultado
                ? tentativa.totalQuestoes - (tentativa.totalAcertos || 0)
                : "--"}
              /{tentativa.totalQuestoes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Gasto</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarTempoGasto(tentativa.tempoGasto)}
            </div>
            {tentativa.prova.tempoLimite && (
              <p className="text-xs text-muted-foreground mt-1">
                de {tentativa.prova.tempoLimite} min
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={aprovado ? "default" : "destructive"}
              className="text-lg py-1 px-3"
            >
              {aprovado ? "Aprovado" : "Reprovado"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href={`/aluno/provas/${provaId}`}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Link>
        </Button>
        <Button asChild>
          <Link href="/aluno/provas">Ver Outras Provas</Link>
        </Button>
      </div>

      {/* Gabarito Completo */}
      {podeVerResultado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Gabarito Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {tentativa.prova.questoes.map((pq, index) => {
                const questao = pq.questao;
                const resposta = respostasPorQuestao.get(questao.id);
                const acertou = resposta?.correta ?? false;
                const naoRespondida = !resposta || !resposta.resposta;

                return (
                  <AccordionItem
                    key={pq.id}
                    value={pq.id}
                    className={`rounded-lg border ${
                      naoRespondida
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : acertou
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                            naoRespondida
                              ? "bg-yellow-500/20 text-yellow-600"
                              : acertou
                              ? "bg-green-500/20 text-green-600"
                              : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {naoRespondida ? (
                            <HelpCircle className="h-5 w-5" />
                          ) : acertou ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              Questão {index + 1}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(questao.tipo)}
                            </Badge>
                            <Badge
                              variant={
                                naoRespondida
                                  ? "secondary"
                                  : acertou
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {naoRespondida
                                ? "Não respondida"
                                : acertou
                                ? "Correta"
                                : "Incorreta"}
                            </Badge>
                          </div>
                          <p
                            className="text-sm text-muted-foreground line-clamp-1 mt-1"
                            dangerouslySetInnerHTML={{
                              __html: questao.enunciado.replace(/<[^>]*>/g, "").substring(0, 100) + "...",
                            }}
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Enunciado Completo */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Enunciado:</h4>
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert bg-muted/50 p-3 rounded-lg"
                            dangerouslySetInnerHTML={{ __html: questao.enunciado }}
                          />
                          {questao.imagemUrl && (
                            <img
                              src={questao.imagemUrl}
                              alt="Imagem da questão"
                              className="mt-2 max-w-full rounded-lg"
                            />
                          )}
                        </div>

                        {/* Alternativas (para questões de múltipla escolha) */}
                        {(questao.tipo === "MULTIPLA_ESCOLHA_UNICA" ||
                          questao.tipo === "MULTIPLA_ESCOLHA_MULTIPLA") && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Alternativas:</h4>
                            <div className="space-y-2">
                              {questao.alternativas.map((alt, altIndex) => {
                                const letra = String.fromCharCode(65 + altIndex);
                                const respostaData = resposta?.resposta as Record<string, unknown> | null;
                                const foiSelecionada =
                                  questao.tipo === "MULTIPLA_ESCOLHA_UNICA"
                                    ? respostaData?.alternativaId === alt.id
                                    : (respostaData?.alternativasIds as string[] | undefined)?.includes(alt.id);

                                return (
                                  <div
                                    key={alt.id}
                                    className={`p-3 rounded-lg border ${
                                      alt.correta
                                        ? "border-green-500 bg-green-500/10"
                                        : foiSelecionada
                                        ? "border-red-500 bg-red-500/10"
                                        : "border-muted"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold">{letra})</span>
                                      <span className="flex-1">{alt.texto}</span>
                                      {alt.correta && (
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      )}
                                      {foiSelecionada && !alt.correta && (
                                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Sua Resposta vs Resposta Correta (para outros tipos) */}
                        {questao.tipo !== "MULTIPLA_ESCOLHA_UNICA" &&
                          questao.tipo !== "MULTIPLA_ESCOLHA_MULTIPLA" && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <span>Sua Resposta:</span>
                                {!naoRespondida && (
                                  acertou ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )
                                )}
                              </h4>
                              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                                {renderRespostaAluno(questao, resposta)}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <span>Resposta Correta:</span>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </h4>
                              <div className="bg-green-500/10 p-3 rounded-lg text-sm border border-green-500/30">
                                {renderRespostaCorreta(questao)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Explicação */}
                        {questao.explicacao && (
                          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-blue-600 mb-1">
                                  Explicação
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {questao.explicacao}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Feedback do docente */}
                        {resposta?.feedbackDocente && (
                          <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-4">
                            <div className="flex items-start gap-3">
                              <MessageSquare className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-purple-600 mb-1">
                                  Feedback do Professor
                                </h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {resposta.feedbackDocente}
                                </p>
                                {resposta.feedbackData && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Enviado em{" "}
                                    {format(
                                      new Date(resposta.feedbackData),
                                      "dd/MM/yyyy 'às' HH:mm",
                                      { locale: ptBR }
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando resultado não disponível */}
      {!podeVerResultado && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gabarito não disponível</h3>
            <p className="text-muted-foreground text-center">
              O gabarito detalhado estará disponível após a liberação dos resultados.
              {tentativa.prova.dataResultado && (
                <>
                  <br />
                  Data prevista:{" "}
                  {format(
                    new Date(tentativa.prova.dataResultado),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
