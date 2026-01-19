"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentNoTransform,
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

// Importar componentes de display para tipos avançados
import { DragDropDisplay, type DragDropResposta } from "./tipos/DragDropDisplay";
import { AssociacaoDisplay, type AssociacaoResposta } from "./tipos/AssociacaoDisplay";
import { OrdenacaoDisplay, type OrdenacaoResposta } from "./tipos/OrdenacaoDisplay";
import { LacunaDisplay, type LacunaResposta } from "./tipos/LacunaDisplay";
import { HotspotDisplay, type HotspotResposta } from "./tipos/HotspotDisplay";
import { ComandoDisplay, type ComandoResposta } from "./tipos/ComandoDisplay";

// Importar tipos de configuração
import type {
  DragDropConfig,
  AssociacaoConfig,
  OrdenacaoConfig,
  LacunaConfig,
  HotspotConfig,
  ComandoConfig,
} from "@/lib/validations/questao";

// Importar validadores
import {
  validateDragDrop,
  validateAssociacao,
  validateOrdenacao,
  validateLacuna,
  validateHotspot,
  validateComando,
  type HotspotResposta as HotspotRespostaValidator,
} from "@/lib/validations/questoes-avancadas";

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

  // Estados para tipos avançados
  const [dragDropResposta, setDragDropResposta] = useState<DragDropResposta>({ posicoes: {} });
  const [associacaoResposta, setAssociacaoResposta] = useState<AssociacaoResposta>({ conexoes: [] });
  const [ordenacaoResposta, setOrdenacaoResposta] = useState<OrdenacaoResposta>({ ordem: [] });
  const [lacunaResposta, setLacunaResposta] = useState<LacunaResposta>({ respostas: {} });
  const [hotspotResposta, setHotspotResposta] = useState<HotspotResposta>({ cliques: [] });
  const [comandoResposta, setComandoResposta] = useState<ComandoResposta>({ comando: "" });
  const [advancedResult, setAdvancedResult] = useState<{ correta: boolean; pontuacao: number } | null>(null);

  if (!questao) return null;

  const isMultiplaUnica = questao.tipo === "MULTIPLA_ESCOLHA_UNICA";
  const isMultiplaMultipla = questao.tipo === "MULTIPLA_ESCOLHA_MULTIPLA";
  const isDragDrop = questao.tipo === "DRAG_DROP";
  const isAssociacao = questao.tipo === "ASSOCIACAO";
  const isOrdenacao = questao.tipo === "ORDENACAO";
  const isLacuna = questao.tipo === "LACUNA";
  const isHotspot = questao.tipo === "HOTSPOT";
  const isComando = questao.tipo === "COMANDO";
  const isAdvanced = isDragDrop || isAssociacao || isOrdenacao || isLacuna || isHotspot || isComando;

  const handleCheck = () => {
    // Validar tipos avançados
    if (isAdvanced && questao.configuracao) {
      let result = { correta: false, pontuacao: 0 };

      if (isDragDrop) {
        result = validateDragDrop(dragDropResposta, questao.configuracao as DragDropConfig);
      } else if (isAssociacao) {
        result = validateAssociacao(associacaoResposta, questao.configuracao as AssociacaoConfig);
      } else if (isOrdenacao) {
        result = validateOrdenacao(ordenacaoResposta, questao.configuracao as OrdenacaoConfig);
      } else if (isLacuna) {
        result = validateLacuna(lacunaResposta, questao.configuracao as LacunaConfig);
      } else if (isHotspot) {
        // Converter formato do HotspotDisplay para o formato do validador
        const hotspotRespostaConvertida: HotspotRespostaValidator = {
          areasSelecionadas: hotspotResposta.cliques
            .filter((c) => c.areaId)
            .map((c) => c.areaId as string),
        };
        result = validateHotspot(hotspotRespostaConvertida, questao.configuracao as HotspotConfig);
      } else if (isComando) {
        result = validateComando(comandoResposta, questao.configuracao as ComandoConfig);
      }

      setAdvancedResult(result);
    }
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedSingle(null);
    setSelectedMultiple([]);
    setShowResult(false);
    // Reset estados avançados
    setDragDropResposta({ posicoes: {} });
    setAssociacaoResposta({ conexoes: [] });
    setOrdenacaoResposta({ ordem: [] });
    setLacunaResposta({ respostas: {} });
    setHotspotResposta({ cliques: [] });
    setComandoResposta({ comando: "" });
    setAdvancedResult(null);
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

  // Usar DialogContentNoTransform para tipos que usam drag and drop
  // pois o transform do DialogContent quebra o position:fixed do DragOverlay
  const needsNoTransform = isDragDrop || isAssociacao || isOrdenacao;
  const ContentComponent = needsNoTransform ? DialogContentNoTransform : DialogContent;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <ContentComponent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Drag and Drop */}
          {isDragDrop && questao.configuracao && (
            <DragDropDisplay
              config={questao.configuracao as DragDropConfig}
              value={dragDropResposta}
              onChange={setDragDropResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Associação */}
          {isAssociacao && questao.configuracao && (
            <AssociacaoDisplay
              config={questao.configuracao as AssociacaoConfig}
              value={associacaoResposta}
              onChange={setAssociacaoResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Ordenação */}
          {isOrdenacao && questao.configuracao && (
            <OrdenacaoDisplay
              config={questao.configuracao as OrdenacaoConfig}
              value={ordenacaoResposta}
              onChange={setOrdenacaoResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Lacuna */}
          {isLacuna && questao.configuracao && (
            <LacunaDisplay
              config={questao.configuracao as LacunaConfig}
              value={lacunaResposta}
              onChange={setLacunaResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Hotspot */}
          {isHotspot && questao.configuracao && (
            <HotspotDisplay
              config={questao.configuracao as HotspotConfig}
              value={hotspotResposta}
              onChange={setHotspotResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Comando */}
          {isComando && questao.configuracao && (
            <ComandoDisplay
              config={questao.configuracao as ComandoConfig}
              value={comandoResposta}
              onChange={setComandoResposta}
              disabled={showResult}
              showResult={showResult}
            />
          )}

          {/* Result - Múltipla Escolha */}
          {showResult && !isAdvanced && (
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

          {/* Result - Tipos Avançados */}
          {showResult && isAdvanced && advancedResult && (
            <div
              className={`p-4 rounded-lg ${
                advancedResult.correta
                  ? "bg-success/10 text-success"
                  : advancedResult.pontuacao > 0
                    ? "bg-warning/10 text-warning"
                    : "bg-destructive/10 text-destructive"
              }`}
            >
              <p className="font-medium">
                {advancedResult.correta
                  ? "Resposta correta!"
                  : advancedResult.pontuacao > 0
                    ? `Parcialmente correto - ${advancedResult.pontuacao.toFixed(0)}%`
                    : "Resposta incorreta"}
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
                    : isMultiplaMultipla
                      ? selectedMultiple.length === 0
                      : false // Tipos avançados sempre permitem verificar
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
      </ContentComponent>
    </Dialog>
  );
}
