"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Circle,
  LucideIcon,
} from "lucide-react";

type StatusType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending"
  | "loading"
  | "default";

interface StatusConfig {
  icon: LucideIcon;
  className: string;
  iconClassName: string;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  success: {
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    iconClassName: "text-green-500",
  },
  error: {
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    iconClassName: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    iconClassName: "text-yellow-500",
  },
  info: {
    icon: Circle,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    iconClassName: "text-blue-500",
  },
  pending: {
    icon: Clock,
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    iconClassName: "text-orange-500",
  },
  loading: {
    icon: Loader2,
    className: "bg-primary/10 text-primary border-primary/20",
    iconClassName: "text-primary animate-spin",
  },
  default: {
    icon: Circle,
    className: "bg-muted text-muted-foreground border-border",
    iconClassName: "text-muted-foreground",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
  className,
  pulse = false,
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium transition-colors",
        sizeClasses[size],
        config.className,
        pulse && "animate-pulse-soft",
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(iconSizes[size], config.iconClassName)} />
      )}
      {label}
    </span>
  );
}

// Helper para converter status do sistema para StatusType
export function getStatusType(
  status: string
): StatusType {
  const statusMap: Record<string, StatusType> = {
    // Simulado
    ATIVO: "success",
    INATIVO: "default",
    EM_EDICAO: "pending",
    // Prova
    RASCUNHO: "pending",
    PUBLICADA: "success",
    ENCERRADA: "default",
    // Tentativa
    EM_ANDAMENTO: "loading",
    SUBMETIDA: "success",
    EXPIRADA: "error",
    // Genéricos
    aprovado: "success",
    reprovado: "error",
    pendente: "pending",
    concluido: "success",
  };

  return statusMap[status] || "default";
}

// Labels em português
export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    // Simulado
    ATIVO: "Ativo",
    INATIVO: "Inativo",
    EM_EDICAO: "Em Edição",
    // Prova
    RASCUNHO: "Rascunho",
    PUBLICADA: "Publicada",
    ENCERRADA: "Encerrada",
    // Tentativa
    EM_ANDAMENTO: "Em Andamento",
    SUBMETIDA: "Submetida",
    EXPIRADA: "Expirada",
  };

  return labelMap[status] || status;
}
