import { Badge } from "@/components/ui/badge";
import { StatusProva } from "@prisma/client";

interface StatusProvaBadgeProps {
  status: StatusProva;
}

const statusConfig: Record<
  StatusProva,
  { label: string; variant: "secondary" | "success" | "destructive" }
> = {
  RASCUNHO: { label: "Rascunho", variant: "secondary" },
  PUBLICADA: { label: "Publicada", variant: "success" },
  ENCERRADA: { label: "Encerrada", variant: "destructive" },
};

export function StatusProvaBadge({ status }: StatusProvaBadgeProps) {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
