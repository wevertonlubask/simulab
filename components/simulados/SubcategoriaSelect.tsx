"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIAS } from "@/types";

interface SubcategoriaSelectProps {
  categoria?: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SubcategoriaSelect({
  categoria,
  value,
  onValueChange,
  placeholder = "Selecione a subcategoria",
  disabled = false,
}: SubcategoriaSelectProps) {
  const categoriaData = CATEGORIAS.find((c) => c.value === categoria);
  const subcategorias = categoriaData?.subcategorias || [];

  const isDisabled = disabled || !categoria || subcategorias.length === 0;

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            !categoria
              ? "Selecione primeiro a categoria"
              : subcategorias.length === 0
                ? "Categoria sem subcategorias"
                : placeholder
          }
        />
      </SelectTrigger>
      <SelectContent>
        {subcategorias.map((sub) => (
          <SelectItem key={sub} value={sub}>
            {sub}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
