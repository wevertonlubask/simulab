"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DificuldadeBadge } from "./DificuldadeBadge";
import { TipoQuestaoBadge } from "./TipoQuestaoBadge";
import { CheckCircle, XCircle } from "lucide-react";
import type { Questao, Alternativa } from "@prisma/client";

interface QuestaoWithAlternativas extends Questao {
  alternativas: Alternativa[];
}

interface QuestaoPreviewModalProps {
  questao: QuestaoWithAlternativas | null;
  open: boolean;
  onClose: () => void;
}

export function QuestaoPreviewModal({
  questao,
  open,
  onClose,
}: QuestaoPreviewModalProps) {
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  if (!questao) return null;

  const isMultiplaUnica = questao.tipo === "MULTIPLA_ESCOLHA_UNICA";
  const isMultiplaMultipla = questao.tipo === "MULTIPLA_ESCOLHA_MULTIPLA";

  const handleCheck = () => {
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedSingle(null);
    setSelectedMultiple([]);
    setShowResult(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const getResult = () => {
    if (isMultiplaUnica) {
      const correctAlt = questao.alternativas.find((a) => a.correta);
      return selectedSingle === correctAlt?.id;
    }

    if (isMultiplaMultipla) {
      const correctIds = questao.alternativas
        .filter((a) => a.correta)
        .map((a) => a.id);
      return (
        correctIds.length === selectedMultiple.length &&
        correctIds.every((id) => selectedMultiple.includes(id))
      );
    }

    return false;
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview da Questão
            <TipoQuestaoBadge tipo={questao.tipo} />
            <DificuldadeBadge dificuldade={questao.dificuldade} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enunciado */}
          <div className="space-y-3 w-full overflow-hidden">
            <p className="text-base whitespace-pre-wrap break-all">{questao.enunciado}</p>
            {questao.imagemUrl && (
              <div className="flex justify-center">
                <img
                  src={questao.imagemUrl}
                  alt="Imagem da questão"
                  className="max-w-full max-h-64 object-contain rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Alternativas - Única */}
          {isMultiplaUnica && (
            <RadioGroup
              value={selectedSingle || undefined}
              onValueChange={setSelectedSingle}
              disabled={showResult}
            >
              {questao.alternativas.map((alt, index) => {
                const isCorrect = alt.correta;
                const isSelected = selectedSingle === alt.id;

                return (
                  <div
                    key={alt.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      showResult
                        ? isCorrect
                          ? "bg-success/10 border-success"
                          : isSelected
                            ? "bg-destructive/10 border-destructive"
                            : ""
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={alt.id} id={alt.id} />
                    <Label htmlFor={alt.id} className="flex-1 cursor-pointer min-w-0">
                      <span className="font-medium">{letters[index]})</span>{" "}
                      <span className="whitespace-pre-wrap break-all">{alt.texto}</span>
                      {alt.imagemUrl && (
                        <img
                          src={alt.imagemUrl}
                          alt={`Imagem alternativa ${letters[index]}`}
                          className="mt-2 max-w-full max-h-32 object-contain rounded-md"
                        />
                      )}
                    </Label>
                    {showResult && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {/* Alternativas - Múltipla */}
          {isMultiplaMultipla && (
            <div className="space-y-2">
              {questao.alternativas.map((alt, index) => {
                const isCorrect = alt.correta;
                const isSelected = selectedMultiple.includes(alt.id);

                return (
                  <div
                    key={alt.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      showResult
                        ? isCorrect
                          ? "bg-success/10 border-success"
                          : isSelected
                            ? "bg-destructive/10 border-destructive"
                            : ""
                        : ""
                    }`}
                  >
                    <Checkbox
                      id={alt.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (showResult) return;
                        if (checked) {
                          setSelectedMultiple([...selectedMultiple, alt.id]);
                        } else {
                          setSelectedMultiple(
                            selectedMultiple.filter((id) => id !== alt.id)
                          );
                        }
                      }}
                      disabled={showResult}
                    />
                    <Label htmlFor={alt.id} className="flex-1 cursor-pointer min-w-0">
                      <span className="font-medium">{letters[index]})</span>{" "}
                      <span className="whitespace-pre-wrap break-all">{alt.texto}</span>
                      {alt.imagemUrl && (
                        <img
                          src={alt.imagemUrl}
                          alt={`Imagem alternativa ${letters[index]}`}
                          className="mt-2 max-w-full max-h-32 object-contain rounded-md"
                        />
                      )}
                    </Label>
                    {showResult && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div
              className={`p-4 rounded-lg ${
                getResult()
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <p className="font-medium">
                {getResult() ? "Resposta correta!" : "Resposta incorreta"}
              </p>
              {questao.explicacao && (
                <p className="mt-2 text-sm text-foreground">
                  <strong>Explicação:</strong> {questao.explicacao}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!showResult ? (
              <Button
                onClick={handleCheck}
                disabled={
                  isMultiplaUnica
                    ? !selectedSingle
                    : selectedMultiple.length === 0
                }
              >
                Verificar Resposta
              </Button>
            ) : (
              <Button onClick={handleReset} variant="outline">
                Tentar Novamente
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
