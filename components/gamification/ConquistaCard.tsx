"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConquistaCardProps {
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: string;
  xpBonus: number;
  desbloqueada: boolean;
  desbloqueadaEm?: Date | string | null;
  progresso?: number;
  progressoAtual?: number;
  progressoTotal?: number;
  onClick?: () => void;
  className?: string;
}

const CATEGORIA_COLORS: Record<string, string> = {
  PROVAS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  NOTAS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  STREAKS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  ESPECIAIS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function ConquistaCard({
  codigo,
  nome,
  descricao,
  icone,
  categoria,
  xpBonus,
  desbloqueada,
  desbloqueadaEm,
  progresso = 0,
  progressoAtual,
  progressoTotal,
  onClick,
  className,
}: ConquistaCardProps) {
  const dataDesbloqueio = desbloqueadaEm
    ? new Date(desbloqueadaEm)
    : null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        desbloqueada
          ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700"
          : "opacity-75 hover:opacity-100",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl",
              desbloqueada
                ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                : "bg-muted"
            )}
          >
            {desbloqueada ? (
              icone
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={cn(
                  "font-semibold truncate",
                  !desbloqueada && "text-muted-foreground"
                )}>
                  {nome}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {descricao}
                </p>
              </div>
              {desbloqueada && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={CATEGORIA_COLORS[categoria]}>
                {categoria}
              </Badge>
              <Badge variant="outline" className="text-xs">
                +{xpBonus} XP
              </Badge>
            </div>

            {/* Progresso ou data */}
            {desbloqueada ? (
              dataDesbloqueio && (
                <p className="text-xs text-muted-foreground mt-2">
                  Desbloqueada {formatDistanceToNow(dataDesbloqueio, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )
            ) : (
              progressoTotal !== undefined && progressoTotal > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>
                      {progressoAtual} / {progressoTotal}
                    </span>
                  </div>
                  <Progress value={progresso} className="h-1.5" />
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
