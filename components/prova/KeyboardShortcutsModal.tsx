"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { shortcutsList } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {shortcutsList.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Pressione <kbd className="px-1 bg-muted rounded">?</kbd> ou{" "}
          <kbd className="px-1 bg-muted rounded">Esc</kbd> a qualquer momento para ver esta ajuda
        </p>
      </DialogContent>
    </Dialog>
  );
}
