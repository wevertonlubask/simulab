import { Badge } from "@/components/ui/badge";
import { Dificuldade } from "@prisma/client";

interface DificuldadeBadgeProps {
  dificuldade: Dificuldade;
}

const dificuldadeConfig: Record<
  Dificuldade,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  FACIL: { label: "Fácil", variant: "success" },
  MEDIO: { label: "Médio", variant: "warning" },
  DIFICIL: { label: "Difícil", variant: "destructive" },
};

export function DificuldadeBadge({ dificuldade }: DificuldadeBadgeProps) {
  const config = dificuldadeConfig[dificuldade];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
