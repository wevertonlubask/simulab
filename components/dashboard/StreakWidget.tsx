"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, ChevronRight } from "lucide-react";

interface StreakWidgetProps {
  streak: number;
  xp?: number;
  xpNextLevel?: number;
  level?: number;
  ultimaConquista?: string;
  loading?: boolean;
}

export function StreakWidget({
  streak,
  xp = 0,
  xpNextLevel = 100,
  level = 1,
  ultimaConquista,
  loading = false,
}: StreakWidgetProps) {
  const progress = (xp / xpNextLevel) * 100;

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="h-8 w-8 text-white" />
            </div>
            {streak > 0 && (
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-orange-500">
                <span className="text-xs font-bold text-orange-500">{streak}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {streak > 0 ? `${streak} dias seguidos!` : "Comece sua sequência!"}
              </span>
              {streak >= 7 && <Flame className="h-4 w-4 text-orange-500 animate-pulse" />}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Nível {level}</span>
                <span className="text-muted-foreground">{xp}/{xpNextLevel} XP</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {ultimaConquista && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground truncate">{ultimaConquista}</span>
              </div>
            )}
          </div>
        </div>
        <Link
          href="/aluno/conquistas"
          className="mt-3 flex items-center justify-center gap-1 text-sm text-orange-500 hover:underline"
        >
          Ver conquistas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
