"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import {
  MoreVertical,
  FileQuestion,
  ClipboardList,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import type { Simulado, StatusSimulado } from "@prisma/client";

interface SimuladoWithCount extends Simulado {
  _count: {
    questoes: number;
    provas: number;
  };
}

interface SimuladoCardProps {
  simulado: SimuladoWithCount;
  onStatusChange?: (id: string, status: StatusSimulado) => void;
  onDelete?: (id: string) => void;
}

export function SimuladoCard({
  simulado,
  onStatusChange,
  onDelete,
}: SimuladoCardProps) {
  const canActivate = simulado._count.questoes >= 10;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/docente/simulados/${simulado.id}`}
              className="font-semibold hover:text-primary line-clamp-1"
            >
              {simulado.nome}
            </Link>
            <p className="text-sm text-muted-foreground">
              {simulado.categoria}
              {simulado.subcategoria && ` - ${simulado.subcategoria}`}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/docente/simulados/${simulado.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/docente/simulados/${simulado.id}/questoes`}>
                  <FileQuestion className="mr-2 h-4 w-4" />
                  Questões
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/docente/simulados/${simulado.id}/provas`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Provas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {simulado.status === "ATIVO" ? (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(simulado.id, "INATIVO")}
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(simulado.id, "ATIVO")}
                  disabled={!canActivate}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                  {!canActivate && " (mín. 10 questões)"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(simulado.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {simulado.descricao ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {simulado.descricao}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem descrição</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileQuestion className="h-4 w-4" />
            {simulado._count.questoes}
          </span>
          <span className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            {simulado._count.provas}
          </span>
        </div>
        <StatusBadge status={simulado.status} />
      </CardFooter>
    </Card>
  );
}
