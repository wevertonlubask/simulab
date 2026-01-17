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
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface IniciarProvaButtonProps {
  provaId: string;
  tentativaId?: string;
  label: string;
  totalQuestoes?: number;
}

export function IniciarProvaButton({
  provaId,
  tentativaId,
  label,
  totalQuestoes,
}: IniciarProvaButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Se já tem tentativa em andamento, apenas redireciona
      if (tentativaId) {
        router.push(`/aluno/provas/${provaId}/realizar/${tentativaId}`);
        return;
      }

      // Criar nova tentativa
      const response = await fetch(`/api/aluno/provas/${provaId}/iniciar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalQuestoes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao iniciar prova");
      }

      // Redireciona para a página da prova
      router.push(`/aluno/provas/${provaId}/realizar/${data.tentativaId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao iniciar prova"
      );
      setLoading(false);
    }
  };

  const handleClick = () => {
    // Se já tem tentativa em andamento, vai direto
    if (tentativaId) {
      handleStart();
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <>
      <Button className="w-full" onClick={handleClick} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {label}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a iniciar uma nova tentativa. Uma vez iniciada,
              o cronômetro começará a contar (se houver limite de tempo).
              <br />
              <br />
              Certifique-se de ter tempo disponível e uma conexão estável antes
              de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
