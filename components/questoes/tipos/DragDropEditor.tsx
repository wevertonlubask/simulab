"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  GripVertical,
  Package,
  Target,
  Eye,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DragDropConfig, DragDropItem, DragDropZona } from "@/lib/validations/questao";

interface DragDropEditorProps {
  value: DragDropConfig;
  onChange: (config: DragDropConfig) => void;
  disabled?: boolean;
}

// Componente de item arrastável no editor
function SortableItem({
  item,
  onUpdate,
  onRemove,
  disabled,
}: {
  item: DragDropItem;
  onUpdate: (item: DragDropItem) => void;
  onRemove: () => void;
  disabled?: boolean;
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
        "flex items-center gap-2 p-2 bg-background border rounded-lg",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted p-1 rounded"
        disabled={disabled}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={item.texto}
        onChange={(e) => onUpdate({ ...item, texto: e.target.value })}
        placeholder="Texto do item"
        className="flex-1"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// Componente de zona no editor
function ZonaEditor({
  zona,
  itens,
  onUpdate,
  onRemove,
  disabled,
}: {
  zona: DragDropZona;
  itens: DragDropItem[];
  onUpdate: (zona: DragDropZona) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const toggleItemCorreto = (itemId: string) => {
    const newItensCorretos = zona.itensCorretos.includes(itemId)
      ? zona.itensCorretos.filter((id) => id !== itemId)
      : zona.aceitaMultiplos
      ? [...zona.itensCorretos, itemId]
      : [itemId];
    onUpdate({ ...zona, itensCorretos: newItensCorretos });
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <Input
            value={zona.label}
            onChange={(e) => onUpdate({ ...zona, label: e.target.value })}
            placeholder="Label da zona"
            className="max-w-[200px]"
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id={`multi-${zona.id}`}
                checked={zona.aceitaMultiplos}
                onCheckedChange={(checked) =>
                  onUpdate({
                    ...zona,
                    aceitaMultiplos: checked,
                    itensCorretos: checked ? zona.itensCorretos : zona.itensCorretos.slice(0, 1),
                  })
                }
                disabled={disabled}
              />
              <Label htmlFor={`multi-${zona.id}`} className="text-xs">
                Múltiplos
              </Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <Label className="text-xs text-muted-foreground mb-2 block">
          Itens corretos para esta zona:
        </Label>
        <div className="flex flex-wrap gap-2">
          {itens.map((item) => (
            <Badge
              key={item.id}
              variant={zona.itensCorretos.includes(item.id) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all",
                zona.itensCorretos.includes(item.id)
                  ? "bg-green-500 hover:bg-green-600"
                  : "hover:bg-muted"
              )}
              onClick={() => !disabled && toggleItemCorreto(item.id)}
            >
              {item.texto || `Item ${item.id}`}
            </Badge>
          ))}
        </div>
        {zona.itensCorretos.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Clique nos itens acima para definir quais são corretos para esta zona
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Preview do Drag and Drop
function DragDropPreview({ config }: { config: DragDropConfig }) {
  const [posicoes, setPosicoes] = useState<Record<string, string[]>>({});

  const getItensNaZona = (zonaId: string) => {
    return posicoes[zonaId] || [];
  };

  const getItensDisponiveis = () => {
    const usados = Object.values(posicoes).flat();
    return config.itens.filter((item) => !usados.includes(item.id));
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <h4 className="font-medium flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Preview (somente visualização)
      </h4>

      {/* Itens disponíveis */}
      <div className="p-3 bg-background rounded-lg border-2 border-dashed min-h-[60px]">
        <Label className="text-xs text-muted-foreground mb-2 block">
          Itens para arrastar:
        </Label>
        <div className="flex flex-wrap gap-2">
          {getItensDisponiveis().map((item) => (
            <div
              key={item.id}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium"
            >
              {item.texto}
            </div>
          ))}
          {getItensDisponiveis().length === 0 && (
            <span className="text-xs text-muted-foreground">
              Todos os itens foram posicionados
            </span>
          )}
        </div>
      </div>

      {/* Zonas */}
      <div
        className={cn(
          "grid gap-3",
          config.layoutZonas === "horizontal" && "grid-cols-1 md:grid-cols-3",
          config.layoutZonas === "vertical" && "grid-cols-1",
          config.layoutZonas === "grid" && "grid-cols-2"
        )}
      >
        {config.zonas.map((zona) => (
          <div
            key={zona.id}
            className="p-3 bg-background rounded-lg border-2 border-dashed min-h-[80px]"
          >
            <Label className="text-xs font-medium mb-2 block">{zona.label}</Label>
            <div className="flex flex-wrap gap-1">
              {getItensNaZona(zona.id).map((itemId) => {
                const item = config.itens.find((i) => i.id === itemId);
                return item ? (
                  <Badge key={itemId} variant="secondary">
                    {item.texto}
                  </Badge>
                ) : null;
              })}
              {getItensNaZona(zona.id).length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Arraste itens aqui
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DragDropEditor({
  value,
  onChange,
  disabled = false,
}: DragDropEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addItem = () => {
    const newItem: DragDropItem = {
      id: generateId(),
      texto: "",
      imagemUrl: null,
    };
    onChange({
      ...value,
      itens: [...value.itens, newItem],
    });
  };

  const updateItem = (itemId: string, updatedItem: DragDropItem) => {
    onChange({
      ...value,
      itens: value.itens.map((item) =>
        item.id === itemId ? updatedItem : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    onChange({
      ...value,
      itens: value.itens.filter((item) => item.id !== itemId),
      zonas: value.zonas.map((zona) => ({
        ...zona,
        itensCorretos: zona.itensCorretos.filter((id) => id !== itemId),
      })),
    });
  };

  const addZona = () => {
    const newZona: DragDropZona = {
      id: `zona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: "",
      imagemUrl: null,
      aceitaMultiplos: false,
      itensCorretos: [],
    };
    onChange({
      ...value,
      zonas: [...value.zonas, newZona],
    });
  };

  const updateZona = (zonaId: string, updatedZona: DragDropZona) => {
    onChange({
      ...value,
      zonas: value.zonas.map((zona) =>
        zona.id === zonaId ? updatedZona : zona
      ),
    });
  };

  const removeZona = (zonaId: string) => {
    onChange({
      ...value,
      zonas: value.zonas.filter((zona) => zona.id !== zonaId),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.itens.findIndex((item) => item.id === active.id);
      const newIndex = value.itens.findIndex((item) => item.id === over.id);

      onChange({
        ...value,
        itens: arrayMove(value.itens, oldIndex, newIndex),
      });
    }

    setActiveId(null);
  };

  const activeItem = activeId
    ? value.itens.find((item) => item.id === activeId)
    : null;

  // Validação
  const hasValidItens = value.itens.length >= 2 && value.itens.every((i) => i.texto.trim());
  const hasValidZonas = value.zonas.length >= 1 && value.zonas.every((z) => z.label.trim());
  const hasValidGabarito = value.zonas.every((z) => z.itensCorretos.length > 0);

  return (
    <div className="space-y-6">
      {/* Itens Arrastáveis */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Itens Arrastáveis
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {value.itens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adicione pelo menos 2 itens arrastáveis
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={value.itens.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {value.itens.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onUpdate={(updated) => updateItem(item.id, updated)}
                      onRemove={() => removeItem(item.id)}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <div className="flex items-center gap-2 p-2 bg-background border rounded-lg shadow-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span>{activeItem.texto || "Item"}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
          {!hasValidItens && value.itens.length > 0 && (
            <p className="text-xs text-destructive mt-2">
              Todos os itens precisam ter texto preenchido
            </p>
          )}
        </CardContent>
      </Card>

      {/* Zonas de Destino */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Zonas de Destino
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addZona}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Zona
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {value.zonas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adicione pelo menos 1 zona de destino
            </p>
          ) : (
            value.zonas.map((zona) => (
              <ZonaEditor
                key={zona.id}
                zona={zona}
                itens={value.itens}
                onUpdate={(updated) => updateZona(zona.id, updated)}
                onRemove={() => removeZona(zona.id)}
                disabled={disabled}
              />
            ))
          )}
          {!hasValidZonas && value.zonas.length > 0 && (
            <p className="text-xs text-destructive">
              Todas as zonas precisam ter label preenchido
            </p>
          )}
          {!hasValidGabarito && value.zonas.length > 0 && hasValidZonas && (
            <p className="text-xs text-destructive">
              Defina pelo menos 1 item correto para cada zona
            </p>
          )}
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Pontuação Parcial</Label>
              <p className="text-xs text-muted-foreground">
                Dá pontos proporcionais para respostas parcialmente corretas
              </p>
            </div>
            <Switch
              checked={value.pontuacaoParcial}
              onCheckedChange={(checked) =>
                onChange({ ...value, pontuacaoParcial: checked })
              }
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Layout das Zonas</Label>
            <Select
              value={value.layoutZonas}
              onValueChange={(val: "horizontal" | "vertical" | "grid") =>
                onChange({ ...value, layoutZonas: val })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal (lado a lado)</SelectItem>
                <SelectItem value="vertical">Vertical (empilhado)</SelectItem>
                <SelectItem value="grid">Grid (2 colunas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview Toggle */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          disabled={!hasValidItens || !hasValidZonas}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? "Ocultar Preview" : "Ver Preview"}
        </Button>
        {hasValidItens && hasValidZonas && hasValidGabarito && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Configuração válida
          </Badge>
        )}
      </div>

      {/* Preview */}
      {showPreview && hasValidItens && hasValidZonas && (
        <DragDropPreview config={value} />
      )}
    </div>
  );
}
