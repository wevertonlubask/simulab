"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Link2,
  Unlink,
  ArrowRight,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssociacaoConfig, AssociacaoItem, AssociacaoConexao } from "@/lib/validations/questao";

interface AssociacaoEditorProps {
  value: AssociacaoConfig;
  onChange: (value: AssociacaoConfig) => void;
  disabled?: boolean;
}

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultConfig: AssociacaoConfig = {
  colunaA: [
    { id: generateId(), texto: "" },
    { id: generateId(), texto: "" },
  ],
  colunaB: [
    { id: generateId(), texto: "" },
    { id: generateId(), texto: "" },
  ],
  conexoesCorretas: [],
  pontuacaoParcial: true,
  permitirMultiplasConexoes: false,
};

export function AssociacaoEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: AssociacaoEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedItemA, setSelectedItemA] = useState<string | null>(null);

  // Garantir que value tenha todos os campos necessários
  const config: AssociacaoConfig = {
    colunaA: value?.colunaA || defaultConfig.colunaA,
    colunaB: value?.colunaB || defaultConfig.colunaB,
    conexoesCorretas: value?.conexoesCorretas || [],
    pontuacaoParcial: value?.pontuacaoParcial ?? true,
    permitirMultiplasConexoes: value?.permitirMultiplasConexoes ?? false,
  };

  // Adicionar item na coluna A
  const addItemA = useCallback(() => {
    const newItem: AssociacaoItem = { id: generateId(), texto: "" };
    onChange({
      ...config,
      colunaA: [...config.colunaA, newItem],
    });
  }, [config, onChange]);

  // Adicionar item na coluna B
  const addItemB = useCallback(() => {
    const newItem: AssociacaoItem = { id: generateId(), texto: "" };
    onChange({
      ...config,
      colunaB: [...config.colunaB, newItem],
    });
  }, [config, onChange]);

  // Atualizar item na coluna A
  const updateItemA = useCallback(
    (id: string, texto: string) => {
      onChange({
        ...config,
        colunaA: config.colunaA.map((item) =>
          item.id === id ? { ...item, texto } : item
        ),
      });
    },
    [config, onChange]
  );

  // Atualizar item na coluna B
  const updateItemB = useCallback(
    (id: string, texto: string) => {
      onChange({
        ...config,
        colunaB: config.colunaB.map((item) =>
          item.id === id ? { ...item, texto } : item
        ),
      });
    },
    [config, onChange]
  );

  // Remover item da coluna A
  const removeItemA = useCallback(
    (id: string) => {
      if (config.colunaA.length <= 2) return;
      onChange({
        ...config,
        colunaA: config.colunaA.filter((item) => item.id !== id),
        conexoesCorretas: config.conexoesCorretas.filter((c) => c.de !== id),
      });
    },
    [config, onChange]
  );

  // Remover item da coluna B
  const removeItemB = useCallback(
    (id: string) => {
      if (config.colunaB.length <= 2) return;
      onChange({
        ...config,
        colunaB: config.colunaB.filter((item) => item.id !== id),
        conexoesCorretas: config.conexoesCorretas.filter((c) => c.para !== id),
      });
    },
    [config, onChange]
  );

  // Criar/remover conexão
  const toggleConexao = useCallback(
    (itemAId: string, itemBId: string) => {
      const conexaoExistente = config.conexoesCorretas.find(
        (c) => c.de === itemAId && c.para === itemBId
      );

      if (conexaoExistente) {
        // Remover conexão
        onChange({
          ...config,
          conexoesCorretas: config.conexoesCorretas.filter(
            (c) => !(c.de === itemAId && c.para === itemBId)
          ),
        });
      } else {
        // Adicionar conexão
        let novasConexoes = [...config.conexoesCorretas];

        // Se não permite múltiplas conexões, remover conexões existentes do item A
        if (!config.permitirMultiplasConexoes) {
          novasConexoes = novasConexoes.filter((c) => c.de !== itemAId);
        }

        novasConexoes.push({ de: itemAId, para: itemBId });
        onChange({
          ...config,
          conexoesCorretas: novasConexoes,
        });
      }
      setSelectedItemA(null);
    },
    [config, onChange]
  );

  // Verificar se existe conexão
  const hasConexao = (itemAId: string, itemBId: string) => {
    return config.conexoesCorretas.some(
      (c) => c.de === itemAId && c.para === itemBId
    );
  };

  // Obter conexões de um item A
  const getConexoesFromA = (itemAId: string) => {
    return config.conexoesCorretas.filter((c) => c.de === itemAId);
  };

  // Obter conexões para um item B
  const getConexoesToB = (itemBId: string) => {
    return config.conexoesCorretas.filter((c) => c.para === itemBId);
  };

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

        <div className="flex items-center gap-2">
          <Switch
            id="multiplas-conexoes"
            checked={config.permitirMultiplasConexoes}
            onCheckedChange={(checked) =>
              onChange({ ...config, permitirMultiplasConexoes: checked })
            }
            disabled={disabled}
          />
          <Label htmlFor="multiplas-conexoes" className="cursor-pointer">
            Permitir múltiplas conexões por item
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

      {!showPreview ? (
        /* Modo Edição */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Coluna A */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Coluna A (Origem)</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemA}
                  disabled={disabled || config.colunaA.length >= 10}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.colunaA.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="w-6 text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <Input
                    value={item.texto}
                    onChange={(e) => updateItemA(item.id, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {getConexoesFromA(item.id).length} conexão(ões)
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItemA(item.id)}
                    disabled={disabled || config.colunaA.length <= 2}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Coluna B */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Coluna B (Destino)</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemB}
                  disabled={disabled || config.colunaB.length >= 10}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.colunaB.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="w-6 text-sm text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input
                    value={item.texto}
                    onChange={(e) => updateItemB(item.id, e.target.value)}
                    placeholder={`Item ${String.fromCharCode(65 + index)}`}
                    disabled={disabled}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {getConexoesToB(item.id).length} conexão(ões)
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItemB(item.id)}
                    disabled={disabled || config.colunaB.length <= 2}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Modo Preview */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview - Visualização do Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Coluna A Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  Coluna A
                </h4>
                {config.colunaA.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-muted/30 flex items-center gap-2"
                  >
                    <span className="font-medium text-primary">
                      {index + 1}.
                    </span>
                    <span>{item.texto || "(vazio)"}</span>
                  </div>
                ))}
              </div>

              {/* Coluna B Preview */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  Coluna B
                </h4>
                {config.colunaB.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-muted/30 flex items-center gap-2"
                  >
                    <span className="font-medium text-primary">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{item.texto || "(vazio)"}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor de Gabarito */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Gabarito - Conexões Corretas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em um item da Coluna A e depois em um item da Coluna B para
            criar ou remover uma conexão.
          </p>

          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
            {/* Coluna A - Seleção */}
            <div className="space-y-2">
              {config.colunaA.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemA(item.id === selectedItemA ? null : item.id)}
                  disabled={disabled || !item.texto}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    selectedItemA === item.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border bg-background",
                    !item.texto && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="font-medium">{index + 1}.</span>{" "}
                  {item.texto || "(preencha o texto)"}
                </button>
              ))}
            </div>

            {/* Indicador de conexões */}
            <div className="hidden md:flex flex-col items-center justify-center h-full py-4">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">
                {config.conexoesCorretas.length} conexão(ões)
              </span>
            </div>

            {/* Coluna B - Seleção */}
            <div className="space-y-2">
              {config.colunaB.map((item, index) => {
                const isConnected = selectedItemA
                  ? hasConexao(selectedItemA, item.id)
                  : false;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (selectedItemA && item.texto) {
                        toggleConexao(selectedItemA, item.id);
                      }
                    }}
                    disabled={disabled || !item.texto || !selectedItemA}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      isConnected
                        ? "border-green-500 bg-green-500/10"
                        : selectedItemA
                        ? "border-border bg-background hover:border-primary/50"
                        : "border-border bg-muted/30",
                      (!item.texto || !selectedItemA) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}.
                        </span>{" "}
                        {item.texto || "(preencha o texto)"}
                      </span>
                      {isConnected && (
                        <Badge variant="default" className="bg-green-500">
                          Conectado
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de conexões */}
          {config.conexoesCorretas.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm mb-3">Conexões definidas:</h4>
              <div className="flex flex-wrap gap-2">
                {config.conexoesCorretas.map((conexao, index) => {
                  const itemA = config.colunaA.find((i) => i.id === conexao.de);
                  const itemB = config.colunaB.find((i) => i.id === conexao.para);
                  const indexA = config.colunaA.findIndex((i) => i.id === conexao.de);
                  const indexB = config.colunaB.findIndex((i) => i.id === conexao.para);

                  return (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-2 py-1.5 px-3 cursor-pointer hover:bg-destructive/20"
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
              <p className="text-xs text-muted-foreground mt-2">
                Clique em uma conexão para removê-la
              </p>
            </div>
          )}

          {config.conexoesCorretas.length === 0 && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 text-sm">
              Nenhuma conexão definida. Selecione um item da Coluna A e clique em
              um item da Coluna B para criar conexões.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validação */}
      {config.colunaA.some((i) => !i.texto) ||
      config.colunaB.some((i) => !i.texto) ? (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Preencha o texto de todos os itens antes de salvar.
        </div>
      ) : config.conexoesCorretas.length === 0 ? (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Defina pelo menos uma conexão correta.
        </div>
      ) : null}
    </div>
  );
}
