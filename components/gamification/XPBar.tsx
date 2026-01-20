"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface XPBarProps {
  xpAtual: number;
  xpNecessario: number;
  xpProximoNivel: number;
  nivelAtual: number;
  nomeNivel: string;
  progresso: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function XPBar({
  xpAtual,
  xpNecessario,
  xpProximoNivel,
  nivelAtual,
  nomeNivel,
  progresso,
  className,
  showLabel = true,
  size = "md",
  animated = true,
}: XPBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const xpNoNivel = xpAtual - xpNecessario;
  const xpParaProximo = xpProximoNivel - xpNecessario;

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">Nível {nivelAtual}</span>
            <span className="text-muted-foreground">- {nomeNivel}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help">
                  {xpNoNivel.toLocaleString()} / {xpParaProximo.toLocaleString()} XP
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>XP Total: {xpAtual.toLocaleString()}</p>
                <p>Próximo nível: {xpProximoNivel.toLocaleString()} XP</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <div className="relative">
        <Progress
          value={progresso}
          className={cn(
            sizeClasses[size],
            animated && "transition-all duration-500"
          )}
        />
        {animated && progresso > 0 && (
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{ width: `${progresso}%` }}
          />
        )}
      </div>
    </div>
  );
}
