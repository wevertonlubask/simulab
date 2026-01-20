"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsOptions {
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onSelectAlternative?: (index: number) => void;
  onToggleReview?: () => void;
  onSubmit?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNavigateLeft,
  onNavigateRight,
  onSelectAlternative,
  onToggleReview,
  onSubmit,
  onShowHelp,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorar se estiver em um input, textarea ou contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          onNavigateLeft?.();
          break;

        case "ArrowRight":
          event.preventDefault();
          onNavigateRight?.();
          break;

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            onSelectAlternative?.(index);
          }
          break;

        case "m":
        case "M":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onToggleReview?.();
          }
          break;

        case "Enter":
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            // Enter avança para próxima questão
            event.preventDefault();
            onNavigateRight?.();
          } else if (event.ctrlKey || event.metaKey) {
            // Ctrl+Enter submete a prova
            event.preventDefault();
            onSubmit?.();
          }
          break;

        case "?":
          event.preventDefault();
          onShowHelp?.();
          break;

        case "Escape":
          event.preventDefault();
          onShowHelp?.();
          break;
      }
    },
    [
      enabled,
      onNavigateLeft,
      onNavigateRight,
      onSelectAlternative,
      onToggleReview,
      onSubmit,
      onShowHelp,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Lista de atalhos disponíveis para exibição
export const shortcutsList = [
  { key: "← →", description: "Navegar entre questões" },
  { key: "1-6", description: "Selecionar alternativa (A-F)" },
  { key: "M", description: "Marcar para revisão" },
  { key: "Enter", description: "Próxima questão" },
  { key: "Ctrl+Enter", description: "Enviar prova" },
  { key: "? / Esc", description: "Mostrar atalhos" },
];
