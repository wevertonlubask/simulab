"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, GripVertical, ImagePlus, X, Loader2 } from "lucide-react";
import type { AlternativaFormData } from "@/lib/validations/questao";

interface AlternativaEditorProps {
  alternativas: AlternativaFormData[];
  tipo: "MULTIPLA_ESCOLHA_UNICA" | "MULTIPLA_ESCOLHA_MULTIPLA";
  onChange: (alternativas: AlternativaFormData[]) => void;
  disabled?: boolean;
}

export function AlternativaEditor({
  alternativas,
  tipo,
  onChange,
  disabled = false,
}: AlternativaEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const canAdd = alternativas.length < 6;
  const canRemove = alternativas.length > 2;

  const handleTextChange = (index: number, texto: string) => {
    const updated = [...alternativas];
    updated[index] = { ...updated[index], texto };
    onChange(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      const updated = [...alternativas];
      updated[index] = { ...updated[index], imagemUrl: data.url };
      onChange(updated);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleImageRemove = (index: number) => {
    const updated = [...alternativas];
    updated[index] = { ...updated[index], imagemUrl: undefined };
    onChange(updated);
  };

  const handleCorretaChange = (index: number, correta: boolean) => {
    const updated = [...alternativas];

    if (tipo === "MULTIPLA_ESCOLHA_UNICA") {
      // Uncheck all others
      updated.forEach((alt, i) => {
        updated[i] = { ...alt, correta: i === index ? correta : false };
      });
    } else {
      updated[index] = { ...updated[index], correta };
    }

    onChange(updated);
  };

  const handleAdd = () => {
    if (!canAdd) return;

    const newAlternativa: AlternativaFormData = {
      texto: "",
      correta: false,
      ordem: alternativas.length,
    };

    onChange([...alternativas, newAlternativa]);
  };

  const handleRemove = (index: number) => {
    if (!canRemove) return;

    const updated = alternativas.filter((_, i) => i !== index);
    // Update ordem
    updated.forEach((alt, i) => {
      alt.ordem = i;
    });
    onChange(updated);
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  if (tipo === "MULTIPLA_ESCOLHA_UNICA") {
    const selectedIndex = alternativas.findIndex((a) => a.correta);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Alternativas *</Label>
          <span className="text-xs text-muted-foreground">
            {alternativas.length}/6 (mín. 2)
          </span>
        </div>

        <RadioGroup
          value={selectedIndex >= 0 ? String(selectedIndex) : undefined}
          onValueChange={(value) => handleCorretaChange(parseInt(value), true)}
          disabled={disabled}
        >
          {alternativas.map((alt, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <RadioGroupItem value={String(index)} id={`alt-${index}`} />
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium text-sm w-6">{letters[index]})</span>
                  <Input
                    value={alt.texto}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    placeholder={`Alternativa ${letters[index]}`}
                    disabled={disabled}
                    className="flex-1"
                  />
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(index, file);
                    }}
                    disabled={disabled || uploadingIndex !== null}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={disabled || uploadingIndex !== null}
                    asChild
                  >
                    <span>
                      {uploadingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                  </Button>
                </label>
                {canRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              {alt.imagemUrl && (
                <div className="ml-14 relative inline-block">
                  <div className="relative h-20 w-32 rounded border overflow-hidden bg-muted">
                    <Image
                      src={alt.imagemUrl}
                      alt={`Imagem alternativa ${letters[index]}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => handleImageRemove(index)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>

        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Alternativa
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Selecione a alternativa correta
        </p>
      </div>
    );
  }

  // MULTIPLA_ESCOLHA_MULTIPLA
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Alternativas *</Label>
        <span className="text-xs text-muted-foreground">
          {alternativas.length}/6 (mín. 2)
        </span>
      </div>

      {alternativas.map((alt, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Checkbox
              checked={alt.correta}
              onCheckedChange={(checked) =>
                handleCorretaChange(index, checked as boolean)
              }
              disabled={disabled}
            />
            <div className="flex-1 flex items-center gap-2">
              <span className="font-medium text-sm w-6">{letters[index]})</span>
              <Input
                value={alt.texto}
                onChange={(e) => handleTextChange(index, e.target.value)}
                placeholder={`Alternativa ${letters[index]}`}
                disabled={disabled}
                className="flex-1"
              />
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(index, file);
                }}
                disabled={disabled || uploadingIndex !== null}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled || uploadingIndex !== null}
                asChild
              >
                <span>
                  {uploadingIndex === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </Button>
            </label>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          {alt.imagemUrl && (
            <div className="ml-14 relative inline-block">
              <div className="relative h-20 w-32 rounded border overflow-hidden bg-muted">
                <Image
                  src={alt.imagemUrl}
                  alt={`Imagem alternativa ${letters[index]}`}
                  fill
                  className="object-contain"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => handleImageRemove(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Alternativa
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Marque todas as alternativas corretas
      </p>
    </div>
  );
}
