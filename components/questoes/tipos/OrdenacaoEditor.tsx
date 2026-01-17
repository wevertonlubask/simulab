"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrdenacaoConfig, OrdenacaoItem } from "@/lib/validations/questao";

interface OrdenacaoEditorProps {
  value: OrdenacaoConfig;
  onChange: (value: OrdenacaoConfig) => void;
  disabled?: boolean;
}

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultConfig: OrdenacaoConfig = {
  instrucao: "",
  itens: [],
  pontuacaoParcial: true,
};

// Componente de item sortável
function SortableItem({
  item,
  index,
  onUpdate,
  onRemove,
  disabled,
  canRemove,
}: {
  item: OrdenacaoItem;
  index: number;
  onUpdate: (id: string, texto: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg border bg-background",
        isDragging && "opacity-50 ring-2 ring-primary",
        disabled && "opacity-60"
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        disabled={disabled}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <Badge variant="secondary" className="w-8 justify-center">
        {index + 1}
      </Badge>
      <Input
        value={item.texto}
        onChange={(e) => onUpdate(item.id, e.target.value)}
        placeholder={`Item ${index + 1}`}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        disabled={disabled || !canRemove}
        className="h-8 w-8 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function OrdenacaoEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: OrdenacaoEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Garantir que value tenha todos os campos necessários
  const config: OrdenacaoConfig = {
    instrucao: value?.instrucao || "",
    itens: value?.itens || [],
    pontuacaoParcial: value?.pontuacaoParcial ?? true,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Adicionar item
  const addItem = useCallback(() => {
    const newItem: OrdenacaoItem = {
      id: generateId(),
      texto: "",
      ordemCorreta: config.itens.length + 1,
    };
    onChange({
      ...config,
      itens: [...config.itens, newItem],
    });
  }, [config, onChange]);

  // Atualizar texto do item
  const updateItem = useCallback(
    (id: string, texto: string) => {
      onChange({
        ...config,
        itens: config.itens.map((item) =>
          item.id === id ? { ...item, texto } : item
        ),
      });
    },
    [config, onChange]
  );

  // Remover item
  const removeItem = useCallback(
    (id: string) => {
      if (config.itens.length <= 2) return;
      const newItens = config.itens
        .filter((item) => item.id !== id)
        .map((item, index) => ({
          ...item,
          ordemCorreta: index + 1,
        }));
      onChange({
        ...config,
        itens: newItens,
      });
    },
    [config, onChange]
  );

  // Handle drag end - reordenar
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = config.itens.findIndex((item) => item.id === active.id);
      const newIndex = config.itens.findIndex((item) => item.id === over.id);

      const newItens = arrayMove(config.itens, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          ordemCorreta: index + 1,
        })
      );

      onChange({
        ...config,
        itens: newItens,
      });
    }
  };

  // Embaralhar para preview
  const getShuffledItems = () => {
    const shuffled = [...config.itens];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

      {/* Instrução opcional */}
      <div className="space-y-2">
        <Label htmlFor="instrucao">Instrução (opcional)</Label>
        <Textarea
          id="instrucao"
          value={config.instrucao || ""}
          onChange={(e) => onChange({ ...config, instrucao: e.target.value })}
          placeholder="Ex: Ordene os passos para instalar o Docker..."
          disabled={disabled}
          rows={2}
        />
      </div>

      {!showPreview ? (
        /* Modo Edição */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Itens na Ordem Correta
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={disabled || config.itens.length >= 10}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Arraste os itens para definir a ordem correta. Os alunos receberão
              os itens embaralhados.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {config.itens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Adicione pelo menos 2 itens para ordenar</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={disabled}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={config.itens.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {config.itens.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      disabled={disabled}
                      canRemove={config.itens.length > 2}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Modo Preview */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Preview - Como o aluno verá
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Os itens serão apresentados em ordem aleatória
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {getShuffledItems().map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline" className="w-8 justify-center">
                  ?
                </Badge>
                <span>{item.texto || "(vazio)"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gabarito */}
      {config.itens.length > 0 && (
        <Card className="bg-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">
              Gabarito (Ordem Correta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {config.itens.map((item, index) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="border-green-500 text-green-600"
                >
                  {index + 1}. {item.texto || "(vazio)"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação */}
      {config.itens.length < 2 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Adicione pelo menos 2 itens para criar uma questão de ordenação.
        </div>
      )}
      {config.itens.some((i) => !i.texto) && config.itens.length >= 2 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Preencha o texto de todos os itens antes de salvar.
        </div>
      )}
    </div>
  );
}
