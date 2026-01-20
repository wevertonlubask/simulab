"use client";

import { useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComandoConfig } from "@/lib/validations/questao";

interface ComandoDisplayProps {
  config: ComandoConfig;
  value: ComandoResposta;
  onChange: (value: ComandoResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export interface ComandoResposta {
  comando: string;
}

export function ComandoDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
}: ComandoDisplayProps) {
  // Usar diretamente o value para evitar dessincronização
  const comando = value?.comando || "";
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar comando
  const handleChange = useCallback(
    (novoComando: string) => {
      onChange({ comando: novoComando });
    },
    [onChange]
  );

  // Verificar se comando está correto
  const isComandoCorreto = () => {
    let comandoAluno = comando;

    // Processar comando do aluno
    if (config.ignorarEspacosExtras) {
      comandoAluno = comandoAluno.trim().replace(/\s+/g, " ");
    }
    if (!config.caseSensitive) {
      comandoAluno = comandoAluno.toLowerCase();
    }

    // Verificar se alguma resposta aceita corresponde
    return config.respostasAceitas.some((aceita) => {
      let aceitaProcessado = aceita;
      if (config.ignorarEspacosExtras) {
        aceitaProcessado = aceitaProcessado.trim().replace(/\s+/g, " ");
      }
      if (!config.caseSensitive) {
        aceitaProcessado = aceitaProcessado.toLowerCase();
      }
      return comandoAluno === aceitaProcessado;
    });
  };

  const isCorrect = showResult ? isComandoCorreto() : undefined;

  return (
    <div className="space-y-4">
      {/* Contexto */}
      {config.contexto && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm">{config.contexto}</p>
        </div>
      )}

      {/* Terminal */}
      <div
        className={cn(
          "rounded-lg overflow-hidden",
          "bg-zinc-900 text-zinc-100",
          showResult && isCorrect && "ring-2 ring-green-500",
          showResult && isCorrect === false && "ring-2 ring-red-500"
        )}
      >
        {/* Barra do terminal */}
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-zinc-400 ml-2 flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            Terminal
          </span>
          {showResult && (
            <div className="ml-auto">
              {isCorrect ? (
                <Badge className="bg-green-500">Correto</Badge>
              ) : (
                <Badge variant="destructive">Incorreto</Badge>
              )}
            </div>
          )}
        </div>

        {/* Área do terminal */}
        <div className="p-4 font-mono text-sm min-h-[100px]">
          <div className="flex items-center gap-2">
            <span className="text-green-400 flex-shrink-0">{config.prompt}</span>
            <Input
              ref={inputRef}
              value={comando}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled || showResult}
              placeholder="Digite o comando..."
              className={cn(
                "bg-transparent border-none text-zinc-100 placeholder:text-zinc-500",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "h-auto py-0"
              )}
              autoComplete="off"
              spellCheck={false}
            />
            {showResult && isCorrect !== undefined && (
              <span className="flex-shrink-0">
                {isCorrect ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-red-500" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resultado */}
      {showResult && (
        <div className="pt-4 border-t space-y-3">
          <div
            className={cn(
              "p-4 rounded-lg border",
              isCorrect
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">Sua resposta:</span>
              {isCorrect ? (
                <Badge variant="default" className="bg-green-500">
                  Correta
                </Badge>
              ) : (
                <Badge variant="destructive">Incorreta</Badge>
              )}
            </div>
            <div className="font-mono text-sm bg-zinc-900 text-zinc-100 p-2 rounded">
              <span className="text-green-400">{config.prompt}</span>{" "}
              {comando || "(vazio)"}
            </div>
          </div>

          {!isCorrect && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-600">
                Comandos Aceitos:
              </h4>
              <div className="space-y-1">
                {config.respostasAceitas.map((cmd, index) => (
                  <div
                    key={index}
                    className="font-mono text-sm bg-zinc-900 text-zinc-100 p-2 rounded"
                  >
                    <span className="text-green-400">{config.prompt}</span> {cmd}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instruções */}
      {!disabled && !showResult && (
        <p className="text-xs text-muted-foreground text-center">
          Digite o comando completo
          {config.caseSensitive && " (diferencia maiúsculas e minúsculas)"}
          {!config.caseSensitive && " (não diferencia maiúsculas e minúsculas)"}
        </p>
      )}
    </div>
  );
}
