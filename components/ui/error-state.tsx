"use client";

import { AlertCircle, RefreshCcw, Home, LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  className?: string;
  variant?: "default" | "inline" | "fullPage";
}

export function ErrorState({
  title = "Algo deu errado",
  message = "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
  icon: Icon = AlertCircle,
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = false,
  className,
  variant = "default",
}: ErrorStateProps) {
  const isFullPage = variant === "fullPage";
  const isInline = variant === "inline";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-in",
        isFullPage && "min-h-[calc(100vh-200px)]",
        isInline ? "py-6 px-4" : "py-12 px-4",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-destructive/10 flex items-center justify-center",
          isInline ? "p-3 mb-3" : "p-4 mb-4"
        )}
      >
        <Icon
          className={cn(
            "text-destructive",
            isInline ? "h-6 w-6" : "h-8 w-8"
          )}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          isInline ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-muted-foreground max-w-md",
          isInline ? "mt-1 text-sm" : "mt-2"
        )}
      >
        {message}
      </p>
      {(showRetry || showHome) && (
        <div className={cn("flex gap-3", isInline ? "mt-3" : "mt-4")}>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size={isInline ? "sm" : "default"}
              onClick={onRetry}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          {showHome && onGoHome && (
            <Button size={isInline ? "sm" : "default"} onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Ir para Home
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para usar em cards
interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({
  message = "Erro ao carregar dados",
  onRetry,
  className,
}: ErrorCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/20 bg-destructive/5 p-4 animate-fade-in",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium">{message}</p>
          {onRetry && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-1 text-destructive"
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mensagem de erro inline para formulários
interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      className={cn(
        "text-sm text-destructive flex items-center gap-1.5 animate-fade-in",
        className
      )}
    >
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}
