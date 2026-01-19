import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { EntrarTurmaForm } from "@/components/aluno/EntrarTurmaForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Minhas Turmas",
};

export default async function AlunoTurmasPage() {
  const user = await requireRole(["ALUNO"]);

  // Buscar turmas do aluno
  const turmasAluno = await db.turmaAluno.findMany({
    where: {
      alunoId: user.id,
    },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          ativa: true,
          docente: {
            select: {
              nome: true,
            },
          },
          _count: {
            select: {
              alunos: true,
              provas: true,
            },
          },
        },
      },
    },
    orderBy: {
      dataEntrada: "desc",
    },
  });

  const turmasAtivas = turmasAluno.filter((ta) => ta.turma.ativa);
  const turmasInativas = turmasAluno.filter((ta) => !ta.turma.ativa);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Turmas</h1>
        <p className="text-muted-foreground">
          Gerencie suas turmas e entre em novas turmas
        </p>
      </div>

      {/* Entrar em turma */}
      <Card>
        <CardHeader>
          <CardTitle>Entrar em uma Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Digite o código de 6 caracteres fornecido pelo seu professor para
            entrar em uma turma.
          </p>
          <EntrarTurmaForm />
        </CardContent>
      </Card>

      {/* Turmas Ativas */}
      {turmasAtivas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Turmas Ativas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turmasAtivas.map((ta) => (
              <Card key={ta.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{ta.turma.nome}</CardTitle>
                  {ta.turma.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ta.turma.descricao}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="text-sm text-muted-foreground">
                    Professor: {ta.turma.docente.nome}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {ta.turma._count.alunos} alunos
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      {ta.turma._count.provas} provas
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Entrou em{" "}
                    {format(new Date(ta.dataEntrada), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/aluno/turmas/${ta.turma.id}`}>
                      Ver Provas
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Turmas Inativas */}
      {turmasInativas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Turmas Inativas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {turmasInativas.map((ta) => (
              <Card key={ta.id} className="opacity-70 flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ta.turma.nome}</CardTitle>
                    <Badge variant="secondary">Inativa</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="text-sm text-muted-foreground">
                    Professor: {ta.turma.docente.nome}
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button asChild className="w-full" variant="ghost" size="sm">
                    <Link href={`/aluno/turmas/${ta.turma.id}`}>
                      Ver Histórico
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Nenhuma turma */}
      {turmasAluno.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Você não está em nenhuma turma
            </h3>
            <p className="text-muted-foreground text-center">
              Use o código fornecido pelo seu professor para entrar em uma turma
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
