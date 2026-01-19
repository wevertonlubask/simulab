"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Infinity } from "lucide-react";

const provaConfigSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().max(1000).optional().nullable(),
  tempoLimite: z.coerce.number().int().min(1).max(480).optional().nullable(),
  tentativasMax: z.coerce.number().int().min(1).max(100).optional().nullable(),
  intervaloTentativas: z.coerce.number().int().min(0).max(168).default(0),
  notaMinima: z.coerce.number().min(0).max(100).default(70),
  notaConsiderada: z.enum(["MAIOR", "ULTIMA"]).default("MAIOR"),
  mostrarResultado: z.enum(["IMEDIATO", "DATA", "NUNCA"]).default("IMEDIATO"),
  dataResultado: z.string().optional().nullable(),
  embaralharQuestoes: z.boolean().default(true),
  embaralharAlternativas: z.boolean().default(true),
});

type ProvaConfigData = z.infer<typeof provaConfigSchema>;

interface ProvaConfigFormProps {
  prova: {
    id: string;
    nome: string;
    descricao: string | null;
    tempoLimite: number | null;
    tentativasMax: number | null;
    intervaloTentativas: number;
    notaMinima: number;
    notaConsiderada: "MAIOR" | "ULTIMA";
    mostrarResultado: "IMEDIATO" | "DATA" | "NUNCA";
    dataResultado: Date | null;
    embaralharQuestoes: boolean;
    embaralharAlternativas: boolean;
  };
}

export function ProvaConfigForm({ prova }: ProvaConfigFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tentativasIlimitadas, setTentativasIlimitadas] = useState(prova.tentativasMax === null);
  const [tempoIlimitado, setTempoIlimitado] = useState(prova.tempoLimite === null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProvaConfigData>({
    resolver: zodResolver(provaConfigSchema),
    defaultValues: {
      nome: prova.nome,
      descricao: prova.descricao,
      tempoLimite: prova.tempoLimite,
      tentativasMax: prova.tentativasMax,
      intervaloTentativas: prova.intervaloTentativas,
      notaMinima: prova.notaMinima,
      notaConsiderada: prova.notaConsiderada,
      mostrarResultado: prova.mostrarResultado,
      dataResultado: prova.dataResultado
        ? new Date(prova.dataResultado).toISOString().slice(0, 16)
        : null,
      embaralharQuestoes: prova.embaralharQuestoes,
      embaralharAlternativas: prova.embaralharAlternativas,
    },
  });

  const mostrarResultado = watch("mostrarResultado");

  const onSubmit = async (data: ProvaConfigData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/provas/${prova.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tempoLimite: tempoIlimitado ? null : data.tempoLimite,
          tentativasMax: tentativasIlimitadas ? null : data.tentativasMax,
          dataResultado: data.mostrarResultado === "DATA" && data.dataResultado
            ? new Date(data.dataResultado).toISOString()
            : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar configurações");
      }

      toast.success("Configurações salvas com sucesso!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Nome e descrição da prova</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Prova *</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Ex: Prova Final - AWS Cloud Practitioner"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição da prova..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Tempo e Tentativas</CardTitle>
          <CardDescription>Configure limites de tempo e tentativas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tempo Limite */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tempo Limite</Label>
                <p className="text-sm text-muted-foreground">
                  Tempo máximo para realizar a prova
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tempoIlimitado"
                  checked={tempoIlimitado}
                  onCheckedChange={(checked) => {
                    setTempoIlimitado(checked as boolean);
                    if (checked) {
                      setValue("tempoLimite", null);
                    } else {
                      setValue("tempoLimite", 60);
                    }
                  }}
                />
                <Label htmlFor="tempoIlimitado" className="flex items-center gap-1 cursor-pointer">
                  <Infinity className="h-4 w-4" />
                  Sem limite
                </Label>
              </div>
            </div>
            {!tempoIlimitado && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register("tempoLimite")}
                  min={1}
                  max={480}
                  className="w-32"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
            )}
          </div>

          {/* Tentativas Máximas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Número de Tentativas</Label>
                <p className="text-sm text-muted-foreground">
                  Quantas vezes o aluno pode refazer a prova
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tentativasIlimitadas"
                  checked={tentativasIlimitadas}
                  onCheckedChange={(checked) => {
                    setTentativasIlimitadas(checked as boolean);
                    if (checked) {
                      setValue("tentativasMax", null);
                    } else {
                      setValue("tentativasMax", 3);
                    }
                  }}
                />
                <Label htmlFor="tentativasIlimitadas" className="flex items-center gap-1 cursor-pointer">
                  <Infinity className="h-4 w-4" />
                  Ilimitadas
                </Label>
              </div>
            </div>
            {!tentativasIlimitadas && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register("tentativasMax")}
                  min={1}
                  max={100}
                  className="w-32"
                />
                <span className="text-muted-foreground">tentativa(s)</span>
              </div>
            )}
          </div>

          {/* Intervalo entre Tentativas */}
          <div className="space-y-2">
            <Label>Intervalo entre Tentativas</Label>
            <p className="text-sm text-muted-foreground">
              Tempo mínimo de espera entre tentativas
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                {...register("intervaloTentativas")}
                min={0}
                max={168}
                className="w-32"
              />
              <span className="text-muted-foreground">horas (0 = sem intervalo)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Nota */}
      <Card>
        <CardHeader>
          <CardTitle>Nota e Resultado</CardTitle>
          <CardDescription>Configure critérios de avaliação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nota Mínima para Aprovação</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...register("notaMinima")}
                  min={0}
                  max={100}
                  className="w-32"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nota Considerada</Label>
              <Select
                value={watch("notaConsiderada")}
                onValueChange={(value) => setValue("notaConsiderada", value as "MAIOR" | "ULTIMA")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIOR">Maior nota</SelectItem>
                  <SelectItem value="ULTIMA">Última tentativa</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {watch("notaConsiderada") === "MAIOR"
                  ? "A maior nota entre todas as tentativas será considerada"
                  : "A nota da última tentativa será considerada"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mostrar Resultado</Label>
            <Select
              value={watch("mostrarResultado")}
              onValueChange={(value) => setValue("mostrarResultado", value as "IMEDIATO" | "DATA" | "NUNCA")}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMEDIATO">Imediatamente após submissão</SelectItem>
                <SelectItem value="DATA">Em uma data específica</SelectItem>
                <SelectItem value="NUNCA">Nunca mostrar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mostrarResultado === "DATA" && (
            <div className="space-y-2">
              <Label htmlFor="dataResultado">Data de Liberação do Resultado</Label>
              <Input
                id="dataResultado"
                type="datetime-local"
                {...register("dataResultado")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opções de Embaralhamento */}
      <Card>
        <CardHeader>
          <CardTitle>Embaralhamento</CardTitle>
          <CardDescription>Configure a aleatorização das questões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Embaralhar Questões</Label>
              <p className="text-sm text-muted-foreground">
                A ordem das questões será diferente para cada tentativa
              </p>
            </div>
            <Switch
              checked={watch("embaralharQuestoes")}
              onCheckedChange={(checked) => setValue("embaralharQuestoes", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Embaralhar Alternativas</Label>
              <p className="text-sm text-muted-foreground">
                A ordem das alternativas será diferente para cada questão
              </p>
            </div>
            <Switch
              checked={watch("embaralharAlternativas")}
              onCheckedChange={(checked) => setValue("embaralharAlternativas", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
