import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  History,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Histórico",
};

export default async function HistoricoPage() {
  const user = await requireRole(["ALUNO"]);

  // Buscar todas as tentativas do aluno
  const tentativas = await db.tentativa.findMany({
    where: {
      alunoId: user.id,
    },
    include: {
      prova: {
        include: {
          simulado: {
            select: {
              nome: true,
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

  // Agrupar por prova
  const tentativasPorProva = tentativas.reduce((acc, t) => {
    if (!acc[t.provaId]) {
      acc[t.provaId] = {
        prova: t.prova,
        tentativas: [],
      };
    }
    acc[t.provaId].tentativas.push(t);
    return acc;
  }, {} as Record<string, { prova: typeof tentativas[0]["prova"]; tentativas: typeof tentativas }>);

  // Estatísticas gerais
  const totalTentativas = tentativas.length;
  const tentativasFinalizadas = tentativas.filter(
    (t) => t.status === "SUBMETIDA"
  );
  const aprovacoes = tentativasFinalizadas.filter(
    (t) => (t.nota || 0) >= t.prova.notaMinima
  ).length;
  const mediaGeral =
    tentativasFinalizadas.length > 0
      ? tentativasFinalizadas.reduce((sum, t) => sum + (t.nota || 0), 0) /
        tentativasFinalizadas.length
      : 0;

  const formatarTempoGasto = (segundos: number | null) => {
    if (!segundos) return "--";
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}min ${segs}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground">
          Veja todas as suas tentativas anteriores
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Tentativas
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTentativas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tentativasFinalizadas.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aprovacoes}</div>
            <p className="text-xs text-muted-foreground">
              {tentativasFinalizadas.length > 0
                ? `${((aprovacoes / tentativasFinalizadas.length) * 100).toFixed(
                    0
                  )}% de aprovação`
                : "Nenhuma prova finalizada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mediaGeral > 0 ? `${mediaGeral.toFixed(1)}%` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico por Prova */}
      {Object.keys(tentativasPorProva).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tentativa</h3>
            <p className="text-muted-foreground text-center">
              Você ainda não realizou nenhuma prova
            </p>
            <Button asChild className="mt-4">
              <Link href="/aluno/provas">Ver Provas Disponíveis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(tentativasPorProva).map(({ prova, tentativas }) => {
            const melhorNota = Math.max(
              ...tentativas.filter((t) => t.nota !== null).map((t) => t.nota || 0)
            );
            const aprovado = melhorNota >= prova.notaMinima;

            return (
              <Card key={prova.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {prova.simulado.categoria}
                      </Badge>
                      <CardTitle className="text-lg">{prova.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {prova.simulado.nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        {aprovado ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span
                          className={`text-2xl font-bold ${
                            aprovado ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {melhorNota > 0 ? `${melhorNota.toFixed(1)}%` : "--"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Melhor nota (mín: {prova.notaMinima}%)
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tentativa</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Acertos</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tentativas.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            #{t.numero}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(t.dataInicio),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR }
                            )}
                          </TableCell>
                          <TableCell>
                            {formatarTempoGasto(t.tempoGasto)}
                          </TableCell>
                          <TableCell>
                            {t.status === "SUBMETIDA"
                              ? `${t.totalAcertos}/${t.totalQuestoes}`
                              : "--"}
                          </TableCell>
                          <TableCell>
                            {t.status === "SUBMETIDA" ? (
                              <span
                                className={`font-semibold ${
                                  (t.nota || 0) >= prova.notaMinima
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {t.nota?.toFixed(1)}%
                              </span>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          <TableCell>
                            {t.status === "EM_ANDAMENTO" ? (
                              <Badge variant="outline">
                                <Clock className="mr-1 h-3 w-3" />
                                Em andamento
                              </Badge>
                            ) : t.status === "SUBMETIDA" ? (
                              <Badge
                                variant={
                                  (t.nota || 0) >= prova.notaMinima
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {(t.nota || 0) >= prova.notaMinima
                                  ? "Aprovado"
                                  : "Reprovado"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Expirada</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {t.status === "EM_ANDAMENTO" ? (
                              <Button size="sm" asChild>
                                <Link
                                  href={`/aluno/provas/${prova.id}/realizar/${t.id}`}
                                >
                                  Continuar
                                </Link>
                              </Button>
                            ) : t.status === "SUBMETIDA" ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/aluno/provas/${prova.id}/resultado/${t.id}`}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Link>
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
