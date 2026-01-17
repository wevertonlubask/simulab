"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const turmaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  descricao: z.string().max(500).optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

interface TurmaFormProps {
  turma?: {
    id: string;
    nome: string;
    descricao: string | null;
  };
  onSuccess?: (turma: { id: string; nome: string }) => void;
  onCancel?: () => void;
}

export function TurmaForm({ turma, onSuccess, onCancel }: TurmaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!turma;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      nome: turma?.nome || "",
      descricao: turma?.descricao || "",
    },
  });

  const onSubmit = async (data: TurmaFormData) => {
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/turmas/${turma.id}` : "/api/turmas";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar turma");
      }

      toast({
        title: isEditing ? "Turma atualizada" : "Turma criada",
        description: isEditing
          ? "A turma foi atualizada com sucesso."
          : `Turma criada com código: ${result.turma.codigo}`,
      });

      onSuccess?.(result.turma);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao salvar turma",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Turma</Label>
        <Input
          id="nome"
          placeholder="Ex: Turma CCNA 2024.1"
          {...register("nome")}
          disabled={isLoading}
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva brevemente a turma..."
          rows={3}
          {...register("descricao")}
          disabled={isLoading}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Salvar" : "Criar Turma"}
        </Button>
      </div>
    </form>
  );
}
