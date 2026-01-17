"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoriaSelect } from "./CategoriaSelect";
import { Search } from "lucide-react";

interface SimuladosFiltersProps {
  categoria: string;
  status: string;
  busca: string;
  onCategoriaChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onBuscaChange: (value: string) => void;
}

export function SimuladosFilters({
  categoria,
  status,
  busca,
  onCategoriaChange,
  onStatusChange,
  onBuscaChange,
}: SimuladosFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <CategoriaSelect
          value={categoria}
          onValueChange={onCategoriaChange}
          placeholder="Categoria"
          showAllOption
        />
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ATIVO">Ativos</SelectItem>
            <SelectItem value="INATIVO">Inativos</SelectItem>
            <SelectItem value="EM_EDICAO">Em Edição</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
