"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface QuestoesFiltersProps {
  tipo: string;
  dificuldade: string;
  busca: string;
  onTipoChange: (value: string) => void;
  onDificuldadeChange: (value: string) => void;
  onBuscaChange: (value: string) => void;
}

export function QuestoesFilters({
  tipo,
  dificuldade,
  busca,
  onTipoChange,
  onDificuldadeChange,
  onBuscaChange,
}: QuestoesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar no enunciado..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select value={tipo} onValueChange={onTipoChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="MULTIPLA_ESCOLHA_UNICA">ME Única</SelectItem>
            <SelectItem value="MULTIPLA_ESCOLHA_MULTIPLA">ME Múltipla</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dificuldade} onValueChange={onDificuldadeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="FACIL">Fácil</SelectItem>
            <SelectItem value="MEDIO">Médio</SelectItem>
            <SelectItem value="DIFICIL">Difícil</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
