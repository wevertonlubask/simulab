"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  Target,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificadoValidacao {
  codigo: string;
  titulo: string;
  categoria: string;
  nota: number;
  notaMinima: number;
  dataEmissao: string;
  dataValidade: string | null;
  aluno: string;
  prova: string;
  simulado: string;
  docente: string;
  acertos?: number;
  totalQuestoes?: number;
}

interface ValidationResult {
  valid: boolean;
  expired: boolean;
  certificado?: CertificadoValidacao;
  error?: string;
}

export default function ValidarCertificadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");

  useEffect(() => {
    async function validateCertificado() {
      if (!codigo) return;

      try {
        const response = await fetch(`/api/certificados/validar/${codigo}`);
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("Erro ao validar certificado:", error);
        setResult({
          valid: false,
          expired: false,
          error: "Erro ao validar certificado",
        });
      } finally {
        setLoading(false);
      }
    }

    validateCertificado();
  }, [codigo]);

  const handleSearch = () => {
    if (searchCode.trim()) {
      window.location.href = `/certificados/validar/${searchCode.trim().toUpperCase()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <span className="font-bold">Simulab</span>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Título */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Validação de Certificado
            </h1>
            <p className="text-muted-foreground">
              Verifique a autenticidade de um certificado emitido pela plataforma
              Simulab
            </p>
          </div>

          {/* Busca */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do certificado (ex: CERT-ABC123XYZ)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="font-mono"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Validar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado */}
          {loading ? (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ) : result ? (
            <Card
              className={`overflow-hidden ${
                result.valid
                  ? "border-green-500"
                  : result.expired
                  ? "border-yellow-500"
                  : "border-red-500"
              }`}
            >
              {/* Status Banner */}
              <div
                className={`px-6 py-4 ${
                  result.valid
                    ? "bg-green-500/10"
                    : result.expired
                    ? "bg-yellow-500/10"
                    : "bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.valid ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h2 className="font-semibold text-green-700 dark:text-green-400">
                          Certificado Válido
                        </h2>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          Este certificado é autêntico e foi emitido pela
                          plataforma Simulab
                        </p>
                      </div>
                    </>
                  ) : result.expired ? (
                    <>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h2 className="font-semibold text-yellow-700 dark:text-yellow-400">
                          Certificado Expirado
                        </h2>
                        <p className="text-sm text-yellow-600 dark:text-yellow-500">
                          Este certificado é autêntico, mas está fora do prazo
                          de validade
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <h2 className="font-semibold text-red-700 dark:text-red-400">
                          Certificado Inválido
                        </h2>
                        <p className="text-sm text-red-600 dark:text-red-500">
                          {result.error ||
                            "Não foi possível verificar este certificado"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Detalhes do Certificado */}
              {result.certificado && (
                <CardContent className="pt-6 space-y-6">
                  {/* Código */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Código do Certificado
                    </span>
                    <Badge variant="outline" className="font-mono text-base">
                      {result.certificado.codigo}
                    </Badge>
                  </div>

                  {/* Informações do Certificado */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Certificado emitido para
                        </p>
                        <p className="font-semibold text-lg">
                          {result.certificado.aluno}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Simulado/Prova
                        </p>
                        <p className="font-semibold">{result.certificado.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.certificado.simulado} - {result.certificado.prova}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Desempenho</p>
                        <p className="font-semibold">
                          Nota: {result.certificado.nota.toFixed(1)}%
                          {result.certificado.acertos !== undefined &&
                            result.certificado.totalQuestoes !== undefined && (
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                ({result.certificado.acertos} de{" "}
                                {result.certificado.totalQuestoes} questões)
                              </span>
                            )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nota mínima para aprovação:{" "}
                          {result.certificado.notaMinima}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Data de Emissão
                        </p>
                        <p className="font-semibold">
                          {format(
                            new Date(result.certificado.dataEmissao),
                            "dd 'de' MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                        {result.certificado.dataValidade && (
                          <p className="text-sm text-muted-foreground">
                            Válido até:{" "}
                            {format(
                              new Date(result.certificado.dataValidade),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Docente Responsável
                        </p>
                        <p className="font-semibold">
                          {result.certificado.docente}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="pt-4 border-t">
                    <Badge variant="secondary" className="text-sm">
                      Categoria: {result.certificado.categoria}
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ) : null}

          {/* Voltar */}
          <div className="text-center">
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a página inicial
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>
            Simulab - Plataforma de Simulados e Certificações
          </p>
          <p className="mt-1">
            Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
