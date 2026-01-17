"use client";

import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Alternativa {
  id: string;
  texto: string;
  imagemUrl?: string | null;
}

interface QuestaoMultiplaEscolhaProps {
  alternativas: Alternativa[];
  multipla?: boolean; // true para múltipla escolha múltipla
  respostaAtual?: { alternativaId?: string; alternativasIds?: string[] } | null;
  onChange: (resposta: { alternativaId?: string; alternativasIds?: string[] }) => void;
  disabled?: boolean;
}

export function QuestaoMultiplaEscolha({
  alternativas,
  multipla = false,
  respostaAtual,
  onChange,
  disabled = false,
}: QuestaoMultiplaEscolhaProps) {
  const [selecionada, setSelecionada] = useState<string | undefined>(
    respostaAtual?.alternativaId
  );
  const [selecionadas, setSelecionadas] = useState<string[]>(
    respostaAtual?.alternativasIds || []
  );

  useEffect(() => {
    if (respostaAtual?.alternativaId) {
      setSelecionada(respostaAtual.alternativaId);
    }
    if (respostaAtual?.alternativasIds) {
      setSelecionadas(respostaAtual.alternativasIds);
    }
  }, [respostaAtual]);

  const handleSingleChange = (value: string) => {
    setSelecionada(value);
    onChange({ alternativaId: value });
  };

  const handleMultipleChange = (alternativaId: string, checked: boolean) => {
    const novasSelecionadas = checked
      ? [...selecionadas, alternativaId]
      : selecionadas.filter((id) => id !== alternativaId);

    setSelecionadas(novasSelecionadas);
    onChange({ alternativasIds: novasSelecionadas });
  };

  if (multipla) {
    return (
      <div className="space-y-3">
        {alternativas.map((alt, index) => (
          <div
            key={alt.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 transition-colors",
              selecionadas.includes(alt.id)
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Checkbox
              id={alt.id}
              checked={selecionadas.includes(alt.id)}
              onCheckedChange={(checked) =>
                handleMultipleChange(alt.id, checked as boolean)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <Label
              htmlFor={alt.id}
              className={cn(
                "flex-1 cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              <span className="font-medium text-muted-foreground mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              <span>{alt.texto}</span>
              {alt.imagemUrl && (
                <img
                  src={alt.imagemUrl}
                  alt={`Imagem da alternativa ${String.fromCharCode(65 + index)}`}
                  className="mt-2 max-w-full rounded-md"
                />
              )}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      value={selecionada}
      onValueChange={handleSingleChange}
      disabled={disabled}
      className="space-y-3"
    >
      {alternativas.map((alt, index) => (
        <div
          key={alt.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 transition-colors",
            selecionada === alt.id
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <RadioGroupItem
            value={alt.id}
            id={alt.id}
            className="mt-0.5"
          />
          <Label
            htmlFor={alt.id}
            className={cn(
              "flex-1 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          >
            <span className="font-medium text-muted-foreground mr-2">
              {String.fromCharCode(65 + index)}.
            </span>
            <span>{alt.texto}</span>
            {alt.imagemUrl && (
              <img
                src={alt.imagemUrl}
                alt={`Imagem da alternativa ${String.fromCharCode(65 + index)}`}
                className="mt-2 max-w-full rounded-md"
              />
            )}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
