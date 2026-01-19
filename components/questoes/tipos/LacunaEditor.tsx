"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye, EyeOff, Info, X, Check } from "lucide-react";
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
  opcoes: [],
  caseSensitive: false,
  pontuacaoParcial: true,
};

export function LacunaEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: LacunaEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [novaOpcao, setNovaOpcao] = useState("");

  // Garantir que value tenha todos os campos necessários
  const config: LacunaConfig = {
    texto: value?.texto || "",
    lacunas: value?.lacunas || [],
    opcoes: value?.opcoes || [],
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

  // Definir resposta correta de uma lacuna
  const setRespostaCorreta = useCallback(
    (lacunaId: string, resposta: string) => {
      onChange({
        ...config,
        lacunas: config.lacunas.map((l) =>
          l.id === lacunaId
            ? { ...l, respostasAceitas: resposta ? [resposta] : [] }
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

  // Adicionar opção ao dropdown
  const addOpcao = useCallback(() => {
    if (!novaOpcao.trim()) return;
    if (config.opcoes?.includes(novaOpcao.trim())) return;
    onChange({
      ...config,
      opcoes: [...(config.opcoes || []), novaOpcao.trim()],
    });
    setNovaOpcao("");
  }, [config, novaOpcao, onChange]);

  // Remover opção do dropdown
  const removeOpcao = useCallback(
    (index: number) => {
      const opcaoRemovida = config.opcoes?.[index];
      // Remover a opção e também limpar das lacunas que a usam
      onChange({
        ...config,
        opcoes: config.opcoes?.filter((_, i) => i !== index),
        lacunas: config.lacunas.map((l) =>
          l.respostasAceitas.includes(opcaoRemovida || "")
            ? { ...l, respostasAceitas: [] }
            : l
        ),
      });
    },
    [config, onChange]
  );

  // Renderizar preview
  const renderPreview = () => {
    let textoProcessado = config.texto;
    config.lacunas.forEach((lacuna, index) => {
      const placeholder = `[LACUNA_${index + 1}]`;
      const resposta = lacuna.respostasAceitas[0] || `Lacuna ${index + 1}`;
      textoProcessado = textoProcessado.replace(
        placeholder,
        `<select class="inline-flex h-8 px-2 mx-1 bg-primary/10 border border-primary/30 rounded text-sm cursor-not-allowed" disabled>
          <option>${resposta}</option>
        </select>`
      );
    });
    return textoProcessado;
  };

  // Verificar quantas lacunas estão configuradas corretamente
  const lacunasConfiguradas = config.lacunas.filter(
    (l) => l.respostasAceitas.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Opções */}
      <div className="flex flex-wrap gap-6">
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
            para indicar onde os dropdowns devem aparecer. Configure as opções do dropdown
            e depois defina qual é a resposta correta para cada lacuna.
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
              placeholder="Digite o texto usando [LACUNA_1], [LACUNA_2], etc. para marcar onde os dropdowns devem aparecer.&#10;&#10;Exemplo: O tipo de instância [LACUNA_1] é ideal para cargas de trabalho que podem ser interrompidas, enquanto [LACUNA_2] é melhor para aplicações que precisam de disponibilidade constante."
              disabled={disabled}
              rows={4}
              className="font-mono"
            />
          </div>

          {/* Opções do Dropdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Opções do Dropdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione todas as opções que aparecerão nos dropdowns (corretas e incorretas)
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={novaOpcao}
                  onChange={(e) => setNovaOpcao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOpcao();
                    }
                  }}
                  onBlur={() => {
                    if (novaOpcao.trim()) {
                      addOpcao();
                    }
                  }}
                  placeholder="Digite uma opção e pressione Enter ou Tab"
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOpcao}
                  disabled={disabled || !novaOpcao.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {(config.opcoes?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {config.opcoes?.map((opcao, index) => {
                    // Verificar se esta opção é usada como resposta correta
                    const isUsadaComoCorreta = config.lacunas.some((l) =>
                      l.respostasAceitas.includes(opcao)
                    );
                    return (
                      <Badge
                        key={index}
                        variant={isUsadaComoCorreta ? "default" : "secondary"}
                        className={cn(
                          "gap-1 pr-1",
                          isUsadaComoCorreta && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {isUsadaComoCorreta && <Check className="h-3 w-3" />}
                        {opcao}
                        <button
                          type="button"
                          onClick={() => removeOpcao(index)}
                          disabled={disabled}
                          className="hover:text-destructive ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma opção adicionada
                </p>
              )}

              {(config.opcoes?.length || 0) < 2 && (
                <p className="text-xs text-orange-500">
                  Adicione pelo menos 2 opções para o dropdown
                </p>
              )}
            </CardContent>
          </Card>

          {/* Configuração das lacunas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Lacunas</Label>
                {config.lacunas.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {lacunasConfiguradas} de {config.lacunas.length} configuradas
                  </p>
                )}
              </div>
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
                <p>Adicione lacunas para definir onde os dropdowns aparecerão</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {config.lacunas.map((lacuna, index) => (
                  <Card key={lacuna.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="secondary">[LACUNA_{index + 1}]</Badge>
                          {lacuna.respostasAceitas.length > 0 && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
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
                      {/* Selecionar resposta correta */}
                      <div className="space-y-2">
                        <Label className="text-xs">Resposta correta *</Label>
                        <Select
                          value={lacuna.respostasAceitas[0] || ""}
                          onValueChange={(value) => setRespostaCorreta(lacuna.id, value)}
                          disabled={disabled || (config.opcoes?.length || 0) === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a resposta correta" />
                          </SelectTrigger>
                          <SelectContent>
                            {config.opcoes?.map((opcao) => (
                              <SelectItem key={opcao} value={opcao}>
                                {opcao}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!lacuna.respostasAceitas.length && (
                          <p className="text-xs text-orange-500">
                            Selecione a resposta correta
                          </p>
                        )}
                      </div>

                      {/* Dica opcional */}
                      <div className="space-y-1">
                        <Label className="text-xs">Dica (opcional)</Label>
                        <Input
                          value={lacuna.dica || ""}
                          onChange={(e) => updateDica(lacuna.id, e.target.value)}
                          placeholder="Ex: Ideal para cargas intermitentes"
                          disabled={disabled}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            {(config.opcoes?.length || 0) > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Opções disponíveis nos dropdowns:
                </p>
                <div className="flex flex-wrap gap-2">
                  {config.opcoes?.map((opcao, i) => (
                    <Badge key={i} variant="outline">
                      {opcao}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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
