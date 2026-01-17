"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Flag, Check } from "lucide-react";

interface Questao {
  provaQuestaoId: string;
  ordem: number;
  respondida: boolean;
  marcadaRevisao: boolean;
}

interface QuestaoNavegacaoProps {
  questoes: Questao[];
  questaoAtual: number;
  onNavigate: (index: number) => void;
  className?: string;
}

export function QuestaoNavegacao({
  questoes,
  questaoAtual,
  onNavigate,
  className,
}: QuestaoNavegacaoProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Navegação</span>
        <span className="text-muted-foreground">
          {questoes.filter((q) => q.respondida).length}/{questoes.length}{" "}
          respondidas
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questoes.map((q, index) => (
          <Button
            key={q.provaQuestaoId}
            variant="outline"
            size="sm"
            className={cn(
              "relative h-10 w-10 p-0 font-mono",
              index === questaoAtual && "ring-2 ring-primary",
              q.respondida && !q.marcadaRevisao && "bg-green-500/20 border-green-500/50",
              q.marcadaRevisao && "bg-orange-500/20 border-orange-500/50"
            )}
            onClick={() => onNavigate(index)}
          >
            {index + 1}
            {q.marcadaRevisao && (
              <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
            )}
            {q.respondida && !q.marcadaRevisao && (
              <Check className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
            )}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-green-500/20 border-green-500/50" />
          <span>Respondida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-orange-500/20 border-orange-500/50" />
          <span>Marcada para revisão</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border" />
          <span>Não respondida</span>
        </div>
      </div>
    </div>
  );
}
