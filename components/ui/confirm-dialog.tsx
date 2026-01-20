"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Trash2, Info, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmVariant = "default" | "destructive" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmVariant;
  loading?: boolean;
  icon?: LucideIcon;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: LucideIcon;
    iconClassName: string;
    buttonVariant: "default" | "destructive" | "outline" | "secondary";
  }
> = {
  default: {
    icon: Info,
    iconClassName: "text-primary bg-primary/10",
    buttonVariant: "default",
  },
  destructive: {
    icon: Trash2,
    iconClassName: "text-destructive bg-destructive/10",
    buttonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-yellow-500 bg-yellow-500/10",
    buttonVariant: "default",
  },
  info: {
    icon: Info,
    iconClassName: "text-blue-500 bg-blue-500/10",
    buttonVariant: "default",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "default",
  loading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "rounded-full p-3 flex-shrink-0",
                config.iconClassName
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook para usar o dialog mais facilmente
import { useState, useCallback } from "react";

interface UseConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirmDialog(options: UseConfirmDialogOptions) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<
    (() => void | Promise<void>) | null
  >(null);

  const confirm = useCallback((onConfirm: () => void | Promise<void>) => {
    setOnConfirmCallback(() => onConfirm);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (onConfirmCallback) {
      setLoading(true);
      try {
        await onConfirmCallback();
      } finally {
        setLoading(false);
        setOpen(false);
      }
    }
  }, [onConfirmCallback]);

  const DialogComponent = (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
      loading={loading}
      onConfirm={handleConfirm}
    />
  );

  return { confirm, DialogComponent };
}
