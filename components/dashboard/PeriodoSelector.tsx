"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodoSelectorProps {
  value: number;
  onChange: (periodo: number) => void;
}

const periodos = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "3 meses", value: 90 },
  { label: "Todos", value: 365 * 10 }, // 10 years = all
];

export function PeriodoSelector({ value, onChange }: PeriodoSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg border p-1 bg-muted/50">
      {periodos.map((periodo) => (
        <Button
          key={periodo.value}
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs",
            value === periodo.value &&
              "bg-background shadow-sm hover:bg-background"
          )}
          onClick={() => onChange(periodo.value)}
        >
          {periodo.label}
        </Button>
      ))}
    </div>
  );
}
