"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Terminal } from "lucide-react";

interface QuestaoComandoProps {
  respostaAtual?: { comando?: string } | null;
  onChange: (resposta: { comando: string }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function QuestaoComando({
  respostaAtual,
  onChange,
  disabled = false,
  placeholder = "Digite o comando aqui...",
}: QuestaoComandoProps) {
  const [comando, setComando] = useState(respostaAtual?.comando || "");

  useEffect(() => {
    if (respostaAtual?.comando) {
      setComando(respostaAtual.comando);
    }
  }, [respostaAtual]);

  const handleChange = (valor: string) => {
    setComando(valor);
    onChange({ comando: valor });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-zinc-400 mb-3">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-mono">Terminal</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500 font-mono select-none">$</span>
          <Textarea
            value={comando}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 min-h-[60px] resize-none bg-transparent border-none focus-visible:ring-0 font-mono text-green-400 placeholder:text-zinc-600"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Digite o comando exatamente como seria executado no terminal.
      </p>
    </div>
  );
}
