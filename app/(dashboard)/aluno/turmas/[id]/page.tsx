import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Lock,
  AlertCircle,
} from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Detalhes da Turma",
};

interface TurmaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TurmaDetailPage({ params }: TurmaDetailPageProps) {
  const { id } = await params;
  const user = await requireRole(["ALUNO"]);

  // Verificar se o aluno está na turma
  const turmaAluno = await db.turmaAluno.findFirst({
    where: {
      turmaId: id,
      alunoId: user.id,
    },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          codigo: true,
          ativa: true,
          docente: {
            select: {
              nome: true,
              email: true,
            },
          },
          _count: {
            select: {
              alunos: true,
              provas: true,
            },
          },
        },
      },
    },
  });

  if (!turmaAluno) {
    notFound();
  }

  const turma = turmaAluno.turma;

  // Buscar as provas da turma com informações de tentativas do aluno
  const turmaProvas = await db.turmaProva.findMany({
    where: {
      turmaId: id,
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
          status: true,
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Buscar tentativas do aluno para cada prova
  const provaIds = turmaProvas.map((tp) => tp.prova.id);
  const tentativas = await db.tentativa.findMany({
    where: {
      alunoId: user.id,
      provaId: { in: provaIds },
    },
    select: {
      id: true,
      provaId: true,
      status: true,
      nota: true,
    },
  });

  // Agrupar tentativas por prova
  const tentativasPorProva = tentativas.reduce((acc, t) => {
    if (!acc[t.provaId]) {
      acc[t.provaId] = [];
    }
    acc[t.provaId].push(t);
    return acc;
  }, {} as Record<string, typeof tentativas>);

  // Função para determinar o status da prova
  const getProvaStatus = (tp: typeof turmaProvas[0]) => {
    const now = new Date();
    const dataInicio = tp.dataInicio;
    const dataFim = tp.dataFim;

    if (dataInicio && isFuture(dataInicio)) {
      return { status: "agendada", label: "Agendada", color: "secondary" };
    }

    if (dataFim && isPast(dataFim)) {
      return { status: "encerrada", label: "Encerrada", color: "destructive" };
    }

    if (dataInicio && dataFim && isWithinInterval(now, { start: dataInicio, end: dataFim })) {
      return { status: "disponivel", label: "Disponível", color: "default" };
    }

    if (!dataInicio && !dataFim) {
      return { status: "disponivel", label: "Disponível", color: "default" };
    }

    if (dataInicio && !dataFim && isPast(dataInicio)) {
      return { status: "disponivel", label: "Disponível", color: "default" };
    }

    return { status: "disponivel", label: "Disponível", color: "default" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/aluno/turmas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{turma.nome}</h1>
            {!turma.ativa && <Badge variant="secondary">Inativa</Badge>}
          </div>
          {turma.descricao && (
            <p className="text-muted-foreground mt-1">{turma.descricao}</p>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turma._count.alunos}</p>
                <p className="text-xs text-muted-foreground">Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <ClipboardList className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{turma._count.provas}</p>
                <p className="text-xs text-muted-foreground">Provas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(tentativasPorProva).filter(ts => ts.some(t => t.status === "SUBMETIDA")).length}
                </p>
                <p className="text-xs text-muted-foreground">Provas realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(turmaAluno.dataEntrada), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">Data de entrada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professor Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {turma.docente.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold">{turma.docente.nome}</p>
              <p className="text-sm text-muted-foreground">Professor(a)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provas da Turma */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Provas da Turma</h2>

        {turmaProvas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma prova disponível</h3>
              <p className="text-muted-foreground text-center">
                O professor ainda não adicionou provas a esta turma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {turmaProvas.map((tp) => {
              const prova = tp.prova;
              const tentativasProva = tentativasPorProva[prova.id] || [];
              const tentativasSubmetidas = tentativasProva.filter(t => t.status === "SUBMETIDA");
              const melhorNota = tentativasSubmetidas.length > 0
                ? Math.max(...tentativasSubmetidas.map(t => t.nota || 0))
                : null;
              const temEmAndamento = tentativasProva.some(t => t.status === "EM_ANDAMENTO");
              const provaStatus = getProvaStatus(tp);

              const podeIniciar = provaStatus.status === "disponivel" &&
                (prova.tentativasMax === null || tentativasSubmetidas.length < prova.tentativasMax);

              return (
                <Card key={tp.id} className={provaStatus.status === "encerrada" ? "opacity-70" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{prova.nome}</CardTitle>
                          <Badge variant={provaStatus.color as "default" | "secondary" | "destructive"}>
                            {provaStatus.label}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {prova.simulado.categoria}
                          </Badge>
                          <span>{prova.simulado.nome}</span>
                        </CardDescription>
                      </div>

                      {provaStatus.status === "disponivel" && (
                        <Button asChild size="sm" disabled={!podeIniciar}>
                          <Link href={`/aluno/provas/${prova.id}`}>
                            {temEmAndamento ? (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Continuar
                              </>
                            ) : (
                              <>
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Acessar
                              </>
                            )}
                          </Link>
                        </Button>
                      )}

                      {provaStatus.status === "agendada" && (
                        <Button size="sm" disabled variant="outline">
                          <Lock className="h-4 w-4 mr-2" />
                          Aguardando
                        </Button>
                      )}

                      {provaStatus.status === "encerrada" && tentativasSubmetidas.length > 0 && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/aluno/provas/${prova.id}`}>
                            Ver Resultados
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Info da prova */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" />
                        {prova._count.questoes} questões
                      </span>
                      {prova.tempoLimite && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {prova.tempoLimite} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Nota mínima: {prova.notaMinima}%
                      </span>
                      {prova.tentativasMax && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {tentativasSubmetidas.length}/{prova.tentativasMax} tentativas
                        </span>
                      )}
                    </div>

                    {/* Datas */}
                    {(tp.dataInicio || tp.dataFim) && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        {tp.dataInicio && (
                          <span className="text-muted-foreground">
                            Início: {format(new Date(tp.dataInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                        {tp.dataFim && (
                          <span className="text-muted-foreground">
                            Término: {format(new Date(tp.dataFim), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Resultado */}
                    {melhorNota !== null && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Sua melhor nota</span>
                          <span className={`text-sm font-bold ${melhorNota >= prova.notaMinima ? "text-green-500" : "text-red-500"}`}>
                            {melhorNota.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={melhorNota}
                          className={melhorNota >= prova.notaMinima ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          {melhorNota >= prova.notaMinima ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-500">Aprovado</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-500">Nota insuficiente</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
