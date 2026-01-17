"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Edit } from "lucide-react";

interface QuestaoProblematica {
  questaoId: string;
  enunciado: string;
  simulado: string;
  taxaErro: number;
  vezesRespondida: number;
}

interface QuestoesProblematicasCardProps {
  questoes: QuestaoProblematica[];
  loading?: boolean;
}

export function QuestoesProblematicasCard({
  questoes,
  loading = false,
}: QuestoesProblematicasCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Questões Problemáticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Questões Problemáticas
          </CardTitle>
          {questoes.length > 0 && (
            <Badge variant="outline">{questoes.length} questões</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-500/10 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma questão com alta taxa de erro
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulado</TableHead>
                  <TableHead className="hidden md:table-cell">Enunciado</TableHead>
                  <TableHead className="text-center">Erro</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Resp.</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questoes.map((questao) => (
                  <TableRow key={questao.questaoId}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {questao.simulado}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <p className="truncate text-sm">{questao.enunciado}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="destructive"
                        className={
                          questao.taxaErro >= 70
                            ? "bg-red-500"
                            : questao.taxaErro >= 50
                            ? "bg-yellow-500"
                            : "bg-orange-500"
                        }
                      >
                        {questao.taxaErro}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell text-muted-foreground">
                      {questao.vezesRespondida}
                    </TableCell>
                    <TableCell>
                      <Link href={`/docente/questoes/${questao.questaoId}/editar`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
