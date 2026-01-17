"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { AlternativaEditor } from "./AlternativaEditor";
import { useToast } from "@/hooks/use-toast";
import {
  questaoSchema,
  type QuestaoFormData,
  type AlternativaFormData,
} from "@/lib/validations/questao";
import { Loader2, X } from "lucide-react";
import type { Questao, Alternativa, TipoQuestao, Dificuldade } from "@prisma/client";

interface QuestaoWithAlternativas extends Questao {
  alternativas: Alternativa[];
}

interface QuestaoFormProps {
  simuladoId: string;
  questao?: QuestaoWithAlternativas;
  mode: "create" | "edit";
}

const defaultAlternativas: AlternativaFormData[] = [
  { texto: "", correta: false, ordem: 0 },
  { texto: "", correta: false, ordem: 1 },
  { texto: "", correta: false, ordem: 2 },
  { texto: "", correta: false, ordem: 3 },
];

export function QuestaoForm({ simuladoId, questao, mode }: QuestaoFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(questao?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestaoFormData>({
    resolver: zodResolver(questaoSchema),
    defaultValues: {
      tipo: questao?.tipo || "MULTIPLA_ESCOLHA_UNICA",
      enunciado: questao?.enunciado || "",
      imagemUrl: questao?.imagemUrl || "",
      explicacao: questao?.explicacao || "",
      dificuldade: questao?.dificuldade || "MEDIO",
      peso: questao?.peso || 1.0,
      tags: questao?.tags || [],
      alternativas: questao?.alternativas.map((a) => ({
        id: a.id,
        texto: a.texto,
        imagemUrl: a.imagemUrl,
        correta: a.correta,
        ordem: a.ordem,
      })) || defaultAlternativas,
    },
  });

  const tipo = watch("tipo");
  const alternativas = watch("alternativas");

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      const newTags = [...tags, trimmed];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: QuestaoFormData) => {
    setIsLoading(true);

    try {
      const url =
        mode === "create"
          ? `/api/simulados/${simuladoId}/questoes`
          : `/api/questoes/${questao?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar questão");
      }

      toast({
        title: mode === "create" ? "Questão criada!" : "Questão atualizada!",
        description:
          mode === "create"
            ? "A questão foi criada com sucesso."
            : "As alterações foram salvas.",
      });

      router.push(`/docente/simulados/${simuladoId}/questoes`);
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

  const onError = (formErrors: typeof errors) => {
    console.log("Erros de validação:", formErrors);

    // Extrair mensagem de erro mais específica
    let errorMessage = "Por favor, verifique os campos do formulário";

    if (formErrors.alternativas) {
      // Erros nas alternativas
      const altErrors = formErrors.alternativas;
      if (Array.isArray(altErrors)) {
        for (const altError of altErrors) {
          if (altError?.texto?.message) {
            errorMessage = `Alternativa: ${altError.texto.message}`;
            break;
          }
          if (altError?.imagemUrl?.message) {
            errorMessage = `Alternativa: ${altError.imagemUrl.message}`;
            break;
          }
        }
      } else if (altErrors.message) {
        errorMessage = altErrors.message;
      }
    } else {
      // Outros erros
      const firstError = Object.entries(formErrors)[0];
      if (firstError) {
        const [field, error] = firstError;
        const message = (error as { message?: string })?.message;
        if (message) {
          errorMessage = message;
        }
      }
    }

    toast({
      variant: "destructive",
      title: "Erro de validação",
      description: errorMessage,
    });
  };

  const isMultiplaEscolha =
    tipo === "MULTIPLA_ESCOLHA_UNICA" || tipo === "MULTIPLA_ESCOLHA_MULTIPLA";

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Questão *</Label>
              <Select
                value={tipo}
                onValueChange={(value: TipoQuestao) => setValue("tipo", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLA_ESCOLHA_UNICA">
                    Múltipla Escolha (Única)
                  </SelectItem>
                  <SelectItem value="MULTIPLA_ESCOLHA_MULTIPLA">
                    Múltipla Escolha (Múltipla)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dificuldade *</Label>
              <Select
                value={watch("dificuldade")}
                onValueChange={(value: Dificuldade) =>
                  setValue("dificuldade", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FACIL">Fácil</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="DIFICIL">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peso">Peso</Label>
              <Input
                id="peso"
                type="number"
                step="0.5"
                min="0.5"
                max="5"
                {...register("peso", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.peso && (
                <p className="text-sm text-destructive">{errors.peso.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Digite e pressione Enter"
                  disabled={isLoading || tags.length >= 10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={isLoading || tags.length >= 10}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enunciado */}
        <Card>
          <CardHeader>
            <CardTitle>Enunciado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enunciado">Texto da questão *</Label>
              <Textarea
                id="enunciado"
                rows={6}
                placeholder="Digite o enunciado da questão..."
                {...register("enunciado")}
                disabled={isLoading}
              />
              {errors.enunciado && (
                <p className="text-sm text-destructive">
                  {errors.enunciado.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imagem (opcional)</Label>
              <ImageUpload
                value={watch("imagemUrl") || null}
                onChange={(url) => setValue("imagemUrl", url || "")}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alternativas */}
      {isMultiplaEscolha && (
        <Card>
          <CardHeader>
            <CardTitle>Alternativas</CardTitle>
          </CardHeader>
          <CardContent>
            <AlternativaEditor
              alternativas={alternativas}
              tipo={tipo as "MULTIPLA_ESCOLHA_UNICA" | "MULTIPLA_ESCOLHA_MULTIPLA"}
              onChange={(alts) => setValue("alternativas", alts)}
              disabled={isLoading}
            />
            {errors.alternativas && (
              <p className="text-sm text-destructive mt-2">
                {errors.alternativas.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Explicação */}
      <Card>
        <CardHeader>
          <CardTitle>Explicação (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Explique por que a resposta está correta..."
            {...register("explicacao")}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Esta explicação será exibida ao aluno após responder a questão
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Questão" : "Salvar Alterações"}
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
