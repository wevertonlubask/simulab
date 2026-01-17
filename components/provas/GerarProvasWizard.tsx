"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  FileQuestion,
  Settings,
  Percent,
  Eye,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GerarProvasWizardProps {
  simuladoId: string;
  simuladoNome: string;
}

interface PreviewData {
  possibleProvas: number;
  totalQuestoesDisponiveis: number;
  questoesPorDificuldade: {
    FACIL: number;
    MEDIO: number;
    DIFICIL: number;
  };
  questoesRestantes: number;
}

const STEPS = [
  { id: 1, title: "Quantidade", icon: FileQuestion },
  { id: 2, title: "Filtros", icon: Settings },
  { id: 3, title: "Percentuais", icon: Percent },
  { id: 4, title: "Preview", icon: Eye },
  { id: 5, title: "Gerar", icon: Sparkles },
];

const DIFICULDADE_OPTIONS = [
  { value: "FACIL", label: "Fácil" },
  { value: "MEDIO", label: "Médio" },
  { value: "DIFICIL", label: "Difícil" },
];

export function GerarProvasWizard({ simuladoId, simuladoNome }: GerarProvasWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [questoesPorProva, setQuestoesPorProva] = useState(10);
  const [quantidadeProvas, setQuantidadeProvas] = useState(1);
  const [dificuldadesFiltro, setDificuldadesFiltro] = useState<string[]>([]);
  const [usarPercentuais, setUsarPercentuais] = useState(false);
  const [percentuais, setPercentuais] = useState({
    FACIL: 30,
    MEDIO: 50,
    DIFICIL: 20,
  });
  const [embaralharQuestoes, setEmbaralharQuestoes] = useState(true);
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState(true);

  // Fetch preview when reaching step 4
  useEffect(() => {
    if (currentStep === 4) {
      fetchPreview();
    }
  }, [currentStep]);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const params = new URLSearchParams();
      params.set("questoesPorProva", questoesPorProva.toString());
      if (dificuldadesFiltro.length > 0) {
        params.set("dificuldades", dificuldadesFiltro.join(","));
      }
      if (usarPercentuais) {
        params.set("percentualFacil", percentuais.FACIL.toString());
        params.set("percentualMedio", percentuais.MEDIO.toString());
        params.set("percentualDificil", percentuais.DIFICIL.toString());
      }

      const response = await fetch(
        `/api/simulados/${simuladoId}/preview-geracao?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar preview");
      }

      setPreview(data);

      // Ajustar quantidade de provas se necessário
      if (quantidadeProvas > data.possibleProvas) {
        setQuantidadeProvas(Math.max(1, data.possibleProvas));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar preview",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleGerarProvas = async () => {
    setIsLoading(true);
    try {
      const body = {
        questoesPorProva,
        quantidadeProvas,
        dificuldades: dificuldadesFiltro.length > 0 ? dificuldadesFiltro : undefined,
        percentuais: usarPercentuais ? percentuais : undefined,
        embaralharQuestoes,
        embaralharAlternativas,
      };

      const response = await fetch(`/api/simulados/${simuladoId}/gerar-provas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar provas");
      }

      toast({
        title: "Provas geradas!",
        description: `${data.provasGeradas} prova(s) criada(s) com sucesso.`,
      });

      router.push(`/docente/simulados/${simuladoId}/provas`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao gerar provas",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDificuldadeToggle = (value: string) => {
    setDificuldadesFiltro((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : [...prev, value]
    );
  };

  const handlePercentualChange = (dificuldade: keyof typeof percentuais, value: number) => {
    const others = Object.keys(percentuais).filter((k) => k !== dificuldade) as Array<keyof typeof percentuais>;
    const remaining = 100 - value;
    const currentOthersTotal = others.reduce((sum, k) => sum + percentuais[k], 0);

    if (currentOthersTotal === 0) {
      // Distribute equally among others
      const each = Math.floor(remaining / others.length);
      setPercentuais({
        ...percentuais,
        [dificuldade]: value,
        [others[0]]: each,
        [others[1]]: remaining - each,
      });
    } else {
      // Adjust proportionally
      const ratio = remaining / currentOthersTotal;
      setPercentuais({
        ...percentuais,
        [dificuldade]: value,
        [others[0]]: Math.round(percentuais[others[0]] * ratio),
        [others[1]]: remaining - Math.round(percentuais[others[0]] * ratio),
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return questoesPorProva >= 5 && questoesPorProva <= 100;
      case 2:
        return true; // Filters are optional
      case 3:
        return !usarPercentuais || (percentuais.FACIL + percentuais.MEDIO + percentuais.DIFICIL === 100);
      case 4:
        return preview && preview.possibleProvas > 0 && quantidadeProvas > 0;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="questoesPorProva">Questões por prova</Label>
              <Input
                id="questoesPorProva"
                type="number"
                min={5}
                max={100}
                value={questoesPorProva}
                onChange={(e) => setQuestoesPorProva(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Cada prova terá exatamente {questoesPorProva} questões selecionadas aleatoriamente.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="embaralharQuestoes"
                  checked={embaralharQuestoes}
                  onCheckedChange={(checked) => setEmbaralharQuestoes(checked as boolean)}
                />
                <Label htmlFor="embaralharQuestoes" className="cursor-pointer">
                  Embaralhar ordem das questões
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="embaralharAlternativas"
                  checked={embaralharAlternativas}
                  onCheckedChange={(checked) => setEmbaralharAlternativas(checked as boolean)}
                />
                <Label htmlFor="embaralharAlternativas" className="cursor-pointer">
                  Embaralhar ordem das alternativas
                </Label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Filtrar por dificuldade (opcional)</Label>
              <p className="text-sm text-muted-foreground">
                Selecione as dificuldades que deseja incluir. Se nenhuma for selecionada, todas serão consideradas.
              </p>
              <div className="flex flex-wrap gap-2">
                {DIFICULDADE_OPTIONS.map((option) => (
                  <Badge
                    key={option.value}
                    variant={dificuldadesFiltro.includes(option.value) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => handleDificuldadeToggle(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usarPercentuais"
                checked={usarPercentuais}
                onCheckedChange={(checked) => setUsarPercentuais(checked as boolean)}
              />
              <Label htmlFor="usarPercentuais" className="cursor-pointer">
                Definir percentuais por dificuldade
              </Label>
            </div>

            {usarPercentuais && (
              <div className="space-y-6 rounded-lg border p-4">
                {DIFICULDADE_OPTIONS.map((option) => (
                  <div key={option.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{option.label}</Label>
                      <span className="text-sm font-medium">
                        {percentuais[option.value as keyof typeof percentuais]}%
                      </span>
                    </div>
                    <Slider
                      value={[percentuais[option.value as keyof typeof percentuais]]}
                      onValueChange={([value]) =>
                        handlePercentualChange(option.value as keyof typeof percentuais, value)
                      }
                      max={100}
                      step={5}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-md bg-muted p-3">
                  <span className="text-sm font-medium">Total</span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      percentuais.FACIL + percentuais.MEDIO + percentuais.DIFICIL === 100
                        ? "text-green-600"
                        : "text-destructive"
                    )}
                  >
                    {percentuais.FACIL + percentuais.MEDIO + percentuais.DIFICIL}%
                  </span>
                </div>
              </div>
            )}

            {!usarPercentuais && (
              <p className="text-sm text-muted-foreground">
                Sem percentuais definidos, as questões serão selecionadas aleatoriamente independente da dificuldade.
              </p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : preview ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Questões disponíveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {preview.totalQuestoesDisponiveis}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Provas possíveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        {preview.possibleProvas}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <Label>Distribuição por dificuldade</Label>
                  <div className="space-y-2">
                    {DIFICULDADE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center justify-between">
                        <span className="text-sm">{option.label}</span>
                        <Badge variant="outline">
                          {preview.questoesPorDificuldade[option.value as keyof typeof preview.questoesPorDificuldade]} questões
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {preview.possibleProvas > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="quantidadeProvas">
                      Quantidade de provas a gerar
                    </Label>
                    <Input
                      id="quantidadeProvas"
                      type="number"
                      min={1}
                      max={preview.possibleProvas}
                      value={quantidadeProvas}
                      onChange={(e) =>
                        setQuantidadeProvas(
                          Math.min(Number(e.target.value), preview.possibleProvas)
                        )
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Máximo: {preview.possibleProvas} prova(s) com {questoesPorProva} questões cada.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-4 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Questões insuficientes</p>
                      <p className="text-sm">
                        Não há questões suficientes para gerar uma prova com {questoesPorProva} questões.
                        Ajuste os filtros ou adicione mais questões.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <h4 className="mb-4 font-medium">Resumo da geração</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Provas a gerar</dt>
                  <dd className="font-medium">{quantidadeProvas}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Questões por prova</dt>
                  <dd className="font-medium">{questoesPorProva}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Embaralhar questões</dt>
                  <dd className="font-medium">{embaralharQuestoes ? "Sim" : "Não"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Embaralhar alternativas</dt>
                  <dd className="font-medium">{embaralharAlternativas ? "Sim" : "Não"}</dd>
                </div>
                {dificuldadesFiltro.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dificuldades</dt>
                    <dd className="font-medium">{dificuldadesFiltro.join(", ")}</dd>
                  </div>
                )}
                {usarPercentuais && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Percentuais</dt>
                    <dd className="font-medium">
                      F: {percentuais.FACIL}% | M: {percentuais.MEDIO}% | D: {percentuais.DIFICIL}%
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex items-center gap-2 rounded-md bg-primary/10 p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Pronto para gerar!</p>
                <p className="text-sm text-muted-foreground">
                  Clique em &quot;Gerar Provas&quot; para criar {quantidadeProvas} prova(s).
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  currentStep > step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary bg-background text-primary"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12 sm:w-20 lg:w-32",
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Defina a quantidade de questões por prova"}
            {currentStep === 2 && "Aplique filtros opcionais para a seleção de questões"}
            {currentStep === 3 && "Defina percentuais por nível de dificuldade (opcional)"}
            {currentStep === 4 && "Visualize e confirme a quantidade de provas a gerar"}
            {currentStep === 5 && "Confirme os dados e gere as provas"}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canProceed()}
          >
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleGerarProvas} disabled={isLoading || !canProceed()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Provas
          </Button>
        )}
      </div>
    </div>
  );
}
