"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

interface Conquista {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  xpBonus: number;
}

interface ConquistaUnlockedModalProps {
  conquistas: Conquista[];
  onClose: () => void;
}

export function ConquistaUnlockedModal({
  conquistas,
  onClose,
}: ConquistaUnlockedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(conquistas.length > 0);

  const conquista = conquistas[currentIndex];

  useEffect(() => {
    if (conquistas.length > 0 && isOpen) {
      // Disparar confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const colors = ["#FFD700", "#FFA500", "#FF6347", "#9400D3", "#00CED1"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      // Tocar som (opcional)
      try {
        const audio = new Audio("/sounds/achievement.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignora erro se não houver interação
      } catch (e) {
        // Ignora erro de áudio
      }
    }
  }, [conquistas.length, isOpen, currentIndex]);

  const handleNext = () => {
    if (currentIndex < conquistas.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
      onClose();
    }
  };

  if (!conquista) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsOpen(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            Nova Conquista Desbloqueada!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Ícone da conquista com animação */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-5xl animate-bounce shadow-lg">
              {conquista.icone}
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/50 to-amber-500/50 animate-ping" />
          </div>

          {/* Nome da conquista */}
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
            {conquista.nome}
          </h2>

          {/* Descrição */}
          <p className="text-center text-muted-foreground">
            {conquista.descricao}
          </p>

          {/* XP Bônus */}
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-lg px-4 py-1">
            +{conquista.xpBonus} XP
          </Badge>

          {/* Contador se houver múltiplas conquistas */}
          {conquistas.length > 1 && (
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} de {conquistas.length} conquistas
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg" className="w-full max-w-xs">
            {currentIndex < conquistas.length - 1 ? "Ver Próxima" : "Fechar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
