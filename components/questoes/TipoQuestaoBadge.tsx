import { Badge } from "@/components/ui/badge";
import { TipoQuestao } from "@prisma/client";

interface TipoQuestaoBadgeProps {
  tipo: TipoQuestao;
}

const tipoConfig: Record<TipoQuestao, { label: string; short: string }> = {
  MULTIPLA_ESCOLHA_UNICA: { label: "Múltipla Escolha (Única)", short: "ME-U" },
  MULTIPLA_ESCOLHA_MULTIPLA: { label: "Múltipla Escolha (Múltipla)", short: "ME-M" },
  DRAG_DROP: { label: "Arrastar e Soltar", short: "D&D" },
  ASSOCIACAO: { label: "Associação", short: "ASSOC" },
  ORDENACAO: { label: "Ordenação", short: "ORD" },
  LACUNA: { label: "Lacuna", short: "LAC" },
  HOTSPOT: { label: "Hotspot", short: "HOT" },
  COMANDO: { label: "Comando", short: "CMD" },
};

export function TipoQuestaoBadge({ tipo }: TipoQuestaoBadgeProps) {
  const config = tipoConfig[tipo];

  return (
    <Badge variant="outline" title={config.label}>
      {config.short}
    </Badge>
  );
}

export function getTipoLabel(tipo: TipoQuestao): string {
  return tipoConfig[tipo].label;
}
