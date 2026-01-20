"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Sun,
  Moon,
  Image as ImageIcon,
  Loader2,
  Info,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoConfig {
  logo_light: string | null;
  logo_dark: string | null;
  logo_favicon: string | null;
}

interface LogoUploaderProps {
  initialLogos?: LogoConfig;
  onLogoChange?: () => void;
}

type LogoType = "light" | "dark" | "favicon";

const logoTypeLabels: Record<LogoType, { label: string; description: string; icon: React.ReactNode }> = {
  light: {
    label: "Logo Tema Claro",
    description: "Usada quando o tema claro está ativo. Ideal usar logo com cores escuras.",
    icon: <Sun className="h-5 w-5" />,
  },
  dark: {
    label: "Logo Tema Escuro",
    description: "Usada quando o tema escuro está ativo. Ideal usar logo com cores claras ou brancas.",
    icon: <Moon className="h-5 w-5" />,
  },
  favicon: {
    label: "Favicon",
    description: "Ícone exibido na aba do navegador. Recomendado: 32x32 ou 64x64 pixels.",
    icon: <ImageIcon className="h-5 w-5" />,
  },
};

export function LogoUploader({ initialLogos, onLogoChange }: LogoUploaderProps) {
  const [logos, setLogos] = useState<LogoConfig>(
    initialLogos || { logo_light: null, logo_dark: null, logo_favicon: null }
  );
  const [uploading, setUploading] = useState<LogoType | null>(null);
  const [deleting, setDeleting] = useState<LogoType | null>(null);
  const fileInputRefs = {
    light: useRef<HTMLInputElement>(null),
    dark: useRef<HTMLInputElement>(null),
    favicon: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = useCallback(
    async (type: LogoType, file: File) => {
      console.log("[LogoUploader] Arquivo selecionado:", file.name, file.type, file.size);

      // Validações
      const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido. Use PNG, JPG, SVG, GIF ou WebP.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      setUploading(type);
      console.log("[LogoUploader] Iniciando upload...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      try {
        console.log("[LogoUploader] Enviando para API...");
        const response = await fetch("/api/admin/config/logo", {
          method: "POST",
          body: formData,
        });

        console.log("[LogoUploader] Resposta recebida:", response.status);

        const data = await response.json();
        console.log("[LogoUploader] Dados:", data);

        if (response.ok) {
          setLogos((prev) => ({
            ...prev,
            [`logo_${type}`]: data.url,
          }));
          toast.success("Logo atualizada com sucesso!");
          onLogoChange?.();
        } else {
          toast.error(data.error || "Erro ao fazer upload");
        }
      } catch (error) {
        console.error("[LogoUploader] Erro ao fazer upload:", error);
        toast.error("Erro ao fazer upload da logo");
      } finally {
        setUploading(null);
      }
    },
    [onLogoChange]
  );

  const handleDelete = useCallback(
    async (type: LogoType) => {
      setDeleting(type);

      try {
        const response = await fetch(`/api/admin/config/logo?type=${type}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setLogos((prev) => ({
            ...prev,
            [`logo_${type}`]: null,
          }));
          toast.success("Logo removida com sucesso!");
          onLogoChange?.();
        } else {
          const error = await response.json();
          toast.error(error.error || "Erro ao remover logo");
        }
      } catch (error) {
        console.error("Erro ao remover:", error);
        toast.error("Erro ao remover logo");
      } finally {
        setDeleting(null);
      }
    },
    [onLogoChange]
  );

  const renderLogoUpload = (type: LogoType) => {
    const config = logoTypeLabels[type];
    const logoKey = `logo_${type}` as keyof LogoConfig;
    const currentLogo = logos[logoKey];
    const isUploading = uploading === type;
    const isDeleting = deleting === type;

    return (
      <Card key={type} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-base">{config.label}</CardTitle>
                <CardDescription className="text-xs">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            {currentLogo && (
              <Badge variant="secondary" className="text-xs">
                Ativa
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-4 transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              currentLogo ? "border-muted" : "border-muted-foreground/25"
            )}
          >
            {/* Preview da logo */}
            <div
              className={cn(
                "flex items-center justify-center mb-4 rounded-lg p-4 min-h-[100px]",
                type === "dark" ? "bg-gray-900" : "bg-gray-100"
              )}
            >
              {currentLogo ? (
                <Image
                  src={currentLogo}
                  alt={`Logo ${type}`}
                  width={type === "favicon" ? 64 : 200}
                  height={type === "favicon" ? 64 : 60}
                  className="object-contain max-h-[60px]"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-sm">Nenhuma logo definida</span>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <input
                ref={fileInputRefs[type]}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(type, file);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRefs[type].current?.click()}
                disabled={isUploading || isDeleting}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {currentLogo ? "Trocar" : "Upload"}
                  </>
                )}
              </Button>
              {currentLogo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(type)}
                  disabled={isUploading || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Informações */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-600 dark:text-blue-400">
            Dicas para logos
          </p>
          <ul className="mt-1 text-muted-foreground space-y-1">
            <li>• Formatos aceitos: PNG, JPG, SVG, GIF ou WebP (máx. 10MB)</li>
            <li>• A imagem será salva em PNG para manter qualidade máxima</li>
            <li>• Para tema claro: logos com cores escuras funcionam melhor</li>
            <li>• Para tema escuro: logos com cores claras ou brancas são ideais</li>
          </ul>
        </div>
      </div>

      {/* Upload cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(["light", "dark", "favicon"] as LogoType[]).map(renderLogoUpload)}
      </div>

      {/* Preview lado a lado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Preview em Tempo Real
          </CardTitle>
          <CardDescription>
            Veja como a logo aparecerá em cada tema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Preview Tema Claro */}
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Tema Claro</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
                {logos.logo_light ? (
                  <Image
                    src={logos.logo_light}
                    alt="Logo tema claro"
                    width={120}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <span className="text-xl font-bold text-primary">Simulab</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Tema Escuro */}
            <div className="rounded-lg border bg-gray-900 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-100">Tema Escuro</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                {logos.logo_dark ? (
                  <Image
                    src={logos.logo_dark}
                    alt="Logo tema escuro"
                    width={120}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                ) : logos.logo_light ? (
                  <Image
                    src={logos.logo_light}
                    alt="Logo tema claro (fallback)"
                    width={120}
                    height={40}
                    className="object-contain invert"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <span className="text-xl font-bold text-primary-300">Simulab</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton para loading
export function LogoUploaderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
