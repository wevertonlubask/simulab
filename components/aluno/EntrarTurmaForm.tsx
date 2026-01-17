"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function EntrarTurmaForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const codigoTrimmed = codigo.trim().toUpperCase();

    if (!codigoTrimmed) {
      toast.error("Digite o código da turma");
      return;
    }

    if (codigoTrimmed.length !== 6) {
      toast.error("O código deve ter 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/turmas/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoTrimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao entrar na turma");
      }

      toast.success(`Você entrou na turma "${data.turma.nome}"!`);
      setCodigo("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao entrar na turma"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <Input
        placeholder="Ex: ABC123"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        maxLength={6}
        className="uppercase tracking-widest font-mono text-center"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || codigo.length !== 6}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Entrar
      </Button>
    </form>
  );
}
