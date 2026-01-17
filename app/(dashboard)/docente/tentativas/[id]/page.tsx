"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Trash2,
  User,
  Clock,
  Award,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
}

interface Questao {
  id: string;
  enunciado: string;
  tipo: string;
  explicacao?: string;
  alternativas: Alternativa[];
}

interface Resposta {
  id: string;
  resposta: unknown;
  correta: boolean | null;
  pontuacao: number | null;
  feedbackDocente: string | null;
  feedbackData: string | null;
}

interface QuestaoComResposta {
  provaQuestaoId: string;
  ordem: number;
  questao: Questao;
  resposta: Resposta | null;
}

interface TentativaData {
  tentativa: {
    id: string;
    numero: number;
    nota: number | null;
    totalAcertos: number;
    totalQuestoes: number;
    status: string;
    dataInicio: string;
    dataFim: string | null;
    tempoGasto: number | null;
  };
  aluno: {
    id: string;
    nome: string;
    email: string;
  };
  prova: {
    id: string;
    nome: string;
    notaMinima: number;
    simulado: {
      id: string;
      nome: string;
    };
  };
  questoes: QuestaoComResposta[];
}

const tipoLabels: Record<string, string> = {
  MULTIPLA_ESCOLHA_UNICA: "Múltipla Escolha",
  MULTIPLA_ESCOLHA_MULTIPLA: "Múltipla Escolha (Múltipla)",
  ORDENACAO: "Ordenação",
  ASSOCIACAO: "Associação",
  LACUNA: "Preencher Lacunas",
  COMANDO: "Linha de Comando",
};

export default function TentativaFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<TentativaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);

  useEffect(() => {
    fetchTentativa();
  }, [params.id]);

  const fetchTentativa = async () => {
    try {
      const response = await fetch(`/api/docente/tentativas/${params.id}/feedback`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao buscar tentativa");
      }

      setData(result);

      // Inicializar feedbacks existentes
      const feedbacksIniciais: Record<string, string> = {};
      result.questoes.forEach((q: QuestaoComResposta) => {
        if (q.resposta?.feedbackDocente) {
          feedbacksIniciais[q.resposta.id] = q.resposta.feedbackDocente;
        }
      });
      setFeedbacks(feedbacksIniciais);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar tentativa",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const enviarFeedback = async (respostaId: string) => {
    const feedback = feedbacks[respostaId];
    if (!feedback?.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um feedback antes de enviar",
      });
      return;
    }

    setEnviando(respostaId);
    try {
      const response = await fetch(`/api/docente/tentativas/${params.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostaId, feedback }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar feedback");
      }

      toast({
        title: "Feedback enviado!",
        description: "O aluno foi notificado sobre o seu comentário.",
      });

      fetchTentativa();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar feedback",
      });
    } finally {
      setEnviando(null);
    }
  };

  const removerFeedback = async (respostaId: string) => {
    if (!confirm("Tem certeza que deseja remover este feedback?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/docente/tentativas/${params.id}/feedback?respostaId=${respostaId}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao remover feedback");
      }

      toast({
        title: "Feedback removido",
      });

      setFeedbacks((prev) => {
        const updated = { ...prev };
        delete updated[respostaId];
        return updated;
      });

      fetchTentativa();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao remover feedback",
      });
    }
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    return `${minutos}m ${segs}s`;
  };

  const renderResposta = (questao: Questao, resposta: unknown) => {
    if (questao.tipo === "MULTIPLA_ESCOLHA_UNICA") {
      const resp = resposta as { alternativaId?: string };
      const alternativaSelecionada = questao.alternativas.find(
        (a) => a.id === resp?.alternativaId
      );
      return alternativaSelecionada?.texto || "Não respondida";
    }

    if (questao.tipo === "MULTIPLA_ESCOLHA_MULTIPLA") {
      const resp = resposta as { alternativasIds?: string[] };
      const selecionadas = questao.alternativas.filter((a) =>
        resp?.alternativasIds?.includes(a.id)
      );
      return selecionadas.map((a) => a.texto).join(", ") || "Não respondida";
    }

    if (questao.tipo === "COMANDO") {
      const resp = resposta as { comando?: string };
      return resp?.comando || "Não respondida";
    }

    return JSON.stringify(resposta);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { tentativa, aluno, prova, questoes } = data;
  const aprovado = (tentativa.nota || 0) >= prova.notaMinima;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Feedback da Tentativa</h1>
          <p className="text-muted-foreground">
            {prova.nome} - Tentativa #{tentativa.numero}
          </p>
        </div>
      </div>

      {/* Informações do aluno e resultado */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Aluno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{aluno.nome}</p>
            <p className="text-sm text-muted-foreground">{aluno.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`text-3xl font-bold ${
                  aprovado ? "text-green-600" : "text-red-600"
                }`}
              >
                {tentativa.nota?.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  {tentativa.totalAcertos}/{tentativa.totalQuestoes} questões
                </p>
                <p>Nota mínima: {prova.notaMinima}%</p>
              </div>
              <Badge
                variant={aprovado ? "default" : "destructive"}
                className="ml-auto"
              >
                {aprovado ? "Aprovado" : "Reprovado"}
              </Badge>
            </div>
            {tentativa.tempoGasto && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Tempo: {formatarTempo(tentativa.tempoGasto)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Questões e Feedbacks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Questões e Respostas
        </h2>

        {questoes.map((item, index) => {
          const { questao, resposta } = item;
          const isCorreta = resposta?.correta === true;

          return (
            <Card key={item.provaQuestaoId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Questão {index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {tipoLabels[questao.tipo] || questao.tipo}
                    </Badge>
                    {resposta && (
                      <Badge
                        variant={isCorreta ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isCorreta ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Correta
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Incorreta
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Enunciado */}
                <div>
                  <p className="text-sm font-medium mb-1">Enunciado:</p>
                  <p className="text-sm whitespace-pre-wrap">{questao.enunciado}</p>
                </div>

                {/* Alternativas (se aplicável) */}
                {questao.alternativas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Alternativas:</p>
                    <div className="space-y-1">
                      {questao.alternativas.map((alt, i) => {
                        const selecionada =
                          questao.tipo === "MULTIPLA_ESCOLHA_UNICA"
                            ? (resposta?.resposta as { alternativaId?: string })
                                ?.alternativaId === alt.id
                            : (
                                resposta?.resposta as { alternativasIds?: string[] }
                              )?.alternativasIds?.includes(alt.id);

                        return (
                          <div
                            key={alt.id}
                            className={`flex items-center gap-2 p-2 rounded text-sm ${
                              alt.correta
                                ? "bg-green-50 border border-green-200"
                                : selecionada
                                ? "bg-red-50 border border-red-200"
                                : "bg-muted"
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + i)})
                            </span>
                            <span className="flex-1">{alt.texto}</span>
                            {alt.correta && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {selecionada && !alt.correta && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resposta do aluno (para outros tipos) */}
                {questao.alternativas.length === 0 && resposta && (
                  <div>
                    <p className="text-sm font-medium mb-1">Resposta do aluno:</p>
                    <p className="text-sm p-2 bg-muted rounded">
                      {renderResposta(questao, resposta.resposta)}
                    </p>
                  </div>
                )}

                {/* Explicação */}
                {questao.explicacao && (
                  <div>
                    <p className="text-sm font-medium mb-1">Explicação:</p>
                    <p className="text-sm text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
                      {questao.explicacao}
                    </p>
                  </div>
                )}

                {/* Feedback do docente */}
                {resposta && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Feedback para o aluno
                    </p>

                    {resposta.feedbackDocente ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded">
                          <p className="text-sm">{resposta.feedbackDocente}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Enviado em{" "}
                            {format(
                              new Date(resposta.feedbackData!),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerFeedback(resposta.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover feedback
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Digite um feedback para o aluno sobre esta resposta..."
                          value={feedbacks[resposta.id] || ""}
                          onChange={(e) =>
                            setFeedbacks((prev) => ({
                              ...prev,
                              [resposta.id]: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={() => enviarFeedback(resposta.id)}
                          disabled={enviando === resposta.id}
                        >
                          {enviando === resposta.id ? (
                            "Enviando..."
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Enviar feedback
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
