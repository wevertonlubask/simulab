"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

interface EstatisticasData {
  temDados: boolean;
  resumo?: {
    totalTentativas: number;
    totalAprovacoes: number;
    taxaAprovacao: number;
    mediaGeral: number;
    melhorNota: number;
    piorNota: number;
    tempoTotal: number;
    totalQuestoes: number;
    questoesCorretas: number;
    taxaAcerto: number;
    streakAtual: number;
    maiorStreak: number;
  };
  evolucao?: Array<{
    mes: string;
    media: number;
    tentativas: number;
    taxaAprovacao: number;
  }>;
  categorias?: Array<{
    categoria: string;
    media: number;
    tentativas: number;
    taxaAprovacao: number;
    tempoMedio: number;
  }>;
  distribuicaoNotas?: Array<{
    faixa: string;
    count: number;
  }>;
  atividade?: Array<{
    data: string;
    tentativas: number;
  }>;
  melhoresNotas?: Array<{
    provaId: string;
    provaNome: string;
    simulado: string;
    nota: number;
  }>;
}

export function EstatisticasCharts() {
  const [dados, setDados] = useState<EstatisticasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstatisticas();
  }, []);

  const fetchEstatisticas = async () => {
    try {
      const response = await fetch("/api/aluno/estatisticas");
      const data = await response.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!dados?.temDados) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sem dados ainda</h3>
          <p className="text-muted-foreground text-center">
            Realize algumas provas para ver seus gráficos de desempenho
          </p>
        </CardContent>
      </Card>
    );
  }

  const { resumo, evolucao, categorias, distribuicaoNotas, atividade, melhoresNotas } = dados;

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
  };

  // Encontrar o máximo para normalização
  const maxAtividade = Math.max(...(atividade?.map((a) => a.tentativas) || [1]));
  const maxDistribuicao = Math.max(...(distribuicaoNotas?.map((d) => d.count) || [1]));

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{resumo?.taxaAprovacao}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Aprovação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumo?.taxaAcerto}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{resumo?.streakAtual}</p>
                <p className="text-xs text-muted-foreground">Dias seguidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatarTempo(resumo?.tempoTotal || 0)}</p>
                <p className="text-xs text-muted-foreground">Tempo de Estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de evolução mensal */}
        {evolucao && evolucao.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Evolução da Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evolucao.map((e, index) => {
                  const anterior = index > 0 ? evolucao[index - 1].media : null;
                  const diff = anterior !== null ? e.media - anterior : null;

                  return (
                    <div key={e.mes} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(e.mes + "-01").toLocaleDateString("pt-BR", {
                            month: "short",
                            year: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {diff !== null && diff !== 0 && (
                            <span
                              className={`text-xs ${
                                diff > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff}%
                            </span>
                          )}
                          <span className="font-medium">{e.media}%</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            e.media >= 70
                              ? "bg-green-500"
                              : e.media >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${e.media}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de desempenho por categoria */}
        {categorias && categorias.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-5 w-5" />
                Desempenho por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorias.slice(0, 5).map((cat) => (
                  <div key={cat.categoria} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{cat.categoria}</Badge>
                      <span
                        className={`font-semibold ${
                          cat.media >= 70
                            ? "text-green-600"
                            : cat.media >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {cat.media}%
                      </span>
                    </div>
                    <Progress
                      value={cat.media}
                      className={`h-2 ${
                        cat.media >= 70
                          ? "[&>div]:bg-green-500"
                          : cat.media >= 50
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-red-500"
                      }`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{cat.tentativas} tentativas</span>
                      <span>{cat.taxaAprovacao}% aprovação</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição de notas */}
        {distribuicaoNotas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5" />
                Distribuição de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {distribuicaoNotas.map((d) => {
                  const altura = maxDistribuicao > 0 ? (d.count / maxDistribuicao) * 100 : 0;
                  const cor =
                    d.faixa === "91-100"
                      ? "bg-green-500"
                      : d.faixa === "71-90"
                      ? "bg-green-400"
                      : d.faixa === "51-70"
                      ? "bg-yellow-500"
                      : d.faixa === "31-50"
                      ? "bg-orange-500"
                      : "bg-red-500";

                  return (
                    <div
                      key={d.faixa}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium">{d.count}</span>
                      <div
                        className={`w-full rounded-t ${cor} transition-all`}
                        style={{ height: `${Math.max(altura, 4)}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{d.faixa}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Atividade nos últimos 30 dias */}
        {atividade && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Atividade (últimos 30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-1">
                {atividade.map((a, i) => {
                  const intensidade =
                    a.tentativas === 0
                      ? "bg-muted"
                      : a.tentativas === 1
                      ? "bg-green-200"
                      : a.tentativas === 2
                      ? "bg-green-400"
                      : "bg-green-600";

                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded ${intensidade}`}
                      title={`${a.data}: ${a.tentativas} tentativas`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded bg-muted" />
                  <div className="w-3 h-3 rounded bg-green-200" />
                  <div className="w-3 h-3 rounded bg-green-400" />
                  <div className="w-3 h-3 rounded bg-green-600" />
                </div>
                <span>Mais</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Melhores notas */}
      {melhoresNotas && melhoresNotas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Suas Melhores Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {melhoresNotas.map((nota, index) => (
                <div
                  key={nota.provaId}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
                      index === 0
                        ? "bg-yellow-500/20 text-yellow-600"
                        : index === 1
                        ? "bg-gray-300/20 text-gray-600"
                        : index === 2
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{nota.provaNome}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {nota.simulado}
                    </p>
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      nota.nota >= 70
                        ? "text-green-600"
                        : nota.nota >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {nota.nota}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
