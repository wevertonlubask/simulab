"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssociacaoConfig, AssociacaoConexao } from "@/lib/validations/questao";

interface AssociacaoDisplayProps {
  config: AssociacaoConfig;
  value: AssociacaoResposta;
  onChange: (value: AssociacaoResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export interface AssociacaoResposta {
  conexoes: AssociacaoConexao[];
}

export function AssociacaoDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
}: AssociacaoDisplayProps) {
  const [selectedItemA, setSelectedItemA] = useState<string | null>(null);

  const conexoes = value?.conexoes || [];

  // Verificar se existe conexão do usuário
  const hasConexao = (itemAId: string, itemBId: string) => {
    return conexoes.some((c) => c.de === itemAId && c.para === itemBId);
  };

  // Verificar se item A já tem conexão
  const itemAHasConexao = (itemAId: string) => {
    return conexoes.some((c) => c.de === itemAId);
  };

  // Obter conexão de um item A
  const getConexaoFromA = (itemAId: string) => {
    return conexoes.filter((c) => c.de === itemAId);
  };

  // Verificar se conexão está correta
  const isConexaoCorreta = (itemAId: string, itemBId: string) => {
    return config.conexoesCorretas.some(
      (c) => c.de === itemAId && c.para === itemBId
    );
  };

  // Toggle conexão
  const toggleConexao = useCallback(
    (itemAId: string, itemBId: string) => {
      if (disabled) return;

      const conexaoExistente = conexoes.find(
        (c) => c.de === itemAId && c.para === itemBId
      );

      if (conexaoExistente) {
        // Remover conexão
        onChange({
          conexoes: conexoes.filter(
            (c) => !(c.de === itemAId && c.para === itemBId)
          ),
        });
      } else {
        let novasConexoes = [...conexoes];

        // Se não permite múltiplas conexões, remover conexões existentes do item A
        if (!config.permitirMultiplasConexoes) {
          novasConexoes = novasConexoes.filter((c) => c.de !== itemAId);
        }

        novasConexoes.push({ de: itemAId, para: itemBId });
        onChange({ conexoes: novasConexoes });
      }
      setSelectedItemA(null);
    },
    [conexoes, config.permitirMultiplasConexoes, disabled, onChange]
  );

  // Remover todas as conexões de um item
  const removeConexoesFromA = (itemAId: string) => {
    if (disabled) return;
    onChange({
      conexoes: conexoes.filter((c) => c.de !== itemAId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
        {/* Coluna A */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            Coluna A
          </h4>
          {config.colunaA.map((item, index) => {
            const conexoesItem = getConexaoFromA(item.id);
            const isSelected = selectedItemA === item.id;
            const hasAnyConexao = conexoesItem.length > 0;

            // Verificar se todas as conexões estão corretas (para resultado)
            const todasCorretas =
              showResult &&
              hasAnyConexao &&
              conexoesItem.every((c) => isConexaoCorreta(c.de, c.para));
            const algumErro =
              showResult &&
              hasAnyConexao &&
              conexoesItem.some((c) => !isConexaoCorreta(c.de, c.para));

            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!disabled && !showResult) {
                      setSelectedItemA(isSelected ? null : item.id);
                    }
                  }}
                  disabled={disabled || showResult}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : hasAnyConexao
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-background hover:border-primary/30",
                    showResult && todasCorretas && "border-green-500 bg-green-500/10",
                    showResult && algumErro && "border-red-500 bg-red-500/10",
                    (disabled || showResult) && "cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-medium text-primary">
                        {index + 1}.
                      </span>{" "}
                      {item.texto}
                    </span>
                    {showResult && todasCorretas && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {showResult && algumErro && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </button>

                {/* Indicador de conexões */}
                {hasAnyConexao && !showResult && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {conexoesItem.map((c, i) => {
                      const itemBIndex = config.colunaB.findIndex(
                        (b) => b.id === c.para
                      );
                      return (
                        <Badge
                          key={i}
                          variant="default"
                          className="text-xs px-1.5 cursor-pointer hover:bg-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleConexao(c.de, c.para);
                          }}
                        >
                          {String.fromCharCode(65 + itemBIndex)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Indicador central */}
        <div className="hidden md:flex flex-col items-center justify-center h-full py-8">
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-2 text-center">
            {conexoes.length} de {config.conexoesCorretas.length}
          </span>
        </div>

        {/* Coluna B */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">
            Coluna B
          </h4>
          {config.colunaB.map((item, index) => {
            const isConnected = selectedItemA
              ? hasConexao(selectedItemA, item.id)
              : false;

            // Verificar conexões para este item B (para resultado)
            const conexoesParaB = conexoes.filter((c) => c.para === item.id);
            const conexoesCorretasParaB = config.conexoesCorretas.filter(
              (c) => c.para === item.id
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (selectedItemA && !disabled && !showResult) {
                    toggleConexao(selectedItemA, item.id);
                  }
                }}
                disabled={disabled || showResult || !selectedItemA}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isConnected
                    ? "border-green-500 bg-green-500/10"
                    : selectedItemA
                    ? "border-border bg-background hover:border-primary/30"
                    : "border-border bg-muted/30",
                  !selectedItemA && !showResult && "cursor-default",
                  (disabled || showResult) && "cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>
                    <span className="font-medium text-primary">
                      {String.fromCharCode(65 + index)}.
                    </span>{" "}
                    {item.texto}
                  </span>
                  {isConnected && !showResult && (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      Selecionado
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de conexões atuais */}
      {conexoes.length > 0 && !showResult && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Suas conexões:</h4>
          <div className="flex flex-wrap gap-2">
            {conexoes.map((conexao, index) => {
              const indexA = config.colunaA.findIndex((i) => i.id === conexao.de);
              const indexB = config.colunaB.findIndex((i) => i.id === conexao.para);

              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn(
                    "gap-2 py-1.5 px-3",
                    !disabled && "cursor-pointer hover:bg-destructive/20"
                  )}
                  onClick={() => !disabled && toggleConexao(conexao.de, conexao.para)}
                >
                  <span className="font-medium">{indexA + 1}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">
                    {String.fromCharCode(65 + indexB)}
                  </span>
                  {!disabled && <Unlink className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
          {!disabled && (
            <p className="text-xs text-muted-foreground mt-2">
              Clique em uma conexão para removê-la
            </p>
          )}
        </div>
      )}

      {/* Resultado */}
      {showResult && (
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Resultado:</h4>
          <div className="flex flex-wrap gap-2">
            {conexoes.map((conexao, index) => {
              const indexA = config.colunaA.findIndex((i) => i.id === conexao.de);
              const indexB = config.colunaB.findIndex((i) => i.id === conexao.para);
              const correta = isConexaoCorreta(conexao.de, conexao.para);

              return (
                <Badge
                  key={index}
                  variant={correta ? "default" : "destructive"}
                  className="gap-2 py-1.5 px-3"
                >
                  <span className="font-medium">{indexA + 1}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">
                    {String.fromCharCode(65 + indexB)}
                  </span>
                  {correta ? (
                    <Check className="h-3 w-3 ml-1" />
                  ) : (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              );
            })}
          </div>

          {/* Mostrar respostas corretas faltantes */}
          {config.conexoesCorretas.some(
            (correta) =>
              !conexoes.some(
                (c) => c.de === correta.de && c.para === correta.para
              )
          ) && (
            <div className="mt-3">
              <h5 className="text-xs text-muted-foreground mb-2">
                Conexões corretas não feitas:
              </h5>
              <div className="flex flex-wrap gap-2">
                {config.conexoesCorretas
                  .filter(
                    (correta) =>
                      !conexoes.some(
                        (c) => c.de === correta.de && c.para === correta.para
                      )
                  )
                  .map((conexao, index) => {
                    const indexA = config.colunaA.findIndex(
                      (i) => i.id === conexao.de
                    );
                    const indexB = config.colunaB.findIndex(
                      (i) => i.id === conexao.para
                    );

                    return (
                      <Badge
                        key={index}
                        variant="outline"
                        className="gap-2 py-1.5 px-3 border-green-500 text-green-600"
                      >
                        <span className="font-medium">{indexA + 1}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">
                          {String.fromCharCode(65 + indexB)}
                        </span>
                      </Badge>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instruções */}
      {!disabled && !showResult && (
        <p className="text-xs text-muted-foreground text-center">
          {selectedItemA
            ? "Agora clique em um item da Coluna B para criar a conexão"
            : "Clique em um item da Coluna A para começar"}
        </p>
      )}
    </div>
  );
}
