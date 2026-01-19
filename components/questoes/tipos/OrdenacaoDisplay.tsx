"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { Badge } from "@/components/ui/badge";
import { GripVertical, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrdenacaoConfig } from "@/lib/validations/questao";

interface OrdenacaoDisplayProps {
  config: OrdenacaoConfig;
  value: OrdenacaoResposta;
  onChange: (value: OrdenacaoResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export interface OrdenacaoResposta {
  ordem: string[]; // IDs na ordem escolhida
}

// Componente de item sortável
function SortableItem({
  id,
  texto,
  index,
  isDragging,
  disabled,
  showResult,
  isCorrect,
}: {
  id: string;
  texto: string;
  index: number;
  isDragging?: boolean;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border bg-background transition-all",
        isSortableDragging && "opacity-50 ring-2 ring-primary shadow-lg",
        !disabled && !showResult && "hover:border-primary/50",
        disabled && "opacity-60",
        showResult && isCorrect && "border-green-500 bg-green-500/10",
        showResult && isCorrect === false && "border-red-500 bg-red-500/10"
      )}
    >
      {!disabled && !showResult && (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
      <Badge
        variant={showResult ? (isCorrect ? "default" : "destructive") : "secondary"}
        className={cn(
          "w-8 justify-center",
          showResult && isCorrect && "bg-green-500"
        )}
      >
        {index + 1}
      </Badge>
      <span className="flex-1">{texto}</span>
      {showResult && (
        isCorrect ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-red-500" />
        )
      )}
    </div>
  );
}

export function OrdenacaoDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
}: OrdenacaoDisplayProps) {
  const [items, setItems] = useState<string[]>([]);

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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para embaralhar maximizando a distância da ordem correta
  const shuffleMaxDistance = (correctOrder: string[]): string[] => {
    const n = correctOrder.length;

    if (n <= 1) return [...correctOrder];

    // Para arrays pequenos (2-3 itens), simplesmente inverter
    if (n <= 3) {
      return [...correctOrder].reverse();
    }

    // Estratégia: colocar cada item o mais longe possível da posição correta
    // Intercalar itens do final com itens do início
    const result: string[] = new Array(n);
    const mid = Math.floor(n / 2);

    // Colocar a segunda metade no início e a primeira metade no final
    for (let i = 0; i < n; i++) {
      if (i < mid) {
        // Primeira metade vai para o final
        result[n - 1 - i] = correctOrder[i];
      } else {
        // Segunda metade vai para o início
        result[i - mid] = correctOrder[i];
      }
    }

    // Verificar se algum item ficou na posição correta e trocar
    for (let i = 0; i < n; i++) {
      if (result[i] === correctOrder[i]) {
        // Encontrar outra posição para trocar
        for (let j = 0; j < n; j++) {
          if (i !== j && result[j] !== correctOrder[j] && result[i] !== correctOrder[j] && result[j] !== correctOrder[i]) {
            // Trocar
            [result[i], result[j]] = [result[j], result[i]];
            break;
          }
        }
      }
    }

    // Embaralhar um pouco mais para não ficar previsível (mas mantendo distância)
    // Fazer algumas trocas aleatórias que não coloquem itens na posição correta
    for (let attempt = 0; attempt < n; attempt++) {
      const i = Math.floor(Math.random() * n);
      const j = Math.floor(Math.random() * n);
      if (i !== j) {
        // Verificar se a troca não coloca nenhum item na posição correta
        const newPosI = result[j] !== correctOrder[i];
        const newPosJ = result[i] !== correctOrder[j];
        if (newPosI && newPosJ) {
          [result[i], result[j]] = [result[j], result[i]];
        }
      }
    }

    return result;
  };

  // Inicializar com ordem embaralhada ou ordem existente
  useEffect(() => {
    if (value?.ordem && value.ordem.length > 0) {
      setItems(value.ordem);
    } else {
      // Obter ordem correta
      const correctOrder = [...config.itens]
        .sort((a, b) => a.ordemCorreta - b.ordemCorreta)
        .map((item) => item.id);

      // Embaralhar maximizando distância da ordem correta
      const shuffled = shuffleMaxDistance(correctOrder);
      setItems(shuffled);
      onChange({ ordem: shuffled });
    }
  }, []);

  // Ordem correta
  const ordemCorreta = [...config.itens]
    .sort((a, b) => a.ordemCorreta - b.ordemCorreta)
    .map((item) => item.id);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange({ ordem: newItems });
    }
  };

  // Verificar se posição está correta
  const isPositionCorrect = (itemId: string, index: number) => {
    return ordemCorreta[index] === itemId;
  };

  // Obter texto do item
  const getItemTexto = (id: string) => {
    return config.itens.find((item) => item.id === id)?.texto || "";
  };

  return (
    <div className="space-y-4">
      {/* Instrução */}
      {config.instrucao && (
        <p className="text-sm text-muted-foreground mb-4">
          {config.instrucao}
        </p>
      )}

      {/* Lista sortável */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((itemId, index) => (
              <SortableItem
                key={itemId}
                id={itemId}
                texto={getItemTexto(itemId)}
                index={index}
                disabled={disabled || showResult}
                showResult={showResult}
                isCorrect={showResult ? isPositionCorrect(itemId, index) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Instruções */}
      {!disabled && !showResult && (
        <p className="text-xs text-muted-foreground text-center">
          Arraste os itens para colocá-los na ordem correta
        </p>
      )}

      {/* Resultado */}
      {showResult && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Ordem Correta:</h4>
          <div className="space-y-1">
            {ordemCorreta.map((itemId, index) => (
              <div key={itemId} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="w-6 justify-center border-green-500 text-green-600">
                  {index + 1}
                </Badge>
                <span>{getItemTexto(itemId)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
