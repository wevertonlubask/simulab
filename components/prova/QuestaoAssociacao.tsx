"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ItemEsquerda {
  id: string;
  texto: string;
}

interface ItemDireita {
  id: string;
  texto: string;
}

interface QuestaoAssociacaoProps {
  itensEsquerda: ItemEsquerda[];
  itensDireita: ItemDireita[];
  respostaAtual?: { associacoes?: Record<string, string> } | null;
  onChange: (resposta: { associacoes: Record<string, string> }) => void;
  disabled?: boolean;
}

export function QuestaoAssociacao({
  itensEsquerda,
  itensDireita,
  respostaAtual,
  onChange,
  disabled = false,
}: QuestaoAssociacaoProps) {
  const [associacoes, setAssociacoes] = useState<Record<string, string>>(
    respostaAtual?.associacoes || {}
  );

  useEffect(() => {
    if (respostaAtual?.associacoes) {
      setAssociacoes(respostaAtual.associacoes);
    }
  }, [respostaAtual]);

  const handleChange = (esquerdaId: string, direitaId: string) => {
    const novasAssociacoes = { ...associacoes, [esquerdaId]: direitaId };
    setAssociacoes(novasAssociacoes);
    onChange({ associacoes: novasAssociacoes });
  };

  // Itens da direita já usados
  const usados = Object.values(associacoes);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Associe cada item da esquerda com o correspondente da direita.
      </p>
      <div className="space-y-3">
        {itensEsquerda.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-4 rounded-lg border p-4",
              disabled && "opacity-50"
            )}
          >
            <div className="flex-1">
              <span className="font-medium text-muted-foreground mr-2">
                {index + 1}.
              </span>
              <span>{item.texto}</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="w-48">
              <Select
                value={associacoes[item.id] || ""}
                onValueChange={(value) => handleChange(item.id, value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {itensDireita.map((itemDir) => (
                    <SelectItem
                      key={itemDir.id}
                      value={itemDir.id}
                      disabled={
                        usados.includes(itemDir.id) &&
                        associacoes[item.id] !== itemDir.id
                      }
                    >
                      {itemDir.texto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
