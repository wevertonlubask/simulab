"use client";

import { CheckCircle, LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface SuccessStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "inline" | "card";
}

export function SuccessState({
  title = "Sucesso!",
  message,
  icon: Icon = CheckCircle,
  action,
  className,
  variant = "default",
}: SuccessStateProps) {
  const isInline = variant === "inline";
  const isCard = variant === "card";

  if (isCard) {
    return (
      <div
        className={cn(
          "rounded-lg border border-green-500/20 bg-green-500/5 p-4 animate-fade-in",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-600 font-medium">{title}</p>
            {message && (
              <p className="text-sm text-green-600/80 mt-0.5">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-bounce-in",
        isInline ? "py-6 px-4" : "py-12 px-4",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-green-500/10 flex items-center justify-center",
          isInline ? "p-3 mb-3" : "p-4 mb-4"
        )}
      >
        <Icon
          className={cn(
            "text-green-500",
            isInline ? "h-6 w-6" : "h-10 w-10"
          )}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          isInline ? "text-base" : "text-xl"
        )}
      >
        {title}
      </h3>
      {message && (
        <p
          className={cn(
            "text-muted-foreground max-w-md",
            isInline ? "mt-1 text-sm" : "mt-2"
          )}
        >
          {message}
        </p>
      )}
      {action && (
        <Button
          size={isInline ? "sm" : "default"}
          className={isInline ? "mt-3" : "mt-4"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Mensagem de sucesso inline para formulários
interface FormSuccessProps {
  message?: string;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "text-sm text-green-600 flex items-center gap-1.5 animate-fade-in",
        className
      )}
    >
      <CheckCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}
