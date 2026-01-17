import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Meu Progresso",
};

export default async function ProgressoPage() {
  const user = await requireRole(["ALUNO"]);

  // Buscar todas as tentativas finalizadas
  const tentativas = await db.tentativa.findMany({
    where: {
      alunoId: user.id,
      status: "SUBMETIDA",
    },
    include: {
      prova: {
        select: {
          id: true,
          nome: true,
          notaMinima: true,
          simulado: {
            select: {
              nome: true,
              categoria: true,
            },
          },
        },
      },
      respostas: true,
    },
    orderBy: {
      dataInicio: "asc",
    },
  });

  if (tentativas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Progresso</h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução ao longo do tempo
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem dados ainda</h3>
            <p className="text-muted-foreground text-center">
              Realize algumas provas para começar a acompanhar seu progresso
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estatísticas gerais
  const totalTentativas = tentativas.length;
  const aprovacoes = tentativas.filter(
    (t) => (t.nota || 0) >= t.prova.notaMinima
  ).length;
  const mediaGeral =
    tentativas.reduce((sum, t) => sum + (t.nota || 0), 0) / totalTentativas;

  // Melhor e pior nota
  const notas = tentativas.map((t) => t.nota || 0);
  const melhorNota = Math.max(...notas);
  const piorNota = Math.min(...notas);

  // Tempo total de estudo
  const tempoTotal = tentativas.reduce((sum, t) => sum + (t.tempoGasto || 0), 0);
  const horasTotal = Math.floor(tempoTotal / 3600);
  const minutosTotal = Math.floor((tempoTotal % 3600) / 60);

  // Total de questões respondidas
  const totalQuestoesRespondidas = tentativas.reduce(
    (sum, t) => sum + t.respostas.length,
    0
  );
  const totalQuestoesCorretas = tentativas.reduce(
    (sum, t) => sum + t.respostas.filter((r) => r.correta).length,
    0
  );

  // Evolução da média (por mês)
  const evolucaoPorMes = tentativas.reduce((acc, t) => {
    const mes = format(t.dataInicio, "yyyy-MM");
    if (!acc[mes]) {
      acc[mes] = { soma: 0, count: 0 };
    }
    acc[mes].soma += t.nota || 0;
    acc[mes].count++;
    return acc;
  }, {} as Record<string, { soma: number; count: number }>);

  const evolucao = Object.entries(evolucaoPorMes)
    .map(([mes, data]) => ({
      mes,
      media: data.soma / data.count,
      tentativas: data.count,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  // Tendência (último mês vs mês anterior)
  const mesesOrdenados = Object.keys(evolucaoPorMes).sort();
  const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1];
  const mesAnterior = mesesOrdenados[mesesOrdenados.length - 2];

  const mediaUltimoMes = ultimoMes
    ? evolucaoPorMes[ultimoMes].soma / evolucaoPorMes[ultimoMes].count
    : 0;
  const mediaMesAnterior = mesAnterior
    ? evolucaoPorMes[mesAnterior].soma / evolucaoPorMes[mesAnterior].count
    : null;

  const tendencia =
    mediaMesAnterior !== null ? mediaUltimoMes - mediaMesAnterior : null;

  // Desempenho por categoria
  const porCategoria = tentativas.reduce((acc, t) => {
    const cat = t.prova.simulado.categoria;
    if (!acc[cat]) {
      acc[cat] = {
        total: 0,
        soma: 0,
        aprovacoes: 0,
        melhorNota: 0,
      };
    }
    acc[cat].total++;
    acc[cat].soma += t.nota || 0;
    if ((t.nota || 0) >= t.prova.notaMinima) {
      acc[cat].aprovacoes++;
    }
    if ((t.nota || 0) > acc[cat].melhorNota) {
      acc[cat].melhorNota = t.nota || 0;
    }
    return acc;
  }, {} as Record<string, { total: number; soma: number; aprovacoes: number; melhorNota: number }>);

  const categorias = Object.entries(porCategoria)
    .map(([categoria, data]) => ({
      categoria,
      media: data.soma / data.total,
      tentativas: data.total,
      taxaAprovacao: (data.aprovacoes / data.total) * 100,
      melhorNota: data.melhorNota,
    }))
    .sort((a, b) => b.media - a.media);

  // Melhores desempenhos por prova (considerando melhor nota de cada prova única)
  const melhorNotaPorProva = new Map<
    string,
    { provaId: string; provaNome: string; simulado: string; nota: number }
  >();

  tentativas.forEach((t) => {
    const atual = melhorNotaPorProva.get(t.provaId);
    if (!atual || (t.nota || 0) > atual.nota) {
      melhorNotaPorProva.set(t.provaId, {
        provaId: t.provaId,
        provaNome: t.prova.nome,
        simulado: t.prova.simulado.nome,
        nota: t.nota || 0,
      });
    }
  });

  const melhoresNotas = Array.from(melhorNotaPorProva.values())
    .sort((a, b) => b.nota - a.nota)
    .slice(0, 5);

  // Atividade recente (últimos 30 dias)
  const ultimos30Dias = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const atividadePorDia = tentativas.reduce((acc, t) => {
    const dia = format(t.dataInicio, "yyyy-MM-dd");
    if (!acc[dia]) {
      acc[dia] = 0;
    }
    acc[dia]++;
    return acc;
  }, {} as Record<string, number>);

  // Sequência de dias ativos
  let sequenciaAtual = 0;
  let maiorSequencia = 0;
  let sequenciaTemp = 0;

  for (let i = ultimos30Dias.length - 1; i >= 0; i--) {
    const dia = format(ultimos30Dias[i], "yyyy-MM-dd");
    if (atividadePorDia[dia]) {
      sequenciaTemp++;
      if (i === ultimos30Dias.length - 1 || sequenciaAtual > 0) {
        sequenciaAtual = sequenciaTemp;
      }
    } else {
      if (sequenciaTemp > maiorSequencia) {
        maiorSequencia = sequenciaTemp;
      }
      sequenciaTemp = 0;
      if (i === ultimos30Dias.length - 1) {
        sequenciaAtual = 0;
      }
    }
  }
  if (sequenciaTemp > maiorSequencia) {
    maiorSequencia = sequenciaTemp;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Progresso</h1>
        <p className="text-muted-foreground">
          Acompanhe sua evolução ao longo do tempo
        </p>
      </div>

      {/* Cards de destaque */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((aprovacoes / totalTentativas) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {aprovacoes} de {totalTentativas} tentativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaGeral.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs">
              {tendencia !== null ? (
                tendencia >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">
                      +{tendencia.toFixed(1)}% este mês
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">
                      {tendencia.toFixed(1)}% este mês
                    </span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">Primeiro mês</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Nota</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {melhorNota.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pior: {piorNota.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {sequenciaAtual} {sequenciaAtual === 1 ? "dia" : "dias"}
            </div>
            <p className="text-xs text-muted-foreground">
              Recorde: {maiorSequencia} dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Evolução mensal */}
      {evolucao.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evolucao.map((e, index) => {
                const anterior = index > 0 ? evolucao[index - 1].media : null;
                const diff = anterior !== null ? e.media - anterior : null;

                return (
                  <div key={e.mes} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {format(new Date(e.mes + "-01"), "MMMM yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        {diff !== null && (
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              diff >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {diff >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {diff >= 0 ? "+" : ""}
                            {diff.toFixed(1)}%
                          </span>
                        )}
                        <span className="font-semibold">{e.media.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress
                      value={e.media}
                      className={`h-2 ${
                        e.media >= 70
                          ? "[&>div]:bg-green-500"
                          : e.media >= 40
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-red-500"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {e.tentativas} {e.tentativas === 1 ? "tentativa" : "tentativas"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Desempenho por categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Desempenho por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorias.map((cat) => (
                <div key={cat.categoria} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{cat.categoria}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {cat.tentativas} tentativas
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        cat.media >= 70
                          ? "text-green-600"
                          : cat.media >= 40
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {cat.media.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={cat.media}
                    className={`h-2 ${
                      cat.media >= 70
                        ? "[&>div]:bg-green-500"
                        : cat.media >= 40
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Aprovação: {cat.taxaAprovacao.toFixed(0)}%</span>
                    <span>Melhor: {cat.melhorNota.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de questões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Estatísticas de Questões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{totalQuestoesRespondidas}</div>
                <p className="text-sm text-muted-foreground">questões respondidas</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Taxa de acerto geral</span>
                  <span
                    className={`font-semibold ${
                      (totalQuestoesCorretas / totalQuestoesRespondidas) * 100 >= 70
                        ? "text-green-600"
                        : (totalQuestoesCorretas / totalQuestoesRespondidas) * 100 >= 40
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {((totalQuestoesCorretas / totalQuestoesRespondidas) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={(totalQuestoesCorretas / totalQuestoesRespondidas) * 100}
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg border p-3">
                  <div className="text-2xl font-bold text-green-600">{totalQuestoesCorretas}</div>
                  <p className="text-xs text-muted-foreground">corretas</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {totalQuestoesRespondidas - totalQuestoesCorretas}
                  </div>
                  <p className="text-xs text-muted-foreground">incorretas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 melhores notas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                      : nota.nota >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {nota.nota.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo geral */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total de Provas</p>
              <p className="text-3xl font-bold">{totalTentativas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Questões Respondidas</p>
              <p className="text-3xl font-bold">{totalQuestoesRespondidas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <p className="text-3xl font-bold">
                {horasTotal > 0 ? `${horasTotal}h ${minutosTotal}m` : `${minutosTotal}m`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorias</p>
              <p className="text-3xl font-bold">{categorias.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
