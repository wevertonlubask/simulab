"use client";

import { useState, useEffect } from "react";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  texto: string;
}

interface QuestaoOrdenacaoProps {
  itens: Item[];
  respostaAtual?: { ordem?: string[] } | null;
  onChange: (resposta: { ordem: string[] }) => void;
  disabled?: boolean;
}

export function QuestaoOrdenacao({
  itens,
  respostaAtual,
  onChange,
  disabled = false,
}: QuestaoOrdenacaoProps) {
  const [ordem, setOrdem] = useState<string[]>(
    respostaAtual?.ordem || itens.map((i) => i.id)
  );

  useEffect(() => {
    if (respostaAtual?.ordem) {
      setOrdem(respostaAtual.ordem);
    }
  }, [respostaAtual]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    if (toIndex < 0 || toIndex >= ordem.length) return;

    const novaOrdem = [...ordem];
    const [item] = novaOrdem.splice(fromIndex, 1);
    novaOrdem.splice(toIndex, 0, item);

    setOrdem(novaOrdem);
    onChange({ ordem: novaOrdem });
  };

  const getItemById = (id: string) => itens.find((i) => i.id === id);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        Organize os itens na ordem correta usando os botões ou arrastando.
      </p>
      {ordem.map((itemId, index) => {
        const item = getItemById(itemId);
        if (!item) return null;

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 transition-colors",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-1 text-muted-foreground">
              <GripVertical className="h-5 w-5" />
              <span className="font-mono text-sm w-6">{index + 1}.</span>
            </div>
            <span className="flex-1">{item.texto}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveItem(index, index - 1)}
                disabled={disabled || index === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveItem(index, index + 1)}
                disabled={disabled || index === ordem.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
