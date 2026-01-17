"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Play, ChevronRight } from "lucide-react";

interface ProvaPendente {
  id: string;
  titulo: string;
  turma: string;
  turmaId: string;
  prazo: string | null;
  tentativasRestantes: number;
  tempoLimite: number | null;
}

interface ProvasPendentesCardProps {
  provas: ProvaPendente[];
  loading?: boolean;
}

export function ProvasPendentesCard({ provas, loading = false }: ProvasPendentesCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expirado";
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    if (diffDays <= 7) return `${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Provas Pendentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Provas Pendentes</CardTitle>
          {provas.length > 0 && (
            <Badge variant="secondary">{provas.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {provas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma prova pendente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {provas.map((prova) => {
              const prazoText = formatDate(prova.prazo);
              const isUrgent = prova.prazo && new Date(prova.prazo) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={prova.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium truncate">{prova.titulo}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        {prova.turma}
                      </span>
                      {prazoText && (
                        <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs">
                          Prazo: {prazoText}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {prova.tentativasRestantes} tentativa{prova.tentativasRestantes !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <Link href={`/aluno/simulados/${prova.id}/iniciar`}>
                    <Button size="sm" className="shrink-0">
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  </Link>
                </div>
              );
            })}
            {provas.length >= 5 && (
              <Link
                href="/aluno/simulados"
                className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
