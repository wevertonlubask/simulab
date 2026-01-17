"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Search, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ValidarCertificadoFormPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      router.push(`/certificados/validar/${codigo.trim().toUpperCase()}`);
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
        <div className="max-w-xl mx-auto space-y-8">
          {/* Ícone e Título */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Validação de Certificado
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Verifique a autenticidade de um certificado emitido pela plataforma
              Simulab. Insira o código que aparece no documento.
            </p>
          </div>

          {/* Formulário de Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Código do Certificado</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Ex: CERT-ABC123XYZ"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    className="font-mono text-center text-lg h-12"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    O código do certificado está localizado na parte inferior do
                    documento
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Validar Certificado
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informações */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <span className="text-green-500 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Encontre o código</h3>
                    <p className="text-sm text-muted-foreground">
                      O código está na parte inferior do certificado, começando
                      com "CERT-"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <span className="text-green-500 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Verifique a autenticidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Confira os dados do certificado para garantir sua validade
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
          <p>Simulab - Plataforma de Simulados e Certificações</p>
          <p className="mt-1">Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
