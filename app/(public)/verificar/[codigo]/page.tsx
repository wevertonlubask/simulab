import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verificar Certificado - SimulaB",
  description: "Verifique a autenticidade de um certificado SimulaB",
};

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function VerificarCertificadoPage({ params }: PageProps) {
  const { codigo } = await params;

  // Buscar certificado
  const certificado = await db.certificado.findUnique({
    where: { codigo },
    include: {
      aluno: {
        select: {
          nome: true,
        },
      },
      tentativa: {
        select: {
          numero: true,
          totalAcertos: true,
          totalQuestoes: true,
          dataFim: true,
          prova: {
            select: {
              nome: true,
            },
          },
        },
      },
    },
  });

  if (!certificado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">
              Certificado Não Encontrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              O código <code className="bg-muted px-2 py-1 rounded">{codigo}</code> não
              corresponde a nenhum certificado válido em nosso sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique se o código foi digitado corretamente ou entre em contato com o
              emissor do certificado.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/">Ir para o SimulaB</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">SimulaB</h1>
            <p className="text-sm text-muted-foreground">Plataforma de Simulados</p>
          </Link>
        </div>

        {/* Status de verificação */}
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-600">Certificado Válido</h2>
                <p className="text-muted-foreground">
                  Este certificado foi emitido pelo SimulaB e é autêntico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do certificado */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              <CardTitle>Detalhes do Certificado</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aluno */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome do Aluno</p>
                <p className="text-lg font-semibold">{certificado.aluno.nome}</p>
              </div>
            </div>

            {/* Simulado */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Simulado</p>
                <p className="text-lg font-semibold">{certificado.titulo}</p>
                <Badge variant="secondary" className="mt-1">{certificado.categoria}</Badge>
              </div>
            </div>

            {/* Nota */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nota Obtida</p>
                <p className="text-lg font-semibold text-green-600">
                  {certificado.nota.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Nota mínima: {certificado.notaMinima}%
                </p>
                {certificado.tentativa && (
                  <p className="text-sm text-muted-foreground">
                    Acertos: {certificado.tentativa.totalAcertos} de {certificado.tentativa.totalQuestoes}
                  </p>
                )}
              </div>
            </div>

            {/* Data */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="text-lg font-semibold">
                  {format(new Date(certificado.dataEmissao), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            {/* Código */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Código de Verificação</p>
              <code className="text-lg font-mono bg-muted px-3 py-1 rounded">
                {certificado.codigo}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Este certificado foi verificado em{" "}
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="mt-2">
            <Link href="/" className="text-primary hover:underline">
              SimulaB - Plataforma de Simulados
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
