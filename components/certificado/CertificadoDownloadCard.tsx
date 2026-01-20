"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, ExternalLink, Loader2 } from "lucide-react";
import { gerarCertificadoPDF } from "@/lib/pdf/certificados";

interface CertificadoDownloadCardProps {
  tentativaId: string;
  aprovado: boolean;
}

export function CertificadoDownloadCard({
  tentativaId,
  aprovado,
}: CertificadoDownloadCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [certificadoCodigo, setCertificadoCodigo] = useState<string | null>(null);

  if (!aprovado) {
    return null;
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/certificados/${tentativaId}`);

      if (response.ok) {
        const result = await response.json();
        setCertificadoCodigo(result.certificado.codigo);
        gerarCertificadoPDF({
          codigo: result.certificado.codigo,
          titulo: result.dados.titulo,
          categoria: result.dados.categoria,
          nota: result.dados.nota,
          notaMinima: result.dados.notaMinima,
          dataEmissao: result.dados.dataEmissao,
          aluno: { nome: result.dados.alunoNome },
          simulado: { nome: result.dados.titulo, docente: "SimulaB" },
          prova: { nome: result.dados.titulo },
        });
      } else {
        const error = await response.json();
        console.error("Erro ao gerar certificado:", error);
        alert("Erro ao gerar certificado. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao baixar certificado:", error);
      alert("Erro ao baixar certificado. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Certificado Disponível!</h3>
            <p className="text-sm text-muted-foreground">
              Parabéns pela sua aprovação! Baixe seu certificado agora.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar Certificado
            </Button>
            {certificadoCodigo && (
              <Button variant="outline" asChild>
                <Link
                  href={`/verificar/${certificadoCodigo}`}
                  target="_blank"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Validar
                </Link>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Você também pode acessar todos os seus certificados em{" "}
            <Link
              href="/aluno/certificados"
              className="text-primary hover:underline"
            >
              Meus Certificados
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
