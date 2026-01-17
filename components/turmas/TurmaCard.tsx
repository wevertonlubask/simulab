"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Users,
  ClipboardList,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TurmaCardProps {
  turma: {
    id: string;
    nome: string;
    descricao: string | null;
    codigo: string;
    ativa: boolean;
    _count: {
      alunos: number;
      provas: number;
    };
  };
  onStatusChange?: (id: string, ativa: boolean) => void;
  onDelete?: (id: string) => void;
}

export function TurmaCard({ turma, onStatusChange, onDelete }: TurmaCardProps) {
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(turma.codigo);
    toast({
      title: "Código copiado!",
      description: `O código ${turma.codigo} foi copiado para a área de transferência.`,
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/docente/turmas/${turma.id}`}
              className="font-semibold hover:text-primary line-clamp-1"
            >
              {turma.nome}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-1 text-sm font-mono bg-muted px-2 py-0.5 rounded hover:bg-muted/80 transition-colors"
                title="Clique para copiar"
              >
                <Copy className="h-3 w-3" />
                {turma.codigo}
              </button>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/docente/turmas/${turma.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Gerenciar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {turma.ativa ? (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(turma.id, false)}
                >
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onStatusChange?.(turma.id, true)}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(turma.id)}
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
        {turma.descricao ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {turma.descricao}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem descrição</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {turma._count.alunos}
          </span>
          <span className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            {turma._count.provas}
          </span>
        </div>
        <Badge variant={turma.ativa ? "default" : "secondary"}>
          {turma.ativa ? "Ativa" : "Inativa"}
        </Badge>
      </CardFooter>
    </Card>
  );
}
