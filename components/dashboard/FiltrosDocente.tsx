"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Turma {
  id: string;
  nome: string;
}

interface Simulado {
  id: string;
  titulo: string;
}

interface FiltrosDocenteProps {
  turmas: Turma[];
  simulados: Simulado[];
  turmaId: string | null;
  simuladoId: string | null;
  onTurmaChange: (turmaId: string | null) => void;
  onSimuladoChange: (simuladoId: string | null) => void;
}

export function FiltrosDocente({
  turmas,
  simulados,
  turmaId,
  simuladoId,
  onTurmaChange,
  onSimuladoChange,
}: FiltrosDocenteProps) {
  const hasFilters = turmaId || simuladoId;

  const clearFilters = () => {
    onTurmaChange(null);
    onSimuladoChange(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={turmaId || "all"}
        onValueChange={(v) => onTurmaChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todas as turmas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as turmas</SelectItem>
          {turmas.map((turma) => (
            <SelectItem key={turma.id} value={turma.id}>
              {turma.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={simuladoId || "all"}
        onValueChange={(v) => onSimuladoChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os simulados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os simulados</SelectItem>
          {simulados.map((simulado) => (
            <SelectItem key={simulado.id} value={simulado.id}>
              {simulado.titulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
