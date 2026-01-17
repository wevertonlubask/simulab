"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface ImportarJsonModalProps {
  simuladoId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const exampleJson = `{
  "questoes": [
    {
      "enunciado": "Qual protocolo opera na camada 3 do modelo OSI?",
      "tipo": "MULTIPLA_ESCOLHA_UNICA",
      "dificuldade": "FACIL",
      "tags": ["redes", "osi"],
      "explicacao": "O IP opera na camada de rede (camada 3).",
      "alternativas": [
        { "texto": "IP", "correta": true },
        { "texto": "TCP", "correta": false },
        { "texto": "HTTP", "correta": false },
        { "texto": "Ethernet", "correta": false }
      ]
    }
  ]
}`;

export function ImportarJsonModal({
  simuladoId,
  open,
  onClose,
  onSuccess,
}: ImportarJsonModalProps) {
  const [json, setJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ count: number } | null>(null);
  const { toast } = useToast();

  const handleValidate = () => {
    setValidationErrors([]);
    setPreview(null);

    try {
      const parsed = JSON.parse(json);

      if (!parsed.questoes || !Array.isArray(parsed.questoes)) {
        setValidationErrors(["JSON deve conter um array 'questoes'"]);
        return;
      }

      const errors: string[] = [];
      parsed.questoes.forEach((q: Record<string, unknown>, index: number) => {
        const qNum = index + 1;

        if (!q.enunciado || (q.enunciado as string).length < 10) {
          errors.push(`Questão ${qNum}: Enunciado muito curto (mín. 10 caracteres)`);
        }

        if (!q.dificuldade || !["FACIL", "MEDIO", "DIFICIL"].includes(q.dificuldade as string)) {
          errors.push(`Questão ${qNum}: Dificuldade inválida`);
        }

        const alternativas = q.alternativas as { texto: string; correta: boolean }[] | undefined;
        if (!alternativas || alternativas.length < 2) {
          errors.push(`Questão ${qNum}: Mínimo 2 alternativas`);
        } else if (alternativas.length > 6) {
          errors.push(`Questão ${qNum}: Máximo 6 alternativas`);
        } else {
          const corretas = alternativas.filter((a) => a.correta);
          const tipo = q.tipo || "MULTIPLA_ESCOLHA_UNICA";

          if (tipo === "MULTIPLA_ESCOLHA_UNICA" && corretas.length !== 1) {
            errors.push(`Questão ${qNum}: ME Única deve ter exatamente 1 correta`);
          }

          if (tipo === "MULTIPLA_ESCOLHA_MULTIPLA" && corretas.length < 1) {
            errors.push(`Questão ${qNum}: ME Múltipla deve ter ao menos 1 correta`);
          }
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setPreview({ count: parsed.questoes.length });
      }
    } catch {
      setValidationErrors(["JSON inválido. Verifique a sintaxe."]);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/simulados/${simuladoId}/questoes/importar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao importar");
      }

      toast({
        title: "Importação concluída!",
        description: result.message,
      });

      setJson("");
      setPreview(null);
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setJson("");
    setValidationErrors([]);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Questões via JSON</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              value={json}
              onChange={(e) => {
                setJson(e.target.value);
                setValidationErrors([]);
                setPreview(null);
              }}
              placeholder="Cole seu JSON aqui..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Example */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ver exemplo de formato
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-xs">
              {exampleJson}
            </pre>
          </details>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertCircle className="h-4 w-4" />
                Erros de validação
              </div>
              <ul className="text-sm text-destructive space-y-1 ml-6 list-disc">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2 text-success font-medium">
                <CheckCircle className="h-4 w-4" />
                JSON válido
              </div>
              <p className="text-sm mt-1">
                {preview.count} questão(ões) prontas para importar
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          {!preview ? (
            <Button onClick={handleValidate} disabled={!json.trim()}>
              Validar JSON
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {preview.count} Questão(ões)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
