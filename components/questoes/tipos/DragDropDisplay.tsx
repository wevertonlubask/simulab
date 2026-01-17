"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DragDropConfig } from "@/lib/validations/questao";

interface DragDropDisplayProps {
  config: DragDropConfig;
  value: DragDropResposta;
  onChange: (value: DragDropResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
  correctAnswer?: DragDropConfig;
}

export interface DragDropResposta {
  posicoes: Record<string, string[]>;
}

// Item arrastável
function DraggableItem({
  id,
  texto,
  isDragging,
  isInZone,
  disabled,
}: {
  id: string;
  texto: string;
  isDragging?: boolean;
  isInZone?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "px-3 py-2 rounded-lg font-medium text-sm transition-all select-none",
        "border-2 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-primary",
        isInZone
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-background border-border hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {texto}
    </div>
  );
}

// Zona de destino
function DroppableZone({
  id,
  label,
  itens,
  allItens,
  aceitaMultiplos,
  isOver,
  disabled,
  showResult,
  itensCorretos,
  onRemoveItem,
}: {
  id: string;
  label: string;
  itens: string[];
  allItens: DragDropConfig["itens"];
  aceitaMultiplos: boolean;
  isOver: boolean;
  disabled?: boolean;
  showResult?: boolean;
  itensCorretos?: string[];
  onRemoveItem: (itemId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  const isCorreto = showResult && itensCorretos
    ? itens.length > 0 &&
      itens.every((i) => itensCorretos.includes(i)) &&
      itensCorretos.every((i) => itens.includes(i))
    : undefined;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border-2 border-dashed min-h-[100px] transition-all",
        isOver && !disabled && "border-primary bg-primary/5",
        !isOver && "border-muted-foreground/30 bg-muted/30",
        showResult && isCorreto === true && "border-green-500 bg-green-500/10",
        showResult && isCorreto === false && "border-red-500 bg-red-500/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        {aceitaMultiplos && (
          <Badge variant="outline" className="text-xs">
            Múltiplos
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {itens.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Arraste itens aqui
          </span>
        ) : (
          itens.map((itemId) => {
            const item = allItens.find((i) => i.id === itemId);
            if (!item) return null;

            const itemCorreto = showResult && itensCorretos
              ? itensCorretos.includes(itemId)
              : undefined;

            return (
              <div
                key={itemId}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2",
                  "bg-primary text-primary-foreground",
                  !disabled && "cursor-pointer hover:bg-primary/90",
                  showResult && itemCorreto === true && "bg-green-500",
                  showResult && itemCorreto === false && "bg-red-500"
                )}
                onClick={() => !disabled && onRemoveItem(itemId)}
              >
                {item.texto}
                {!disabled && !showResult && (
                  <span className="text-xs opacity-70">×</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Container de itens disponíveis
function ItemsContainer({
  itens,
  usedItemIds,
  disabled,
}: {
  itens: DragDropConfig["itens"];
  usedItemIds: string[];
  disabled?: boolean;
}) {
  const availableItens = itens.filter((item) => !usedItemIds.includes(item.id));
  const { setNodeRef, isOver } = useDroppable({ id: "origem" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border-2 min-h-[80px] transition-all",
        isOver && !disabled ? "border-primary bg-primary/5" : "border-border bg-muted/50"
      )}
    >
      <span className="text-sm font-medium text-muted-foreground block mb-3">
        Itens disponíveis ({availableItens.length})
      </span>
      <div className="flex flex-wrap gap-2">
        {availableItens.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Todos os itens foram posicionados
          </span>
        ) : (
          availableItens.map((item) => (
            <DraggableItem
              key={item.id}
              id={item.id}
              texto={item.texto}
              disabled={disabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function DragDropDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
  correctAnswer,
}: DragDropDisplayProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Sensores para desktop e mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Inicializar posições se vazio
  useEffect(() => {
    if (!value.posicoes || Object.keys(value.posicoes).length === 0) {
      const initialPosicoes: Record<string, string[]> = {};
      config.zonas.forEach((zona) => {
        initialPosicoes[zona.id] = [];
      });
      onChange({ posicoes: initialPosicoes });
    }
  }, []);

  // IDs de itens usados em zonas
  const usedItemIds = Object.entries(value.posicoes || {})
    .filter(([key]) => key !== "naoUsados")
    .flatMap(([, ids]) => ids);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const itemId = active.id as string;
    const destino = over.id as string;

    // Encontrar onde o item está atualmente
    let origemZona: string | null = null;
    for (const [zonaId, items] of Object.entries(value.posicoes || {})) {
      if (items.includes(itemId)) {
        origemZona = zonaId;
        break;
      }
    }

    // Se destino é origem, remover da zona atual
    if (destino === "origem") {
      if (origemZona) {
        const newPosicoes = { ...value.posicoes };
        newPosicoes[origemZona] = newPosicoes[origemZona].filter(
          (id) => id !== itemId
        );
        onChange({ posicoes: newPosicoes });
      }
      return;
    }

    // Verificar se destino é uma zona válida
    const zonaDestino = config.zonas.find((z) => z.id === destino);
    if (!zonaDestino) return;

    // Verificar se a zona aceita mais itens
    const itensNaZona = value.posicoes?.[destino] || [];
    if (!zonaDestino.aceitaMultiplos && itensNaZona.length > 0) {
      // Trocar item se zona não aceita múltiplos
      const itemAntigo = itensNaZona[0];
      const newPosicoes = { ...value.posicoes };

      // Remover item antigo da zona destino
      newPosicoes[destino] = [itemId];

      // Se o item veio de outra zona, colocar o item antigo lá
      if (origemZona && origemZona !== destino) {
        newPosicoes[origemZona] = newPosicoes[origemZona]
          .filter((id) => id !== itemId)
          .concat([itemAntigo]);
      }

      onChange({ posicoes: newPosicoes });
      return;
    }

    // Adicionar item à zona
    const newPosicoes = { ...value.posicoes };

    // Remover da origem se estava em outra zona
    if (origemZona) {
      newPosicoes[origemZona] = newPosicoes[origemZona].filter(
        (id) => id !== itemId
      );
    }

    // Adicionar ao destino
    newPosicoes[destino] = [...(newPosicoes[destino] || []), itemId];

    onChange({ posicoes: newPosicoes });
  };

  const handleRemoveItem = (zonaId: string, itemId: string) => {
    if (disabled) return;
    const newPosicoes = { ...value.posicoes };
    newPosicoes[zonaId] = newPosicoes[zonaId].filter((id) => id !== itemId);
    onChange({ posicoes: newPosicoes });
  };

  const activeItem = activeId
    ? config.itens.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Container de itens */}
        <ItemsContainer
          itens={config.itens}
          usedItemIds={usedItemIds}
          disabled={disabled}
        />

        {/* Zonas de destino */}
        <div
          className={cn(
            "grid gap-4",
            config.layoutZonas === "horizontal" && "grid-cols-1 md:grid-cols-3",
            config.layoutZonas === "vertical" && "grid-cols-1",
            config.layoutZonas === "grid" && "grid-cols-1 md:grid-cols-2"
          )}
        >
          {config.zonas.map((zona) => (
            <DroppableZone
              key={zona.id}
              id={zona.id}
              label={zona.label}
              itens={value.posicoes?.[zona.id] || []}
              allItens={config.itens}
              aceitaMultiplos={zona.aceitaMultiplos}
              isOver={overId === zona.id}
              disabled={disabled}
              showResult={showResult}
              itensCorretos={zona.itensCorretos}
              onRemoveItem={(itemId) => handleRemoveItem(zona.id, itemId)}
            />
          ))}
        </div>

        {/* Instruções */}
        {!disabled && !showResult && (
          <p className="text-xs text-muted-foreground text-center">
            Arraste os itens para as zonas corretas. Clique em um item na zona para removê-lo.
          </p>
        )}
      </div>

      {/* Overlay durante arraste */}
      <DragOverlay>
        {activeItem ? (
          <div className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm shadow-lg">
            {activeItem.texto}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
