"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Loader2 } from "lucide-react";

interface DuplicarProvaButtonProps {
  provaId: string;
  provaNome: string;
  simuladoId: string;
}

export function DuplicarProvaButton({
  provaId,
  provaNome,
  simuladoId,
}: DuplicarProvaButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"mesmas_questoes" | "novo_sorteio">("mesmas_questoes");

  const handleDuplicar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/provas/${provaId}/duplicar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao duplicar prova");
      }

      toast.success(data.message);
      router.push(`/docente/simulados/${simuladoId}/provas`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao duplicar prova");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar Prova</DialogTitle>
          <DialogDescription>
            Escolha como deseja duplicar a prova &quot;{provaNome}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={modo}
            onValueChange={(v) => setModo(v as typeof modo)}
            className="space-y-3"
          >
            <Label
              htmlFor="mesmas_questoes"
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
            >
              <RadioGroupItem value="mesmas_questoes" id="mesmas_questoes" className="mt-1" />
              <div>
                <p className="font-medium">Mesmas questões</p>
                <p className="text-sm text-muted-foreground">
                  Cria uma cópia exata com as mesmas questões na mesma ordem
                </p>
              </div>
            </Label>

            <Label
              htmlFor="novo_sorteio"
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
            >
              <RadioGroupItem value="novo_sorteio" id="novo_sorteio" className="mt-1" />
              <div>
                <p className="font-medium">Novo sorteio</p>
                <p className="text-sm text-muted-foreground">
                  Mantém as configurações mas sorteia novas questões aleatoriamente
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleDuplicar} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Duplicar Prova
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
