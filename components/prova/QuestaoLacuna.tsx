"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface QuestaoLacunaProps {
  enunciado: string; // Enunciado com placeholders [___]
  respostaAtual?: { lacunas?: Record<string, string> } | null;
  onChange: (resposta: { lacunas: Record<string, string> }) => void;
  disabled?: boolean;
}

export function QuestaoLacuna({
  enunciado,
  respostaAtual,
  onChange,
  disabled = false,
}: QuestaoLacunaProps) {
  const [lacunas, setLacunas] = useState<Record<string, string>>(
    respostaAtual?.lacunas || {}
  );

  useEffect(() => {
    if (respostaAtual?.lacunas) {
      setLacunas(respostaAtual.lacunas);
    }
  }, [respostaAtual]);

  // Encontrar todas as lacunas no enunciado
  const partes = enunciado.split(/(\[___\])/g);
  let lacunaIndex = 0;

  const handleChange = (index: string, valor: string) => {
    const novasLacunas = { ...lacunas, [index]: valor };
    setLacunas(novasLacunas);
    onChange({ lacunas: novasLacunas });
  };

  return (
    <div className="space-y-4">
      <div className="text-lg leading-relaxed">
        {partes.map((parte, idx) => {
          if (parte === "[___]") {
            const currentIndex = lacunaIndex.toString();
            lacunaIndex++;
            return (
              <Input
                key={idx}
                value={lacunas[currentIndex] || ""}
                onChange={(e) => handleChange(currentIndex, e.target.value)}
                disabled={disabled}
                className="inline-block w-32 mx-1 text-center"
                placeholder="..."
              />
            );
          }
          return <span key={idx}>{parte}</span>;
        })}
      </div>
    </div>
  );
}
