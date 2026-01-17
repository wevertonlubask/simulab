"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LacunaConfig, LacunaItem } from "@/lib/validations/questao";

interface LacunaEditorProps {
  value: LacunaConfig;
  onChange: (value: LacunaConfig) => void;
  disabled?: boolean;
}

const generateId = () => `lacuna_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultConfig: LacunaConfig = {
  texto: "",
  lacunas: [],
  caseSensitive: false,
  pontuacaoParcial: true,
};

export function LacunaEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: LacunaEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [novaResposta, setNovaResposta] = useState<Record<string, string>>({});

  // Garantir que value tenha todos os campos necessários
  const config: LacunaConfig = {
    texto: value?.texto || "",
    lacunas: value?.lacunas || [],
    caseSensitive: value?.caseSensitive ?? false,
    pontuacaoParcial: value?.pontuacaoParcial ?? true,
  };

  // Adicionar lacuna
  const addLacuna = useCallback(() => {
    const newLacuna: LacunaItem = {
      id: generateId(),
      respostasAceitas: [],
      dica: null,
    };
    onChange({
      ...config,
      lacunas: [...config.lacunas, newLacuna],
    });
  }, [config, onChange]);

  // Remover lacuna
  const removeLacuna = useCallback(
    (id: string) => {
      onChange({
        ...config,
        lacunas: config.lacunas.filter((l) => l.id !== id),
      });
    },
    [config, onChange]
  );

  // Adicionar resposta aceita a uma lacuna
  const addRespostaAceita = useCallback(
    (lacunaId: string, resposta: string) => {
      if (!resposta.trim()) return;
      onChange({
        ...config,
        lacunas: config.lacunas.map((l) =>
          l.id === lacunaId
            ? {
                ...l,
                respostasAceitas: [...l.respostasAceitas, resposta.trim()],
              }
            : l
        ),
      });
      setNovaResposta((prev) => ({ ...prev, [lacunaId]: "" }));
    },
    [config, onChange]
  );

  // Remover resposta aceita de uma lacuna
  const removeRespostaAceita = useCallback(
    (lacunaId: string, index: number) => {
      onChange({
        ...config,
        lacunas: config.lacunas.map((l) =>
          l.id === lacunaId
            ? {
                ...l,
                respostasAceitas: l.respostasAceitas.filter((_, i) => i !== index),
              }
            : l
        ),
      });
    },
    [config, onChange]
  );

  // Atualizar dica
  const updateDica = useCallback(
    (lacunaId: string, dica: string) => {
      onChange({
        ...config,
        lacunas: config.lacunas.map((l) =>
          l.id === lacunaId ? { ...l, dica: dica || null } : l
        ),
      });
    },
    [config, onChange]
  );

  // Renderizar texto com marcadores de lacuna
  const renderTextoComLacunas = (texto: string, lacunas: LacunaItem[]) => {
    let result = texto;
    lacunas.forEach((lacuna, index) => {
      const placeholder = `[LACUNA_${index + 1}]`;
      if (!result.includes(placeholder)) {
        result += ` ${placeholder}`;
      }
    });
    return result;
  };

  // Renderizar preview
  const renderPreview = () => {
    let textoProcessado = config.texto;
    config.lacunas.forEach((lacuna, index) => {
      const placeholder = `[LACUNA_${index + 1}]`;
      textoProcessado = textoProcessado.replace(
        placeholder,
        `<span class="inline-flex items-center min-w-[100px] h-8 px-2 mx-1 bg-primary/10 border border-primary/30 rounded text-sm">[___${index + 1}___]</span>`
      );
    });
    return textoProcessado;
  };

  return (
    <div className="space-y-6">
      {/* Opções */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="case-sensitive"
            checked={config.caseSensitive}
            onCheckedChange={(checked) =>
              onChange({ ...config, caseSensitive: checked })
            }
            disabled={disabled}
          />
          <Label htmlFor="case-sensitive" className="cursor-pointer">
            Diferenciar maiúsculas/minúsculas
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="pontuacao-parcial"
            checked={config.pontuacaoParcial}
            onCheckedChange={(checked) =>
              onChange({ ...config, pontuacaoParcial: checked })
            }
            disabled={disabled}
          />
          <Label htmlFor="pontuacao-parcial" className="cursor-pointer">
            Pontuação parcial
          </Label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2 ml-auto"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" /> Editar
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Preview
            </>
          )}
        </Button>
      </div>

      {/* Instruções */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 text-sm flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p>
            Use marcadores <code className="bg-blue-500/20 px-1 rounded">[LACUNA_1]</code>,{" "}
            <code className="bg-blue-500/20 px-1 rounded">[LACUNA_2]</code>, etc. no texto
            para indicar onde as lacunas devem aparecer.
          </p>
        </div>
      </div>

      {!showPreview ? (
        <>
          {/* Texto com lacunas */}
          <div className="space-y-2">
            <Label htmlFor="texto">Texto com lacunas *</Label>
            <Textarea
              id="texto"
              value={config.texto}
              onChange={(e) => onChange({ ...config, texto: e.target.value })}
              placeholder="Digite o texto usando [LACUNA_1], [LACUNA_2], etc. para marcar onde as lacunas devem aparecer.&#10;&#10;Exemplo: O comando [LACUNA_1] é usado para listar arquivos no [LACUNA_2]."
              disabled={disabled}
              rows={4}
              className="font-mono"
            />
          </div>

          {/* Configuração das lacunas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lacunas e Respostas Aceitas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLacuna}
                disabled={disabled || config.lacunas.length >= 10}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Nova Lacuna
              </Button>
            </div>

            {config.lacunas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>Adicione lacunas para definir as respostas aceitas</p>
              </div>
            ) : (
              config.lacunas.map((lacuna, index) => (
                <Card key={lacuna.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="secondary">[LACUNA_{index + 1}]</Badge>
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLacuna(lacuna.id)}
                        disabled={disabled}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Respostas aceitas */}
                    <div className="space-y-2">
                      <Label className="text-xs">Respostas aceitas *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={novaResposta[lacuna.id] || ""}
                          onChange={(e) =>
                            setNovaResposta((prev) => ({
                              ...prev,
                              [lacuna.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRespostaAceita(
                                lacuna.id,
                                novaResposta[lacuna.id] || ""
                              );
                            }
                          }}
                          placeholder="Digite uma resposta e pressione Enter"
                          disabled={disabled}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            addRespostaAceita(
                              lacuna.id,
                              novaResposta[lacuna.id] || ""
                            )
                          }
                          disabled={disabled || !novaResposta[lacuna.id]?.trim()}
                        >
                          Adicionar
                        </Button>
                      </div>
                      {lacuna.respostasAceitas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {lacuna.respostasAceitas.map((resp, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {resp}
                              <button
                                type="button"
                                onClick={() => removeRespostaAceita(lacuna.id, i)}
                                disabled={disabled}
                                className="hover:text-destructive ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {lacuna.respostasAceitas.length === 0 && (
                        <p className="text-xs text-orange-500">
                          Adicione pelo menos uma resposta aceita
                        </p>
                      )}
                    </div>

                    {/* Dica opcional */}
                    <div className="space-y-1">
                      <Label className="text-xs">Dica (opcional)</Label>
                      <Input
                        value={lacuna.dica || ""}
                        onChange={(e) => updateDica(lacuna.id, e.target.value)}
                        placeholder="Ex: É um comando do Linux"
                        disabled={disabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        /* Modo Preview */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Preview - Como o aluno verá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </CardContent>
        </Card>
      )}

      {/* Validação */}
      {config.lacunas.length === 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Adicione pelo menos 1 lacuna para criar a questão.
        </div>
      )}
      {!config.texto && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Digite o texto da questão com os marcadores de lacuna.
        </div>
      )}
    </div>
  );
}
