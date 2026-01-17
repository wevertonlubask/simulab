"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProvaTimerProps {
  tempoRestanteInicial: number; // em milissegundos
  onTimeUp: () => void;
  className?: string;
}

export function ProvaTimer({
  tempoRestanteInicial,
  onTimeUp,
  className,
}: ProvaTimerProps) {
  const [tempoRestante, setTempoRestante] = useState(tempoRestanteInicial);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (tempoRestante <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoRestante, onTimeUp]);

  // Calcular porcentagem para estilização
  const porcentagemRestante = (tempoRestante / tempoRestanteInicial) * 100;
  const isWarning = porcentagemRestante <= 20;
  const isCritical = porcentagemRestante <= 10;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg transition-colors",
        isCritical
          ? "bg-red-500/20 text-red-600 animate-pulse"
          : isWarning
          ? "bg-orange-500/20 text-orange-600"
          : "bg-muted text-foreground",
        className
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      <span className="tabular-nums">{formatTime(tempoRestante)}</span>
    </div>
  );
}
