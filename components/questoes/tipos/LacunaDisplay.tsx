"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LacunaConfig } from "@/lib/validations/questao";

interface LacunaDisplayProps {
  config: LacunaConfig;
  value: LacunaResposta;
  onChange: (value: LacunaResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export interface LacunaResposta {
  respostas: Record<string, string>; // { lacunaId: "resposta" }
}

export function LacunaDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
}: LacunaDisplayProps) {
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  // Inicializar com respostas existentes
  useEffect(() => {
    if (value?.respostas) {
      setRespostas(value.respostas);
    }
  }, []);

  // Atualizar resposta
  const updateResposta = useCallback(
    (lacunaId: string, texto: string) => {
      const novasRespostas = { ...respostas, [lacunaId]: texto };
      setRespostas(novasRespostas);
      onChange({ respostas: novasRespostas });
    },
    [respostas, onChange]
  );

  // Verificar se resposta está correta
  const isRespostaCorreta = (lacunaId: string) => {
    const lacuna = config.lacunas.find((l) => l.id === lacunaId);
    if (!lacuna) return false;

    const respostaAluno = respostas[lacunaId] || "";
    const respostaComparar = config.caseSensitive
      ? respostaAluno.trim()
      : respostaAluno.trim().toLowerCase();

    return lacuna.respostasAceitas.some((aceita) => {
      const aceitaComparar = config.caseSensitive
        ? aceita.trim()
        : aceita.trim().toLowerCase();
      return respostaComparar === aceitaComparar;
    });
  };

  // Toggle dica
  const toggleHint = (lacunaId: string) => {
    setShowHints((prev) => ({ ...prev, [lacunaId]: !prev[lacunaId] }));
  };

  // Renderizar texto com inputs
  const renderTextoComInputs = () => {
    let textoProcessado = config.texto;
    const elementos: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    config.lacunas.forEach((lacuna, index) => {
      const placeholder = `[LACUNA_${index + 1}]`;
      const placeholderIndex = textoProcessado.indexOf(placeholder, lastIndex);

      if (placeholderIndex !== -1) {
        // Adicionar texto antes da lacuna
        if (placeholderIndex > lastIndex) {
          elementos.push(
            <span key={`text-${keyCounter++}`}>
              {textoProcessado.slice(lastIndex, placeholderIndex)}
            </span>
          );
        }

        // Adicionar input da lacuna
        const isCorrect = showResult ? isRespostaCorreta(lacuna.id) : undefined;
        elementos.push(
          <span key={`lacuna-${lacuna.id}`} className="inline-flex items-center gap-1 mx-1">
            <Input
              value={respostas[lacuna.id] || ""}
              onChange={(e) => updateResposta(lacuna.id, e.target.value)}
              disabled={disabled || showResult}
              className={cn(
                "w-32 h-8 text-center inline-flex",
                showResult && isCorrect && "border-green-500 bg-green-500/10",
                showResult && isCorrect === false && "border-red-500 bg-red-500/10"
              )}
              placeholder={`___${index + 1}___`}
            />
            {showResult && isCorrect !== undefined && (
              isCorrect ? (
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )
            )}
            {!showResult && lacuna.dica && !disabled && (
              <button
                type="button"
                onClick={() => toggleHint(lacuna.id)}
                className="text-muted-foreground hover:text-primary"
                title="Ver dica"
              >
                <Lightbulb className="h-4 w-4" />
              </button>
            )}
          </span>
        );

        lastIndex = placeholderIndex + placeholder.length;
      }
    });

    // Adicionar texto restante
    if (lastIndex < textoProcessado.length) {
      elementos.push(
        <span key={`text-final-${keyCounter}`}>
          {textoProcessado.slice(lastIndex)}
        </span>
      );
    }

    return elementos;
  };

  return (
    <div className="space-y-4">
      {/* Texto com lacunas */}
      <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
        {renderTextoComInputs()}
      </div>

      {/* Dicas visíveis */}
      {Object.entries(showHints)
        .filter(([_, show]) => show)
        .map(([lacunaId]) => {
          const lacuna = config.lacunas.find((l) => l.id === lacunaId);
          const index = config.lacunas.findIndex((l) => l.id === lacunaId);
          if (!lacuna?.dica) return null;

          return (
            <div
              key={lacunaId}
              className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm flex items-start gap-2"
            >
              <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Dica para Lacuna {index + 1}:</span>{" "}
                {lacuna.dica}
              </div>
            </div>
          );
        })}

      {/* Resultado */}
      {showResult && (
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Respostas Corretas:</h4>
          <div className="space-y-2">
            {config.lacunas.map((lacuna, index) => {
              const isCorrect = isRespostaCorreta(lacuna.id);
              const respostaAluno = respostas[lacuna.id] || "(não respondida)";

              return (
                <div
                  key={lacuna.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    isCorrect
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Lacuna {index + 1}:
                    </span>
                    {isCorrect ? (
                      <Badge variant="default" className="bg-green-500">
                        Correta
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Incorreta</Badge>
                    )}
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Sua resposta:</span>{" "}
                      <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                        {respostaAluno}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        <span className="text-muted-foreground">Aceitas:</span>{" "}
                        <span className="text-green-600">
                          {lacuna.respostasAceitas.join(", ")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruções */}
      {!disabled && !showResult && (
        <p className="text-xs text-muted-foreground text-center">
          Preencha as lacunas com as respostas corretas
          {!config.caseSensitive && " (não diferencia maiúsculas de minúsculas)"}
        </p>
      )}
    </div>
  );
}
