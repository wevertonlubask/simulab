"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

interface CardSkeletonProps {
  className?: string;
  lines?: number;
  hasHeader?: boolean;
  hasFooter?: boolean;
}

export function CardSkeleton({
  className,
  lines = 3,
  hasHeader = true,
  hasFooter = false,
}: CardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {hasHeader && (
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
      )}
      <CardContent className={cn(!hasHeader && "pt-6")}>
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${85 - i * 15}%` }}
            />
          ))}
        </div>
        {hasFooter && (
          <div className="flex justify-end gap-2 mt-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-md border", className)}>
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4"
                style={{ width: `${100 / columns}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  className?: string;
  itemClassName?: string;
}

export function ListSkeleton({
  items = 5,
  className,
  itemClassName,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border bg-card",
            itemClassName
          )}
        >
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  className?: string;
  type?: "bar" | "line" | "pie";
}

export function ChartSkeleton({
  className,
  type = "bar",
}: ChartSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-around gap-2">
          {type === "bar" &&
            Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-8 rounded-t"
                style={{ height: `${30 + Math.random() * 70}%` }}
              />
            ))}
          {type === "line" && (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          {type === "pie" && (
            <div className="flex items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
