"use client";

import { useState, useEffect, useRef } from "react";
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
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
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

// Item arrastável com suporte a tap-to-select
function DraggableItem({
  id,
  texto,
  isDragging,
  isInZone,
  disabled,
  isSelected,
  onTap,
}: {
  id: string;
  texto: string;
  isDragging?: boolean;
  isInZone?: boolean;
  disabled?: boolean;
  isSelected?: boolean;
  onTap?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    opacity: isCurrentlyDragging ? 0 : 1,
    cursor: disabled ? 'not-allowed' : 'grab',
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Previne que o click dispare o drag
    if (onTap && !disabled) {
      e.stopPropagation();
      onTap();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "px-3 py-2 rounded-lg font-medium text-sm transition-all select-none",
        "border-2 active:cursor-grabbing",
        isDragging && "ring-2 ring-primary",
        isSelected && "ring-2 ring-primary bg-primary/20 border-primary scale-105",
        isInZone
          ? "bg-primary/10 text-primary border-primary/30"
          : "bg-background border-border hover:border-primary/50",
        disabled && "opacity-60"
      )}
    >
      {texto}
    </div>
  );
}

// Zona de destino com suporte a tap-to-place
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
  isTargetable,
  onTap,
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
  isTargetable?: boolean;
  onTap?: () => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  const isCorreto = showResult && itensCorretos
    ? itens.length > 0 &&
      itens.every((i) => itensCorretos.includes(i)) &&
      itensCorretos.every((i) => itens.includes(i))
    : undefined;

  const handleZoneClick = (e: React.MouseEvent) => {
    if (onTap && isTargetable && !disabled) {
      e.stopPropagation();
      onTap();
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleZoneClick}
      className={cn(
        "p-4 rounded-lg border-2 border-dashed min-h-[100px] transition-all",
        isOver && !disabled && "border-primary bg-primary/5",
        isTargetable && !disabled && "border-primary bg-primary/10 cursor-pointer animate-pulse",
        !isOver && !isTargetable && "border-muted-foreground/30 bg-muted/30",
        showResult && isCorreto === true && "border-green-500 bg-green-500/10",
        showResult && isCorreto === false && "border-red-500 bg-red-500/10"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-2">
          {isTargetable && (
            <Badge variant="default" className="text-xs animate-bounce">
              Toque aqui
            </Badge>
          )}
          {aceitaMultiplos && (
            <Badge variant="outline" className="text-xs">
              Múltiplos
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {itens.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            {isTargetable ? "Toque para colocar o item aqui" : "Arraste itens aqui"}
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onRemoveItem(itemId);
                }}
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

// Container de itens disponíveis com suporte a tap-to-select
function ItemsContainer({
  itens,
  usedItemIds,
  disabled,
  selectedItemId,
  onItemSelect,
  onReturnItem,
}: {
  itens: DragDropConfig["itens"];
  usedItemIds: string[];
  disabled?: boolean;
  selectedItemId: string | null;
  onItemSelect: (itemId: string) => void;
  onReturnItem?: () => void;
}) {
  const availableItens = itens.filter((item) => !usedItemIds.includes(item.id));
  const { setNodeRef, isOver } = useDroppable({ id: "origem" });

  const handleContainerClick = () => {
    if (onReturnItem && selectedItemId) {
      onReturnItem();
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleContainerClick}
      className={cn(
        "p-4 rounded-lg border-2 min-h-[80px] transition-all",
        isOver && !disabled ? "border-primary bg-primary/5" : "border-border bg-muted/50",
        selectedItemId && "border-primary/50"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Itens disponíveis ({availableItens.length})
        </span>
        {selectedItemId && (
          <Badge variant="secondary" className="text-xs">
            Item selecionado - toque na zona de destino
          </Badge>
        )}
      </div>
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
              isSelected={selectedItemId === item.id}
              onTap={() => onItemSelect(item.id)}
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
  // Estado para o modo tap-to-select (mobile)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Sensores para desktop e mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Inicializar posições apenas se realmente não existem E não há resposta salva
  // Usar ref para garantir que só inicializa uma vez
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Só inicializa se ainda não inicializou E se não há posições válidas
    if (hasInitialized.current) return;

    const hasValidPosicoes = value.posicoes &&
      Object.keys(value.posicoes).length > 0 &&
      Object.values(value.posicoes).some(arr => arr.length > 0);

    // Se já tem posições com itens, não sobrescreve
    if (hasValidPosicoes) {
      hasInitialized.current = true;
      return;
    }

    // Se não tem posições mas tem zonas configuradas, inicializa vazio
    if (!value.posicoes || Object.keys(value.posicoes).length === 0) {
      const initialPosicoes: Record<string, string[]> = {};
      config.zonas.forEach((zona) => {
        initialPosicoes[zona.id] = [];
      });
      hasInitialized.current = true;
      onChange({ posicoes: initialPosicoes });
    }
  }, [config.zonas, value.posicoes, onChange]);

  // IDs de itens usados em zonas
  const usedItemIds = Object.entries(value.posicoes || {})
    .filter(([key]) => key !== "naoUsados")
    .flatMap(([, ids]) => ids);

  // Função para mover item para zona (usado tanto por drag&drop quanto por tap)
  const moveItemToZone = (itemId: string, destinoId: string) => {
    // Encontrar onde o item está atualmente
    let origemZona: string | null = null;
    for (const [zonaId, items] of Object.entries(value.posicoes || {})) {
      if (items.includes(itemId)) {
        origemZona = zonaId;
        break;
      }
    }

    // Se destino é origem, remover da zona atual
    if (destinoId === "origem") {
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
    const zonaDestino = config.zonas.find((z) => z.id === destinoId);
    if (!zonaDestino) return;

    // Verificar se a zona aceita mais itens
    const itensNaZona = value.posicoes?.[destinoId] || [];
    if (!zonaDestino.aceitaMultiplos && itensNaZona.length > 0) {
      // Trocar item se zona não aceita múltiplos
      const itemAntigo = itensNaZona[0];
      const newPosicoes = { ...value.posicoes };

      // Remover item antigo da zona destino
      newPosicoes[destinoId] = [itemId];

      // Se o item veio de outra zona, colocar o item antigo lá
      if (origemZona && origemZona !== destinoId) {
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
    newPosicoes[destinoId] = [...(newPosicoes[destinoId] || []), itemId];

    onChange({ posicoes: newPosicoes });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Limpar seleção tap quando começa a arrastar
    setSelectedItemId(null);
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

    moveItemToZone(itemId, destino);
  };

  // Handlers para o modo tap-to-select
  const handleItemSelect = (itemId: string) => {
    if (disabled) return;

    if (selectedItemId === itemId) {
      // Desselecionar se clicar no mesmo item
      setSelectedItemId(null);
    } else {
      setSelectedItemId(itemId);
    }
  };

  const handleZoneTap = (zonaId: string) => {
    if (disabled || !selectedItemId) return;

    moveItemToZone(selectedItemId, zonaId);
    setSelectedItemId(null);
  };

  const handleReturnSelectedItem = () => {
    // Quando um item está selecionado e o usuário toca na área de origem,
    // apenas desseleciona
    setSelectedItemId(null);
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

  // Ref para o container
  const containerRef = useRef<HTMLDivElement>(null);

  // Limpar seleção quando clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedItemId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <div className="space-y-4">
          {/* Container de itens */}
          <ItemsContainer
            itens={config.itens}
            usedItemIds={usedItemIds}
            disabled={disabled}
            selectedItemId={selectedItemId}
            onItemSelect={handleItemSelect}
            onReturnItem={handleReturnSelectedItem}
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
                isTargetable={!!selectedItemId}
                onTap={() => handleZoneTap(zona.id)}
              />
            ))}
          </div>

          {/* Instruções */}
          {!disabled && !showResult && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>
                <strong>Desktop:</strong> Arraste os itens para as zonas corretas.
              </p>
              <p>
                <strong>Mobile:</strong> Toque em um item para selecioná-lo, depois toque na zona de destino.
              </p>
              <p>
                Clique em um item na zona para removê-lo.
              </p>
            </div>
          )}
        </div>

        {/* Overlay durante arraste */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeItem ? (
            <div className="px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm shadow-lg">
              {activeItem.texto}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
