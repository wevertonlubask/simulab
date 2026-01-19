import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ClipboardList, Users, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Provas",
};

export default async function AlunoProvasPage() {
  const user = await requireRole(["ALUNO"]);

  // Buscar turmas do aluno
  const turmasAluno = await db.turmaAluno.findMany({
    where: {
      alunoId: user.id,
      turma: {
        ativa: true,
      },
    },
  });

  const turmaIds = turmasAluno.map((ta) => ta.turmaId);

  // Buscar provas disponíveis
  const now = new Date();
  const turmaProvas = await db.turmaProva.findMany({
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
          descricao: true,
          tempoLimite: true,
          tentativasMax: true,
          notaMinima: true,
          simulado: {
            select: {
              nome: true,
              categoria: true,
              subcategoria: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  // Buscar tentativas do aluno para cada prova
  const provaIds = Array.from(new Set(turmaProvas.map((tp) => tp.prova.id)));
  const tentativas = await db.tentativa.findMany({
    where: {
      alunoId: user.id,
      provaId: { in: provaIds },
    },
    select: {
      provaId: true,
      numero: true,
      nota: true,
      status: true,
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

  // Remover duplicatas e calcular disponibilidade
  const provasUnicas = turmaProvas.reduce((acc, tp) => {
    if (!acc.find((p) => p.prova.id === tp.prova.id)) {
      const disponivel =
        (!tp.dataInicio || new Date(tp.dataInicio) <= now) &&
        (!tp.dataFim || new Date(tp.dataFim) >= now);

      const provaTentativas = tentativasPorProva[tp.prova.id] || [];
      const tentativasRealizadas = provaTentativas.length;
      // null = tentativas ilimitadas
      const tentativasIlimitadas = tp.prova.tentativasMax === null;
      const tentativasRestantes = tentativasIlimitadas
        ? Infinity
        : Math.max(0, tp.prova.tentativasMax - tentativasRealizadas);
      const melhorNota = provaTentativas.reduce((max, t) => {
        if (t.nota !== null && t.nota > max) return t.nota;
        return max;
      }, 0);
      const temTentativaEmAndamento = provaTentativas.some(
        (t) => t.status === "EM_ANDAMENTO"
      );

      acc.push({
        ...tp,
        disponivel,
        tentativasRealizadas,
        tentativasRestantes,
        tentativasIlimitadas,
        melhorNota,
        temTentativaEmAndamento,
      });
    }
    return acc;
  }, [] as (typeof turmaProvas[0] & {
    disponivel: boolean;
    tentativasRealizadas: number;
    tentativasRestantes: number;
    tentativasIlimitadas: boolean;
    melhorNota: number;
    temTentativaEmAndamento: boolean;
  })[]);

  // Separar provas disponíveis e indisponíveis
  const provasDisponiveis = provasUnicas.filter((p) => p.disponivel);
  const provasIndisponiveis = provasUnicas.filter((p) => !p.disponivel);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provas</h1>
        <p className="text-muted-foreground">
          Veja todas as provas disponíveis para você
        </p>
      </div>

      {turmaIds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Você não está em nenhuma turma
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Entre em uma turma para ver as provas disponíveis
            </p>
            <Button asChild>
              <Link href="/aluno/turmas">Entrar em uma Turma</Link>
            </Button>
          </CardContent>
        </Card>
      ) : provasUnicas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova disponível</h3>
            <p className="text-muted-foreground text-center">
              Ainda não há provas vinculadas às suas turmas
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Provas Disponíveis */}
          {provasDisponiveis.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Disponíveis Agora</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {provasDisponiveis.map((tp) => (
                  <Card key={tp.prova.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {tp.prova.simulado.categoria}
                          </Badge>
                          <CardTitle className="text-lg">
                            {tp.prova.nome}
                          </CardTitle>
                        </div>
                        {tp.melhorNota > 0 && (
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${
                                tp.melhorNota >= tp.prova.notaMinima
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {tp.melhorNota.toFixed(0)}%
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Melhor nota
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {tp.prova.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tp.prova.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          {tp.prova._count.questoes} questões
                        </span>
                        {tp.prova.tempoLimite && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tp.prova.tempoLimite} min
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {tp.tentativasIlimitadas
                            ? `${tp.tentativasRealizadas} de tentativas`
                            : `${tp.tentativasRealizadas} de ${tp.prova.tentativasMax} tentativas`}
                        </span>
                        {tp.melhorNota >= tp.prova.notaMinima && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        )}
                      </div>

                      <div className="pt-2">
                        {tp.temTentativaEmAndamento ? (
                          <Button className="w-full" asChild>
                            <Link href={`/aluno/provas/${tp.prova.id}`}>
                              Continuar Prova
                            </Link>
                          </Button>
                        ) : tp.tentativasIlimitadas || tp.tentativasRestantes > 0 ? (
                          <Button className="w-full" asChild>
                            <Link href={`/aluno/provas/${tp.prova.id}`}>
                              {tp.tentativasRealizadas > 0
                                ? "Tentar Novamente"
                                : "Iniciar Prova"}
                            </Link>
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            Sem tentativas restantes
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Provas Indisponíveis */}
          {provasIndisponiveis.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-muted-foreground">
                Fora do Período
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {provasIndisponiveis.map((tp) => (
                  <Card
                    key={tp.prova.id}
                    className="flex flex-col opacity-60"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {tp.prova.simulado.categoria}
                          </Badge>
                          <CardTitle className="text-lg">
                            {tp.prova.nome}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          {tp.prova._count.questoes} questões
                        </span>
                        {tp.prova.tempoLimite && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {tp.prova.tempoLimite} min
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {tp.dataInicio && new Date(tp.dataInicio) > now ? (
                          <p>
                            Disponível a partir de{" "}
                            {new Date(tp.dataInicio).toLocaleDateString("pt-BR")}
                          </p>
                        ) : tp.dataFim && new Date(tp.dataFim) < now ? (
                          <p>
                            Encerrada em{" "}
                            {new Date(tp.dataFim).toLocaleDateString("pt-BR")}
                          </p>
                        ) : null}
                      </div>

                      <div className="pt-2">
                        <Button className="w-full" variant="outline" disabled>
                          Indisponível
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
