"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComandoConfig } from "@/lib/validations/questao";

interface ComandoEditorProps {
  value: ComandoConfig;
  onChange: (value: ComandoConfig) => void;
  disabled?: boolean;
}

const defaultConfig: ComandoConfig = {
  prompt: "$",
  contexto: "",
  respostasAceitas: [],
  caseSensitive: true,
  ignorarEspacosExtras: true,
};

export function ComandoEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: ComandoEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [novaResposta, setNovaResposta] = useState("");

  // Garantir que value tenha todos os campos necessários
  const config: ComandoConfig = {
    prompt: value?.prompt || "$",
    contexto: value?.contexto || "",
    respostasAceitas: value?.respostasAceitas || [],
    caseSensitive: value?.caseSensitive ?? true,
    ignorarEspacosExtras: value?.ignorarEspacosExtras ?? true,
    feedback: value?.feedback,
  };

  // Adicionar resposta aceita
  const addResposta = useCallback(() => {
    if (!novaResposta.trim()) return;
    if (config.respostasAceitas.includes(novaResposta.trim())) return;
    onChange({
      ...config,
      respostasAceitas: [...config.respostasAceitas, novaResposta.trim()],
    });
    setNovaResposta("");
  }, [config, novaResposta, onChange]);

  // Remover resposta aceita
  const removeResposta = useCallback(
    (index: number) => {
      onChange({
        ...config,
        respostasAceitas: config.respostasAceitas.filter((_, i) => i !== index),
      });
    },
    [config, onChange]
  );

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
            id="ignorar-espacos"
            checked={config.ignorarEspacosExtras}
            onCheckedChange={(checked) =>
              onChange({ ...config, ignorarEspacosExtras: checked })
            }
            disabled={disabled}
          />
          <Label htmlFor="ignorar-espacos" className="cursor-pointer">
            Ignorar espaços extras
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
        <>
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt do Terminal</Label>
            <Input
              id="prompt"
              value={config.prompt}
              onChange={(e) => onChange({ ...config, prompt: e.target.value })}
              placeholder="$"
              disabled={disabled}
              className="w-32 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Ex: $, #, root@server:~#, C:\&gt;
            </p>
          </div>

          {/* Contexto */}
          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto/Cenário *</Label>
            <Textarea
              id="contexto"
              value={config.contexto}
              onChange={(e) => onChange({ ...config, contexto: e.target.value })}
              placeholder="Descreva o cenário para o aluno. Ex:&#10;&#10;Você está no diretório /home/user e precisa listar todos os arquivos, incluindo os ocultos, com detalhes de permissões e tamanho."
              disabled={disabled}
              rows={4}
            />
          </div>

          {/* Respostas aceitas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Comandos Aceitos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Adicione todos os comandos que serão considerados corretos
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={novaResposta}
                  onChange={(e) => setNovaResposta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addResposta();
                    }
                  }}
                  onBlur={() => {
                    // Adicionar automaticamente ao perder o foco se tiver texto
                    if (novaResposta.trim()) {
                      addResposta();
                    }
                  }}
                  placeholder="Digite o comando e pressione Enter ou Tab"
                  disabled={disabled}
                  className="flex-1 font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResposta}
                  disabled={disabled || !novaResposta.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {config.respostasAceitas.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum comando adicionado
                </div>
              ) : (
                <div className="space-y-2">
                  {config.respostasAceitas.map((resposta, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-muted/50 font-mono text-sm"
                    >
                      <Badge variant="secondary" className="font-normal">
                        {config.prompt}
                      </Badge>
                      <span className="flex-1">{resposta}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeResposta(index)}
                        disabled={disabled}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Modo Preview */
        <Card className="bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-base text-zinc-300">
              Preview - Simulação de Terminal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Contexto */}
            {config.contexto && (
              <div className="mb-4 p-3 rounded bg-zinc-800 text-zinc-300 text-sm">
                {config.contexto}
              </div>
            )}

            {/* Terminal */}
            <div className="font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">{config.prompt}</span>
                <Input
                  disabled
                  placeholder="Digite o comando aqui..."
                  className="bg-transparent border-none text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gabarito */}
      {config.respostasAceitas.length > 0 && (
        <Card className="bg-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">
              Gabarito (Comandos Aceitos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {config.respostasAceitas.map((cmd, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    {config.prompt}
                  </Badge>
                  <span>{cmd}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação */}
      {config.respostasAceitas.length === 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Adicione pelo menos 1 comando aceito.
        </div>
      )}
      {!config.contexto && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Digite o contexto/cenário da questão.
        </div>
      )}
    </div>
  );
}
