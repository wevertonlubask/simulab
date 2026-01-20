"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ImportResultCardProps {
  result: {
    importadas: number;
    ignoradas: number;
    erros: number;
    total: number;
  };
  simuladoId: string;
}

export function ImportResultCard({ result, simuladoId }: ImportResultCardProps) {
  const isSuccess = result.erros === 0 && result.importadas > 0;
  const isPartial = result.importadas > 0 && (result.erros > 0 || result.ignoradas > 0);

  return (
    <Card className={isSuccess ? "border-green-500/50" : isPartial ? "border-yellow-500/50" : "border-red-500/50"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSuccess ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Importação Concluída
            </>
          ) : isPartial ? (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Importação Parcial
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Falha na Importação
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-green-500">{result.importadas}</p>
            <p className="text-sm text-muted-foreground">Importadas</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-yellow-500">{result.ignoradas}</p>
            <p className="text-sm text-muted-foreground">Ignoradas</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-red-500">{result.erros}</p>
            <p className="text-sm text-muted-foreground">Erros</p>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button asChild className="flex-1">
            <Link href={`/docente/simulados/${simuladoId}/questoes`}>
              Ver Questões
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Importar Mais
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
