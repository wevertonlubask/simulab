"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, XCircle, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestaoValidada } from "@/lib/validations/importacao";

interface ImportPreviewTableProps {
  questoes: QuestaoValidada[];
  onEdit: (index: number) => void;
}

const ITEMS_PER_PAGE = 10;

export function ImportPreviewTable({ questoes, onEdit }: ImportPreviewTableProps) {
  const [filter, setFilter] = useState<"all" | "ok" | "warning" | "error">("all");
  const [page, setPage] = useState(0);

  const questoesFiltradas = questoes.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  const totalPages = Math.ceil(questoesFiltradas.length / ITEMS_PER_PAGE);
  const questoesPaginadas = questoesFiltradas.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const counts = {
    total: questoes.length,
    ok: questoes.filter((q) => q.status === "ok").length,
    warning: questoes.filter((q) => q.status === "warning").length,
    error: questoes.filter((q) => q.status === "error").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo?: string) => {
    const labels: Record<string, string> = {
      MULTIPLA_ESCOLHA_UNICA: "Múlt. Única",
      MULTIPLA_ESCOLHA_MULTIPLA: "Múlt. Múltipla",
      DRAG_DROP: "Drag & Drop",
      ASSOCIACAO: "Associação",
      ORDENACAO: "Ordenação",
      LACUNA: "Lacunas",
      COMANDO: "Comando",
    };
    return labels[tipo || ""] || tipo || "-";
  };

  const truncate = (text?: string, maxLength = 60) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-4">
      {/* Filtros e estatísticas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar:</span>
          <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setPage(0); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({counts.total})</SelectItem>
              <SelectItem value="ok">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Válidas ({counts.ok})
                </span>
              </SelectItem>
              <SelectItem value="warning">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Avisos ({counts.warning})
                </span>
              </SelectItem>
              <SelectItem value="error">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Erros ({counts.error})
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {counts.ok} válidas
          </Badge>
          {counts.warning > 0 && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              {counts.warning} avisos
            </Badge>
          )}
          {counts.error > 0 && (
            <Badge variant="outline" className="gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {counts.error} erros
            </Badge>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead>Enunciado</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-[300px]">Mensagem</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questoesPaginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma questão encontrada
                </TableCell>
              </TableRow>
            ) : (
              questoesPaginadas.map((q) => (
                <TableRow
                  key={q.index}
                  className={cn(
                    q.status === "error" && "bg-red-500/5",
                    q.status === "warning" && "bg-yellow-500/5"
                  )}
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {q.index + 1}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getTipoLabel(q.questao.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="text-sm">{truncate(q.questao.enunciado)}</span>
                  </TableCell>
                  <TableCell>{getStatusIcon(q.status)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="space-y-1">
                        {q.errors.slice(0, 2).map((err, i) => (
                          <Tooltip key={`err-${i}`}>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-red-500 truncate max-w-[280px]">{err}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-sm">{err}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {q.warnings.slice(0, 2).map((warn, i) => (
                          <Tooltip key={`warn-${i}`}>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-yellow-600 truncate max-w-[280px]">{warn}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-sm">{warn}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {(q.errors.length > 2 || q.warnings.length > 2) && (
                          <p className="text-xs text-muted-foreground">
                            +{q.errors.length + q.warnings.length - 4} mais...
                          </p>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(q.index)}
                      title="Editar questão"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, questoesFiltradas.length)} de {questoesFiltradas.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
