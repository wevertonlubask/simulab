"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  MousePointer2,
  Square,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HotspotConfig, HotspotArea } from "@/lib/validations/questao";

interface HotspotEditorProps {
  value: HotspotConfig;
  onChange: (value: HotspotConfig) => void;
  disabled?: boolean;
}

const defaultConfig: HotspotConfig = {
  imagemUrl: "",
  instrucao: "",
  areas: [],
  multiplosCliques: false,
};

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function HotspotEditor({
  value = defaultConfig,
  onChange,
  disabled = false,
}: HotspotEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Garantir que value tenha todos os campos necessários
  const config: HotspotConfig = {
    imagemUrl: value?.imagemUrl || "",
    instrucao: value?.instrucao || "",
    areas: value?.areas || [],
    multiplosCliques: value?.multiplosCliques ?? false,
  };

  // Atualizar tamanho da imagem quando carregada
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
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

  // Iniciar desenho de área
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || showPreview || !config.imagemUrl) return;
      e.preventDefault();
      const { x, y } = getRelativeCoords(e);
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      setSelectedAreaId(null);
    },
    [disabled, showPreview, config.imagemUrl, getRelativeCoords]
  );

  // Atualizar desenho
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawingState.isDrawing) return;
      const { x, y } = getRelativeCoords(e);
      setDrawingState((prev) => ({ ...prev, currentX: x, currentY: y }));
    },
    [drawingState.isDrawing, getRelativeCoords]
  );

  // Finalizar desenho
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing) return;

    const { startX, startY, currentX, currentY } = drawingState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const largura = Math.abs(currentX - startX);
    const altura = Math.abs(currentY - startY);

    // Só criar área se tiver tamanho mínimo (2%)
    if (largura >= 2 && altura >= 2) {
      const novaArea: HotspotArea = {
        id: `area-${Date.now()}`,
        x,
        y,
        largura,
        altura,
        correta: false,
        label: `Área ${config.areas.length + 1}`,
      };

      onChange({
        ...config,
        areas: [...config.areas, novaArea],
      });

      setSelectedAreaId(novaArea.id);
    }

    setDrawingState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [drawingState, config, onChange]);

  // Selecionar área
  const handleAreaClick = useCallback(
    (e: React.MouseEvent, areaId: string) => {
      e.stopPropagation();
      if (showPreview) return;
      setSelectedAreaId(areaId === selectedAreaId ? null : areaId);
    },
    [selectedAreaId, showPreview]
  );

  // Atualizar área
  const updateArea = useCallback(
    (areaId: string, updates: Partial<HotspotArea>) => {
      onChange({
        ...config,
        areas: config.areas.map((area) =>
          area.id === areaId ? { ...area, ...updates } : area
        ),
      });
    },
    [config, onChange]
  );

  // Remover área
  const removeArea = useCallback(
    (areaId: string) => {
      onChange({
        ...config,
        areas: config.areas.filter((area) => area.id !== areaId),
      });
      if (selectedAreaId === areaId) {
        setSelectedAreaId(null);
      }
    },
    [config, onChange, selectedAreaId]
  );

  // Toggle área correta
  const toggleAreaCorreta = useCallback(
    (areaId: string) => {
      const area = config.areas.find((a) => a.id === areaId);
      if (area) {
        updateArea(areaId, { correta: !area.correta });
      }
    },
    [config.areas, updateArea]
  );

  // Calcular retângulo de desenho atual
  const getDrawingRect = () => {
    if (!drawingState.isDrawing) return null;
    const { startX, startY, currentX, currentY } = drawingState;
    return {
      left: `${Math.min(startX, currentX)}%`,
      top: `${Math.min(startY, currentY)}%`,
      width: `${Math.abs(currentX - startX)}%`,
      height: `${Math.abs(currentY - startY)}%`,
    };
  };

  const drawingRect = getDrawingRect();
  const areasCorretas = config.areas.filter((a) => a.correta);

  return (
    <div className="space-y-6">
      {/* Opções */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="multiplos-cliques"
            checked={config.multiplosCliques}
            onCheckedChange={(checked) =>
              onChange({ ...config, multiplosCliques: checked })
            }
            disabled={disabled}
          />
          <Label htmlFor="multiplos-cliques" className="cursor-pointer">
            Permitir múltiplos cliques
          </Label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2 ml-auto"
          disabled={!config.imagemUrl}
        >
          {showPreview ? (
            <>
              <EyeOff className="h-4 w-4" /> Editar
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Preview
            </>
          )}
        </Button>
      </div>

      {/* Upload de imagem */}
      <div className="space-y-2">
        <Label>Imagem *</Label>
        <ImageUpload
          value={config.imagemUrl}
          onChange={(url) => onChange({ ...config, imagemUrl: url || "" })}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Faça upload da imagem onde o aluno deverá clicar nas áreas corretas
        </p>
      </div>

      {/* Instrução */}
      <div className="space-y-2">
        <Label htmlFor="instrucao">Instrução (opcional)</Label>
        <Textarea
          id="instrucao"
          value={config.instrucao}
          onChange={(e) => onChange({ ...config, instrucao: e.target.value })}
          placeholder="Ex: Clique na área que representa o processador na imagem do computador."
          disabled={disabled}
          rows={2}
        />
      </div>

      {/* Área de edição da imagem */}
      {config.imagemUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer2 className="h-4 w-4" />
              {showPreview ? "Preview" : "Desenhe as Áreas Clicáveis"}
            </CardTitle>
            {!showPreview && (
              <p className="text-sm text-muted-foreground">
                Clique e arraste para criar áreas. Clique em uma área para selecioná-la.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div
              ref={imageContainerRef}
              className={cn(
                "relative overflow-hidden rounded-lg border",
                !showPreview && !disabled && "cursor-crosshair",
                showPreview && "cursor-pointer"
              )}
              onMouseDown={!showPreview ? handleMouseDown : undefined}
              onMouseMove={!showPreview ? handleMouseMove : undefined}
              onMouseUp={!showPreview ? handleMouseUp : undefined}
              onMouseLeave={!showPreview ? handleMouseUp : undefined}
            >
              <img
                src={config.imagemUrl}
                alt="Imagem para hotspot"
                className="w-full h-auto"
                onLoad={handleImageLoad}
                draggable={false}
              />

              {/* Áreas existentes */}
              {config.areas.map((area) => (
                <div
                  key={area.id}
                  className={cn(
                    "absolute border-2 transition-all",
                    area.correta
                      ? "border-green-500 bg-green-500/20"
                      : "border-blue-500 bg-blue-500/20",
                    selectedAreaId === area.id && "ring-2 ring-offset-2 ring-primary",
                    !showPreview && "hover:bg-opacity-40 cursor-move"
                  )}
                  style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`,
                    width: `${area.largura}%`,
                    height: `${area.altura}%`,
                  }}
                  onClick={(e) => handleAreaClick(e, area.id)}
                >
                  {!showPreview && (
                    <div className="absolute -top-6 left-0 flex items-center gap-1">
                      <Badge
                        variant={area.correta ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          area.correta && "bg-green-500"
                        )}
                      >
                        {area.label || area.id}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {/* Retângulo de desenho atual */}
              {drawingRect && (
                <div
                  className="absolute border-2 border-dashed border-primary bg-primary/20"
                  style={drawingRect}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Painel de edição da área selecionada */}
      {selectedAreaId && !showPreview && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Editar Área
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAreaId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const area = config.areas.find((a) => a.id === selectedAreaId);
              if (!area) return null;

              return (
                <>
                  <div className="space-y-2">
                    <Label>Label da Área</Label>
                    <Input
                      value={area.label || ""}
                      onChange={(e) =>
                        updateArea(selectedAreaId, { label: e.target.value })
                      }
                      placeholder="Ex: Processador, CPU, etc."
                      disabled={disabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="area-correta"
                        checked={area.correta}
                        onCheckedChange={() => toggleAreaCorreta(selectedAreaId)}
                        disabled={disabled}
                      />
                      <Label htmlFor="area-correta" className="cursor-pointer">
                        Área Correta
                      </Label>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeArea(selectedAreaId)}
                      disabled={disabled}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>X: {area.x.toFixed(1)}%</div>
                    <div>Y: {area.y.toFixed(1)}%</div>
                    <div>L: {area.largura.toFixed(1)}%</div>
                    <div>A: {area.altura.toFixed(1)}%</div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Lista de áreas */}
      {config.areas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Áreas Definidas ({config.areas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.areas.map((area, index) => (
                <div
                  key={area.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border cursor-pointer transition-colors",
                    selectedAreaId === area.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                    area.correta && "border-green-500/50 bg-green-500/5"
                  )}
                  onClick={() => setSelectedAreaId(area.id)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-8 justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{area.label || `Área ${index + 1}`}</span>
                    {area.correta && (
                      <Badge variant="default" className="bg-green-500 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Correta
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeArea(area.id);
                    }}
                    disabled={disabled}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gabarito */}
      {areasCorretas.length > 0 && (
        <Card className="bg-green-500/5 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">
              Gabarito ({areasCorretas.length} área{areasCorretas.length > 1 ? "s" : ""} correta{areasCorretas.length > 1 ? "s" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {areasCorretas.map((area) => (
                <Badge key={area.id} variant="outline" className="border-green-500 text-green-600">
                  {area.label || area.id}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validação */}
      {!config.imagemUrl && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Faça upload de uma imagem para criar as áreas clicáveis.
        </div>
      )}
      {config.imagemUrl && config.areas.length === 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Desenhe pelo menos 1 área na imagem.
        </div>
      )}
      {config.areas.length > 0 && areasCorretas.length === 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 text-sm">
          Marque pelo menos 1 área como correta.
        </div>
      )}
    </div>
  );
}
