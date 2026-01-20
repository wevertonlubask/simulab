"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, Loader2 } from "lucide-react";

interface DuplicarSimuladoButtonProps {
  simuladoId: string;
  simuladoNome: string;
}

export function DuplicarSimuladoButton({
  simuladoId,
  simuladoNome,
}: DuplicarSimuladoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDuplicar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/simulados/${simuladoId}/duplicar`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao duplicar simulado");
      }

      toast.success(data.message);
      router.push(`/docente/simulados/${data.simulado.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao duplicar simulado");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicar Simulado</AlertDialogTitle>
          <AlertDialogDescription>
            Isso criará uma cópia completa do simulado &quot;{simuladoNome}&quot;, incluindo
            todas as questões e configurações.
            <br /><br />
            O novo simulado terá status &quot;Em Edição&quot; e poderá ser modificado
            independentemente do original.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDuplicar} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Duplicar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
