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
import { StatusProvaBadge } from "./StatusProvaBadge";
import {
  MoreVertical,
  FileQuestion,
  Settings,
  Play,
  Square,
  Trash2,
  Clock,
  Users,
  Copy,
} from "lucide-react";
import type { Prova, StatusProva } from "@prisma/client";

interface ProvaWithCount extends Prova {
  _count: {
    questoes: number;
    tentativas: number;
  };
}

interface ProvaCardProps {
  prova: ProvaWithCount;
  simuladoId: string;
  onPublish?: (id: string) => void;
  onClose?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function ProvaCard({
  prova,
  simuladoId,
  onPublish,
  onClose,
  onDelete,
  onDuplicate,
}: ProvaCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">
                {prova.codigo}
              </span>
              <StatusProvaBadge status={prova.status} />
            </div>
            <Link
              href={`/docente/provas/${prova.id}`}
              className="font-semibold hover:text-primary line-clamp-1"
            >
              {prova.nome}
            </Link>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/docente/provas/${prova.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/docente/provas/${prova.id}/questoes`}>
                  <FileQuestion className="mr-2 h-4 w-4" />
                  Ver Questões
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(prova.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {prova.status === "RASCUNHO" && (
                <DropdownMenuItem
                  onClick={() => onPublish?.(prova.id)}
                  disabled={prova._count.questoes < 10}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Publicar
                  {prova._count.questoes < 10 && " (mín. 10 questões)"}
                </DropdownMenuItem>
              )}
              {prova.status === "PUBLICADA" && (
                <DropdownMenuItem onClick={() => onClose?.(prova.id)}>
                  <Square className="mr-2 h-4 w-4" />
                  Encerrar
                </DropdownMenuItem>
              )}
              {prova.status === "RASCUNHO" && prova._count.tentativas === 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(prova.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {prova.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {prova.descricao}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileQuestion className="h-4 w-4" />
            <span>{prova._count.questoes} questões</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{prova._count.tentativas} tentativas</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {prova.tempoLimite ? `${prova.tempoLimite} min` : "Sem limite"}
            </span>
          </div>
          <div className="text-muted-foreground">
            Nota mín: {prova.notaMinima}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
