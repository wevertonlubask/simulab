"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  streak: number;
  maiorStreak?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

export function StreakCounter({
  streak,
  maiorStreak,
  className,
  size = "md",
  showLabel = true,
  animated = true,
}: StreakCounterProps) {
  const sizeClasses = {
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-lg gap-2",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const getStreakColor = () => {
    if (streak >= 30) return "text-red-500";
    if (streak >= 7) return "text-orange-500";
    if (streak >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getFlameCount = () => {
    if (streak >= 100) return 4;
    if (streak >= 30) return 3;
    if (streak >= 7) return 2;
    return 1;
  };

  const content = (
    <div
      className={cn(
        "inline-flex items-center font-semibold",
        sizeClasses[size],
        getStreakColor(),
        className
      )}
    >
      <div className={cn("flex", animated && streak > 0 && "animate-pulse")}>
        {Array.from({ length: getFlameCount() }).map((_, i) => (
          <Flame
            key={i}
            className={cn(
              iconSizes[size],
              i > 0 && "-ml-1",
              streak === 0 && "opacity-30"
            )}
          />
        ))}
      </div>
      <span>{streak}</span>
      {showLabel && <span className="text-muted-foreground font-normal">dias</span>}
    </div>
  );

  if (maiorStreak === undefined) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>{streak} dias seguidos estudando</p>
          {maiorStreak > streak && (
            <p className="text-muted-foreground">Recorde: {maiorStreak} dias</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
