"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DificuldadeBadge } from "./DificuldadeBadge";
import { TipoQuestaoBadge } from "./TipoQuestaoBadge";
import {
  MoreVertical,
  Edit,
  Copy,
  Eye,
  Trash2,
  GripVertical,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Questao, Alternativa } from "@prisma/client";

interface QuestaoWithAlternativas extends Questao {
  alternativas: Alternativa[];
}

interface QuestaoCardProps {
  questao: QuestaoWithAlternativas;
  simuladoId: string;
  onPreview?: (questao: QuestaoWithAlternativas) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function QuestaoCard({
  questao,
  simuladoId,
  onPreview,
  onDuplicate,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: QuestaoCardProps) {
  const correctCount = questao.alternativas.filter((a) => a.correta).length;

  return (
    <Card className={`${isDragging ? "opacity-50" : ""} ${!questao.ativo ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          {dragHandleProps && (
            <button
              className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground"
              {...dragHandleProps}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <TipoQuestaoBadge tipo={questao.tipo} />
              <DificuldadeBadge dificuldade={questao.dificuldade} />
              {!questao.ativo && (
                <span className="text-xs text-muted-foreground">(Inativa)</span>
              )}
            </div>
            <p className="text-sm line-clamp-2">{questao.enunciado}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview?.(questao)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/docente/simulados/${simuladoId}/questoes/${questao.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(questao.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(questao.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {questao.alternativas.slice(0, 4).map((alt) => (
            <div
              key={alt.id}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {alt.correta ? (
                <CheckCircle className="h-3 w-3 text-success shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              )}
              <span className="line-clamp-1">{alt.texto}</span>
            </div>
          ))}
          {questao.alternativas.length > 4 && (
            <p className="text-xs text-muted-foreground">
              +{questao.alternativas.length - 4} alternativa(s)
            </p>
          )}
        </div>

        {questao.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {questao.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
            {questao.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{questao.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {correctCount} correta{correctCount !== 1 ? "s" : ""} de{" "}
            {questao.alternativas.length}
          </span>
          <span>Peso: {questao.peso}</span>
        </div>
      </CardContent>
    </Card>
  );
}
