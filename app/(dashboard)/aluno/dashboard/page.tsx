import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Award,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Dashboard do Aluno",
};

export default async function AlunoDashboardPage() {
  const user = await requireRole(["ALUNO"]);

  // Buscar turmas do aluno
  const turmasAluno = await db.turmaAluno.findMany({
    where: {
      alunoId: user.id,
      turma: {
        ativa: true,
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

  const turmaIds = turmasAluno.map((ta) => ta.turmaId);

  // Buscar provas disponíveis através da relação TurmaProva
  const provasDisponiveis = await db.turmaProva.findMany({
    where: {
      turmaId: { in: turmaIds },
      prova: {
        status: "PUBLICADA",
      },
    },
    include: {
      prova: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          tempoLimite: true,
          tentativasMax: true,
          notaMinima: true,
          simulado: {
            select: {
              nome: true,
              categoria: true,
            },
          },
          _count: {
            select: {
              questoes: true,
            },
          },
        },
      },
      turma: {
        select: {
          nome: true,
        },
      },
    },
  });

  // Mapear para formato mais conveniente
  const todasProvas = provasDisponiveis.map((tp) => ({
    ...tp.prova,
    turma: tp.turma.nome,
  }));

  // Remover duplicatas
  const uniqueProvas = todasProvas.reduce((acc, prova) => {
    if (!acc.find((p) => p.id === prova.id)) {
      acc.push(prova);
    }
    return acc;
  }, [] as typeof todasProvas);

  // Buscar TODAS as tentativas do aluno para estatísticas
  const todasTentativas = await db.tentativa.findMany({
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
              categoria: true,
            },
          },
        },
      },
    },
    orderBy: {
      dataInicio: "desc",
    },
  });

  // Tentativas recentes (últimas 5)
  const tentativasRecentes = await db.tentativa.findMany({
    where: {
      alunoId: user.id,
    },
    include: {
      prova: {
        select: {
          id: true,
          nome: true,
          notaMinima: true,
          simulado: {
            select: {
              categoria: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Estatísticas gerais
  const totalTentativas = todasTentativas.length;
  const totalAprovacoes = todasTentativas.filter(
    (t) => (t.nota || 0) >= t.prova.notaMinima
  ).length;
  const mediaGeral =
    totalTentativas > 0
      ? todasTentativas.reduce((sum, t) => sum + (t.nota || 0), 0) /
        totalTentativas
      : 0;

  // Melhor nota por prova
  const melhorNotaPorProva = new Map<string, number>();
  todasTentativas.forEach((t) => {
    const atual = melhorNotaPorProva.get(t.provaId) || 0;
    if ((t.nota || 0) > atual) {
      melhorNotaPorProva.set(t.provaId, t.nota || 0);
    }
  });
  const provasUnicasRealizadas = melhorNotaPorProva.size;

  // Estatísticas por categoria
  const estatisticasPorCategoria = todasTentativas.reduce((acc, t) => {
    const categoria = t.prova.simulado.categoria;
    if (!acc[categoria]) {
      acc[categoria] = {
        totalTentativas: 0,
        somaNotas: 0,
        aprovacoes: 0,
      };
    }
    acc[categoria].totalTentativas++;
    acc[categoria].somaNotas += t.nota || 0;
    if ((t.nota || 0) >= t.prova.notaMinima) {
      acc[categoria].aprovacoes++;
    }
    return acc;
  }, {} as Record<string, { totalTentativas: number; somaNotas: number; aprovacoes: number }>);

  const categorias = Object.entries(estatisticasPorCategoria).map(
    ([categoria, stats]) => ({
      categoria,
      media: stats.somaNotas / stats.totalTentativas,
      tentativas: stats.totalTentativas,
      taxaAprovacao: (stats.aprovacoes / stats.totalTentativas) * 100,
    })
  );

  // Tendência (últimas 10 tentativas vs anteriores)
  const ultimas10 = todasTentativas.slice(0, 10);
  const anteriores = todasTentativas.slice(10, 20);

  const mediaUltimas =
    ultimas10.length > 0
      ? ultimas10.reduce((sum, t) => sum + (t.nota || 0), 0) / ultimas10.length
      : 0;
  const mediaAnteriores =
    anteriores.length > 0
      ? anteriores.reduce((sum, t) => sum + (t.nota || 0), 0) / anteriores.length
      : 0;

  const tendencia =
    anteriores.length > 0 ? mediaUltimas - mediaAnteriores : null;

  // Última atividade
  const ultimaAtividade = todasTentativas[0]?.dataInicio || null;

  // Calcular tempo total de estudo
  const tempoTotalEstudo = todasTentativas.reduce(
    (sum, t) => sum + (t.tempoGasto || 0),
    0
  );
  const horasEstudo = Math.floor(tempoTotalEstudo / 3600);
  const minutosEstudo = Math.floor((tempoTotalEstudo % 3600) / 60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user.nome.split(" ")[0]}!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provas Realizadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{provasUnicasRealizadas}</div>
            <p className="text-xs text-muted-foreground">
              {totalTentativas} tentativas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalTentativas > 0
                ? `${((totalAprovacoes / totalTentativas) * 100).toFixed(0)}%`
                : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalAprovacoes} aprovações de {totalTentativas}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaGeral > 0 ? `${mediaGeral.toFixed(1)}%` : "--"}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {tendencia !== null ? (
                tendencia >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">
                      +{tendencia.toFixed(1)}% de melhora
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">
                      {tendencia.toFixed(1)}% de queda
                    </span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">
                  Continue praticando!
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Estudo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {horasEstudo > 0 ? `${horasEstudo}h ${minutosEstudo}m` : `${minutosEstudo}m`}
            </div>
            <p className="text-xs text-muted-foreground">
              {ultimaAtividade
                ? `Última atividade: ${format(ultimaAtividade, "dd/MM", {
                    locale: ptBR,
                  })}`
                : "Comece a estudar!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desempenho por Categoria */}
      {categorias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Desempenho por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categorias.map((cat) => (
                <div
                  key={cat.categoria}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{cat.categoria}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {cat.tentativas} tentativas
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Média</span>
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
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Taxa de aprovação: {cat.taxaAprovacao.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Provas Disponíveis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Provas Disponíveis</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/aluno/provas">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {uniqueProvas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Nenhuma prova disponível no momento</p>
                {turmasAluno.length === 0 && (
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/aluno/turmas">Entre em uma turma</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {uniqueProvas.slice(0, 3).map((prova) => (
                  <div
                    key={prova.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{prova.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {prova.simulado.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {prova._count.questoes} questões
                        </span>
                        {prova.tempoLimite && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {prova.tempoLimite} min
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/aluno/provas/${prova.id}`}>Iniciar</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividade Recente</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/aluno/historico">
                Ver histórico
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tentativasRecentes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Trophy className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>Você ainda não realizou nenhuma prova</p>
                <p className="text-sm">
                  Acesse a seção de provas para começar!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tentativasRecentes.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{t.prova.nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {t.prova.simulado.categoria}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Tentativa {t.numero}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {t.status === "EM_ANDAMENTO" ? (
                        <div>
                          <Badge variant="outline" className="mb-1">
                            <Clock className="mr-1 h-3 w-3" />
                            Em andamento
                          </Badge>
                          <Button size="sm" variant="link" asChild className="p-0 h-auto">
                            <Link href={`/aluno/provas/${t.provaId}/realizar/${t.id}`}>
                              Continuar
                            </Link>
                          </Button>
                        </div>
                      ) : t.status === "SUBMETIDA" ? (
                        <div className="flex items-center gap-2">
                          {(t.nota || 0) >= t.prova.notaMinima ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`font-bold ${
                              (t.nota || 0) >= t.prova.notaMinima
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {t.nota?.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <Badge variant="destructive">Expirada</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Minhas Turmas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Minhas Turmas</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/aluno/turmas">
              <Users className="mr-2 h-4 w-4" />
              Entrar em Turma
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {turmasAluno.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Você ainda não está em nenhuma turma</p>
              <p className="text-sm">
                Peça o código ao seu professor para entrar em uma turma
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {turmasAluno.map((ta) => (
                <div key={ta.id} className="rounded-lg border p-4">
                  <p className="font-medium">{ta.turma.nome}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas rápidas */}
      {totalTentativas < 5 && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <Award className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 mb-1">
                  Dica para melhorar seu desempenho
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalTentativas === 0
                    ? "Comece realizando provas nas áreas que você mais precisa praticar. Quanto mais você praticar, melhor será seu desempenho!"
                    : mediaGeral < 50
                    ? "Revise o gabarito das questões que você errou. Entender seus erros é o primeiro passo para melhorar!"
                    : "Você está indo bem! Continue praticando para manter e melhorar seu desempenho."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
