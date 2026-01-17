"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, X, MousePointer2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HotspotConfig } from "@/lib/validations/questao";

interface HotspotDisplayProps {
  config: HotspotConfig;
  value: HotspotResposta;
  onChange: (value: HotspotResposta) => void;
  disabled?: boolean;
  showResult?: boolean;
}

export interface HotspotResposta {
  cliques: { x: number; y: number; areaId?: string }[];
}

export function HotspotDisplay({
  config,
  value,
  onChange,
  disabled = false,
  showResult = false,
}: HotspotDisplayProps) {
  const [cliques, setCliques] = useState<HotspotResposta["cliques"]>(
    value?.cliques || []
  );
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar com resposta existente
  useEffect(() => {
    if (value?.cliques) {
      setCliques(value.cliques);
    }
  }, []);

  // Converter coordenadas do mouse para porcentagem
  const getRelativeCoords = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return { x: 0, y: 0 };
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    },
    []
  );

  // Verificar se um clique está dentro de uma área
  const getAreaForClick = useCallback(
    (x: number, y: number): string | undefined => {
      for (const area of config.areas) {
        if (
          x >= area.x &&
          x <= area.x + area.largura &&
          y >= area.y &&
          y <= area.y + area.altura
        ) {
          return area.id;
        }
      }
      return undefined;
    },
    [config.areas]
  );

  // Processar clique na imagem
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || showResult) return;

      const { x, y } = getRelativeCoords(e);
      const areaId = getAreaForClick(x, y);

      let novosCliques: HotspotResposta["cliques"];

      if (config.multiplosCliques) {
        // Múltiplos cliques permitidos
        // Verificar se já clicou na mesma área (toggle)
        if (areaId) {
          const jaClicouNaArea = cliques.some((c) => c.areaId === areaId);
          if (jaClicouNaArea) {
            // Remover clique da área
            novosCliques = cliques.filter((c) => c.areaId !== areaId);
          } else {
            // Adicionar novo clique
            novosCliques = [...cliques, { x, y, areaId }];
          }
        } else {
          // Clique fora de qualquer área
          novosCliques = [...cliques, { x, y }];
        }
      } else {
        // Apenas um clique permitido
        novosCliques = [{ x, y, areaId }];
      }

      setCliques(novosCliques);
      onChange({ cliques: novosCliques });
    },
    [
      disabled,
      showResult,
      config.multiplosCliques,
      cliques,
      getRelativeCoords,
      getAreaForClick,
      onChange,
    ]
  );

  // Limpar cliques
  const handleReset = useCallback(() => {
    setCliques([]);
    onChange({ cliques: [] });
  }, [onChange]);

  // Verificar se uma área foi clicada corretamente
  const isAreaClicada = (areaId: string) => {
    return cliques.some((c) => c.areaId === areaId);
  };

  // Calcular resultado
  const getResultado = () => {
    const areasCorretas = config.areas.filter((a) => a.correta);
    const areasIncorretas = config.areas.filter((a) => !a.correta);

    const acertos = areasCorretas.filter((a) => isAreaClicada(a.id)).length;
    const erros = areasIncorretas.filter((a) => isAreaClicada(a.id)).length;
    const cliquesForaDasAreas = cliques.filter((c) => !c.areaId).length;

    return {
      total: areasCorretas.length,
      acertos,
      erros: erros + cliquesForaDasAreas,
      isCorreto: acertos === areasCorretas.length && erros === 0 && cliquesForaDasAreas === 0,
    };
  };

  const resultado = showResult ? getResultado() : null;

  return (
    <div className="space-y-4">
      {/* Instrução */}
      {config.instrucao && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm">{config.instrucao}</p>
        </div>
      )}

      {/* Indicador de modo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MousePointer2 className="h-4 w-4" />
          {config.multiplosCliques
            ? `Clique nas áreas corretas (${cliques.filter((c) => c.areaId).length} selecionadas)`
            : "Clique na área correta"}
        </div>

        {!disabled && !showResult && cliques.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        )}

        {showResult && resultado && (
          <Badge
            variant={resultado.isCorreto ? "default" : "destructive"}
            className={cn(resultado.isCorreto && "bg-green-500")}
          >
            {resultado.acertos}/{resultado.total} acertos
          </Badge>
        )}
      </div>

      {/* Imagem com áreas */}
      <div
        ref={imageContainerRef}
        className={cn(
          "relative overflow-hidden rounded-lg border",
          !disabled && !showResult && "cursor-crosshair",
          showResult && resultado?.isCorreto && "ring-2 ring-green-500",
          showResult && resultado && !resultado.isCorreto && "ring-2 ring-red-500"
        )}
        onClick={handleClick}
      >
        <img
          src={config.imagemUrl}
          alt="Imagem da questão"
          className="w-full h-auto"
          draggable={false}
        />

        {/* Áreas (visíveis apenas no resultado) */}
        {showResult &&
          config.areas.map((area) => {
            const foiClicada = isAreaClicada(area.id);
            const isCorretoClick = area.correta && foiClicada;
            const isErroClick = !area.correta && foiClicada;
            const isMissed = area.correta && !foiClicada;

            return (
              <div
                key={area.id}
                className={cn(
                  "absolute border-2 transition-all",
                  isCorretoClick && "border-green-500 bg-green-500/30",
                  isErroClick && "border-red-500 bg-red-500/30",
                  isMissed && "border-orange-500 bg-orange-500/30 border-dashed",
                  !foiClicada && !area.correta && "border-gray-400 bg-gray-400/10"
                )}
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.largura}%`,
                  height: `${area.altura}%`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {isCorretoClick && <Check className="h-6 w-6 text-green-600" />}
                  {isErroClick && <X className="h-6 w-6 text-red-600" />}
                  {isMissed && (
                    <span className="text-orange-600 text-xs font-medium">
                      Faltou
                    </span>
                  )}
                </div>
              </div>
            );
          })}

        {/* Marcadores de cliques */}
        {cliques.map((clique, index) => {
          const isCorreto = showResult
            ? clique.areaId
              ? config.areas.find((a) => a.id === clique.areaId)?.correta
              : false
            : undefined;

          return (
            <div
              key={index}
              className={cn(
                "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center transition-all",
                !showResult && "bg-primary border-primary text-primary-foreground",
                showResult && isCorreto && "bg-green-500 border-green-600 text-white",
                showResult && isCorreto === false && "bg-red-500 border-red-600 text-white"
              )}
              style={{
                left: `${clique.x}%`,
                top: `${clique.y}%`,
              }}
            >
              {showResult ? (
                isCorreto ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Resultado detalhado */}
      {showResult && resultado && (
        <div className="pt-4 border-t space-y-3">
          <div
            className={cn(
              "p-4 rounded-lg border",
              resultado.isCorreto
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Resultado:</span>
              {resultado.isCorreto ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Correto
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Incorreto
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Acertos: {resultado.acertos}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Erros: {resultado.erros}</span>
              </div>
            </div>
          </div>

          {/* Mostrar áreas corretas */}
          {!resultado.isCorreto && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-green-600">
                Áreas Corretas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {config.areas
                  .filter((a) => a.correta)
                  .map((area) => (
                    <Badge
                      key={area.id}
                      variant="outline"
                      className={cn(
                        "border-green-500",
                        isAreaClicada(area.id)
                          ? "bg-green-500 text-white"
                          : "text-green-600"
                      )}
                    >
                      {isAreaClicada(area.id) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {area.label || area.id}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instruções */}
      {!disabled && !showResult && (
        <p className="text-xs text-muted-foreground text-center">
          {config.multiplosCliques
            ? "Clique nas áreas que você considera corretas. Clique novamente para desmarcar."
            : "Clique na área que você considera correta."}
        </p>
      )}
    </div>
  );
}
