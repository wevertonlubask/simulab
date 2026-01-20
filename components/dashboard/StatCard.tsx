"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
  iconClassName?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendLabel,
  loading = false,
  className,
  iconClassName,
  delay = 0,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform hover:scale-110",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-bold tabular-nums">{value}</span>
        </div>
        {(description || trend !== undefined) && (
          <div className="mt-2 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={cn(
                  "flex items-center text-sm font-medium transition-colors",
                  trend > 0
                    ? "text-green-500"
                    : trend < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : trend < 0 ? (
                  <TrendingDown className="mr-1 h-4 w-4" />
                ) : null}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            {description && (
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            )}
            {trendLabel && (
              <span className="text-sm text-muted-foreground">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
