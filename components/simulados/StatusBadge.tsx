import { Badge } from "@/components/ui/badge";
import { StatusSimulado } from "@prisma/client";

interface StatusBadgeProps {
  status: StatusSimulado;
}

const statusConfig: Record<
  StatusSimulado,
  { label: string; variant: "success" | "secondary" | "warning" }
> = {
  ATIVO: { label: "Ativo", variant: "success" },
  INATIVO: { label: "Inativo", variant: "secondary" },
  EM_EDICAO: { label: "Em Edição", variant: "warning" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
