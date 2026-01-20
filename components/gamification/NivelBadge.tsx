"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, Zap, Crown, Gem, Flame, Trophy, Award, Shield, Sparkles, Skull } from "lucide-react";

interface NivelBadgeProps {
  nivel: number;
  nome: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const NIVEL_CONFIG: Record<number, { icon: typeof Star; color: string; bgColor: string }> = {
  1: { icon: Star, color: "text-gray-500", bgColor: "bg-gray-100 dark:bg-gray-800" },
  2: { icon: Sparkles, color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/30" },
  3: { icon: Zap, color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  4: { icon: Flame, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  5: { icon: Shield, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  6: { icon: Award, color: "text-indigo-500", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
  7: { icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  8: { icon: Gem, color: "text-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  9: { icon: Crown, color: "text-pink-500", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  10: { icon: Skull, color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

export function NivelBadge({
  nivel,
  nome,
  className,
  size = "md",
  showTooltip = true,
}: NivelBadgeProps) {
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG[1];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badge = (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Nível {nivel}</p>
          <p className="text-muted-foreground">{nome}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
