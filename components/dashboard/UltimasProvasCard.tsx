"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, FileText, CheckCircle2, XCircle } from "lucide-react";

interface UltimaProva {
  id: string;
  titulo: string;
  categoria: string | null;
  nota: number | null;
  aprovado: boolean | null;
  data: string;
}

interface UltimasProvasCardProps {
  provas: UltimaProva[];
  loading?: boolean;
}

export function UltimasProvasCard({ provas, loading = false }: UltimasProvasCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Últimas Provas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Últimas Provas</CardTitle>
      </CardHeader>
      <CardContent>
        {provas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma prova realizada ainda
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {provas.map((prova) => (
              <Link
                key={prova.id}
                href={`/aluno/provas/${prova.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium truncate">{prova.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(prova.data)}
                    </span>
                    {prova.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {prova.categoria}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-lg font-bold">
                    {prova.nota}%
                  </span>
                  {prova.aprovado ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </Link>
            ))}
            {provas.length >= 5 && (
              <Link
                href="/aluno/provas"
                className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
              >
                Ver histórico
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
