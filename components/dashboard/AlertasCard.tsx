"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  UserX,
  TrendingDown,
  FileQuestion,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface AlertasData {
  alunosInativos: number;
  alunosInativosList: { id: string; nome: string }[];
  provasBaixaAprovacao: number;
  provasBaixaAprovacaoList: { id: string; titulo: string; taxa: number }[];
  simuladosNaoPublicados: number;
}

interface AlertasCardProps {
  alertas: AlertasData | null;
  loading?: boolean;
}

export function AlertasCard({ alertas, loading = false }: AlertasCardProps) {
  if (loading) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alertas) return null;

  const hasAlerts =
    alertas.alunosInativos > 0 ||
    alertas.provasBaixaAprovacao > 0 ||
    alertas.simuladosNaoPublicados > 0;

  if (!hasAlerts) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <AlertTriangle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-green-600">Tudo em ordem!</h3>
              <p className="text-sm text-muted-foreground">
                Não há alertas no momento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertas.alunosInativos > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                <UserX className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Alunos Inativos</h4>
                <p className="text-sm text-muted-foreground">
                  {alertas.alunosInativos} aluno{alertas.alunosInativos !== 1 ? "s" : ""} sem atividade há mais de 7 dias
                </p>
                {alertas.alunosInativosList.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {alertas.alunosInativosList.slice(0, 3).map((aluno) => (
                      <li key={aluno.id} className="text-sm text-muted-foreground">
                        • {aluno.nome}
                      </li>
                    ))}
                    {alertas.alunosInativos > 3 && (
                      <li className="text-sm text-muted-foreground">
                        • e mais {alertas.alunosInativos - 3} aluno(s)...
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {alertas.provasBaixaAprovacao > 0 && (
          <div className="rounded-lg border border-red-500/30 bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Baixa Taxa de Aprovação</h4>
                <p className="text-sm text-muted-foreground">
                  {alertas.provasBaixaAprovacao} simulado{alertas.provasBaixaAprovacao !== 1 ? "s" : ""} com menos de 30% de aprovação
                </p>
                {alertas.provasBaixaAprovacaoList.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {alertas.provasBaixaAprovacaoList.slice(0, 3).map((prova) => (
                      <li key={prova.id} className="text-sm text-muted-foreground">
                        • {prova.titulo} ({prova.taxa}%)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Link href="/docente/simulados">
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {alertas.simuladosNaoPublicados > 0 && (
          <div className="rounded-lg border border-blue-500/30 bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <FileQuestion className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Simulados não Publicados</h4>
                <p className="text-sm text-muted-foreground">
                  {alertas.simuladosNaoPublicados} simulado{alertas.simuladosNaoPublicados !== 1 ? "s" : ""} aguardando publicação
                </p>
              </div>
              <Link href="/docente/simulados">
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
