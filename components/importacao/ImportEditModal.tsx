"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash } from "lucide-react";
import type { QuestaoValidada, QuestaoImport } from "@/lib/validations/importacao";

// Tipo flexível para o formulário (evita problemas com union types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormDataType = Record<string, any>;

interface ImportEditModalProps {
  questao: QuestaoValidada | null;
  open: boolean;
  onClose: () => void;
  onSave: (index: number, questao: Partial<QuestaoImport>) => void;
}

export function ImportEditModal({ questao, open, onClose, onSave }: ImportEditModalProps) {
  const [formData, setFormData] = useState<FormDataType>({});

  useEffect(() => {
    if (questao) {
      setFormData(questao.questao as FormDataType);
    }
  }, [questao]);

  if (!questao) return null;

  const handleSave = () => {
    onSave(questao.index, formData as Partial<QuestaoImport>);
    onClose();
  };

  const isMultiplaEscolha =
    formData.tipo === "MULTIPLA_ESCOLHA_UNICA" || formData.tipo === "MULTIPLA_ESCOLHA_MULTIPLA";

  // Helper para acessar alternativas (só existe para múltipla escolha)
  const getAlternativas = (): { texto: string; correta: boolean }[] => formData.alternativas || [];

  const updateAlternativa = (index: number, field: "texto" | "correta", value: string | boolean) => {
    const alternativas = [...getAlternativas()];
    alternativas[index] = { ...alternativas[index], [field]: value };

    // Se for única escolha e marcou como correta, desmarcar as outras
    if (formData.tipo === "MULTIPLA_ESCOLHA_UNICA" && field === "correta" && value === true) {
      alternativas.forEach((alt, i) => {
        if (i !== index) alt.correta = false;
      });
    }

    setFormData({ ...formData, alternativas });
  };

  const addAlternativa = () => {
    const alternativas = [...getAlternativas()];
    alternativas.push({ texto: "", correta: false });
    setFormData({ ...formData, alternativas });
  };

  const removeAlternativa = (index: number) => {
    const alternativas = [...getAlternativas()];
    alternativas.splice(index, 1);
    setFormData({ ...formData, alternativas });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Questão #{questao.index + 1}
            {questao.status === "error" && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Erros
              </Badge>
            )}
            {questao.status === "warning" && (
              <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500">
                Avisos
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Erros e avisos */}
          {(questao.errors.length > 0 || questao.warnings.length > 0) && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              {questao.errors.map((err, i) => (
                <p key={`err-${i}`} className="text-sm text-red-500">
                  {err}
                </p>
              ))}
              {questao.warnings.map((warn, i) => (
                <p key={`warn-${i}`} className="text-sm text-yellow-600">
                  {warn}
                </p>
              ))}
            </div>
          )}

          {/* Tipo */}
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(v) => setFormData({ ...formData, tipo: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MULTIPLA_ESCOLHA_UNICA">Múltipla Escolha (Única)</SelectItem>
                <SelectItem value="MULTIPLA_ESCOLHA_MULTIPLA">Múltipla Escolha (Múltipla)</SelectItem>
                <SelectItem value="DRAG_DROP">Drag & Drop</SelectItem>
                <SelectItem value="ASSOCIACAO">Associação</SelectItem>
                <SelectItem value="ORDENACAO">Ordenação</SelectItem>
                <SelectItem value="LACUNA">Lacunas</SelectItem>
                <SelectItem value="COMANDO">Comando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enunciado */}
          <div className="grid gap-2">
            <Label>Enunciado</Label>
            <Textarea
              value={formData.enunciado || ""}
              onChange={(e) => setFormData({ ...formData, enunciado: e.target.value })}
              rows={3}
            />
          </div>

          {/* Dificuldade */}
          <div className="grid gap-2">
            <Label>Dificuldade</Label>
            <Select
              value={formData.dificuldade || ""}
              onValueChange={(v) => setFormData({ ...formData, dificuldade: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FACIL">Fácil</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="DIFICIL">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="grid gap-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={(formData.tags || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
              placeholder="ex: redes, tcp, protocolos"
            />
          </div>

          {/* Explicação */}
          <div className="grid gap-2">
            <Label>Explicação (opcional)</Label>
            <Textarea
              value={formData.explicacao || ""}
              onChange={(e) => setFormData({ ...formData, explicacao: e.target.value })}
              rows={2}
            />
          </div>

          {/* Alternativas (apenas para múltipla escolha) */}
          {isMultiplaEscolha && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Alternativas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAlternativa}
                  disabled={getAlternativas().length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {getAlternativas().map((alt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium text-muted-foreground">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <Input
                      value={alt.texto}
                      onChange={(e) => updateAlternativa(i, "texto", e.target.value)}
                      className="flex-1"
                      placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={alt.correta}
                        onCheckedChange={(checked) => updateAlternativa(i, "correta", checked === true)}
                      />
                      <span className="text-xs text-muted-foreground">Correta</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlternativa(i)}
                      disabled={getAlternativas().length <= 2}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Para outros tipos, mostrar JSON da configuração */}
          {!isMultiplaEscolha && formData.configuracao && (
            <div className="grid gap-2">
              <Label>Configuração (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.configuracao, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setFormData({ ...formData, configuracao: config });
                  } catch {
                    // Ignora erros de parsing enquanto digita
                  }
                }}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
