"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ImportProgressBarProps {
  current: number;
  total: number;
  status: string;
}

export function ImportProgressBar({ current, total, status }: ImportProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">{status}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current} de {total} ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
