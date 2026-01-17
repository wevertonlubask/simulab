"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoriaSelect } from "./CategoriaSelect";
import { SubcategoriaSelect } from "./SubcategoriaSelect";
import { useToast } from "@/hooks/use-toast";
import { simuladoSchema, type SimuladoFormData } from "@/lib/validations/simulado";
import { Loader2 } from "lucide-react";
import type { Simulado } from "@prisma/client";

interface SimuladoFormProps {
  simulado?: Simulado;
  mode: "create" | "edit";
}

export function SimuladoForm({ simulado, mode }: SimuladoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SimuladoFormData>({
    resolver: zodResolver(simuladoSchema),
    defaultValues: {
      nome: simulado?.nome || "",
      descricao: simulado?.descricao || "",
      categoria: simulado?.categoria || "",
      subcategoria: simulado?.subcategoria || "",
      imagemUrl: simulado?.imagemUrl || "",
    },
  });

  const categoria = watch("categoria");

  const onSubmit = async (data: SimuladoFormData) => {
    setIsLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/simulados"
          : `/api/simulados/${simulado?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar simulado");
      }

      toast({
        title: mode === "create" ? "Simulado criado!" : "Simulado atualizado!",
        description:
          mode === "create"
            ? "Seu simulado foi criado com sucesso."
            : "As alterações foram salvas.",
      });

      router.push(`/docente/simulados/${result.id}`);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao salvar.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Simulado *</Label>
        <Input
          id="nome"
          placeholder="Ex: CCNA 200-301 - Fundamentos"
          {...register("nome")}
          disabled={isLoading}
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva o conteúdo e objetivos deste simulado..."
          rows={3}
          {...register("descricao")}
          disabled={isLoading}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Categoria *</Label>
          <CategoriaSelect
            value={categoria}
            onValueChange={(value) => {
              setValue("categoria", value);
              setValue("subcategoria", "");
            }}
            disabled={isLoading}
          />
          {errors.categoria && (
            <p className="text-sm text-destructive">{errors.categoria.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Subcategoria</Label>
          <SubcategoriaSelect
            categoria={categoria}
            value={watch("subcategoria") || undefined}
            onValueChange={(value) => setValue("subcategoria", value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imagemUrl">URL da Imagem (opcional)</Label>
        <Input
          id="imagemUrl"
          type="url"
          placeholder="https://..."
          {...register("imagemUrl")}
          disabled={isLoading}
        />
        {errors.imagemUrl && (
          <p className="text-sm text-destructive">{errors.imagemUrl.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Simulado" : "Salvar Alterações"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
