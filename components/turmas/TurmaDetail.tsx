"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MoreVertical,
  UserPlus,
  Link2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TurmaForm } from "./TurmaForm";

interface Aluno {
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
}

interface TurmaAluno {
  id: string;
  dataEntrada: Date;
  aluno: Aluno;
}

interface Prova {
  id: string;
  codigo: string;
  nome: string;
  status: string;
  tempoLimite: number | null;
  tentativasMax: number | null;
  simulado: {
    nome: string;
    categoria: string;
  };
  _count: {
    questoes: number;
  };
}

interface TurmaProva {
  id: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  prova: Prova;
}

interface Turma {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  ativa: boolean;
  createdAt: Date;
  alunos: TurmaAluno[];
  provas: TurmaProva[];
  _count: {
    alunos: number;
    provas: number;
  };
}

interface ProvaDisponivel {
  id: string;
  codigo: string;
  nome: string;
  simulado: {
    nome: string;
    categoria: string;
  };
  _count: {
    questoes: number;
  };
}

interface TurmaDetailProps {
  turma: Turma;
  provasDisponiveis: ProvaDisponivel[];
}

export function TurmaDetail({ turma, provasDisponiveis }: TurmaDetailProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showAddAluno, setShowAddAluno] = useState(false);
  const [showAddProva, setShowAddProva] = useState(false);
  const [showEditTurma, setShowEditTurma] = useState(false);
  const [showRemoveAluno, setShowRemoveAluno] = useState<TurmaAluno | null>(null);
  const [showRemoveProva, setShowRemoveProva] = useState<TurmaProva | null>(null);
  const [alunoEmail, setAlunoEmail] = useState("");
  const [selectedProvaId, setSelectedProvaId] = useState("");
  const [provaDataInicio, setProvaDataInicio] = useState("");
  const [provaDataFim, setProvaDataFim] = useState("");
  const [loading, setLoading] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(turma.codigo);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAluno = async () => {
    if (!alunoEmail.trim()) {
      toast.error("Digite o email do aluno");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/turmas/${turma.id}/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alunoEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar aluno");
      }

      toast.success("Aluno adicionado com sucesso!");
      setShowAddAluno(false);
      setAlunoEmail("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAluno = async () => {
    if (!showRemoveAluno) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/turmas/${turma.id}/alunos/${showRemoveAluno.aluno.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao remover aluno");
      }

      toast.success("Aluno removido da turma");
      setShowRemoveAluno(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProva = async () => {
    if (!selectedProvaId) {
      toast.error("Selecione uma prova");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/turmas/${turma.id}/provas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provaId: selectedProvaId,
          dataInicio: provaDataInicio || null,
          dataFim: provaDataFim || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao vincular prova");
      }

      toast.success("Prova vinculada com sucesso!");
      setShowAddProva(false);
      setSelectedProvaId("");
      setProvaDataInicio("");
      setProvaDataFim("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao vincular prova");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProva = async () => {
    if (!showRemoveProva) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/turmas/${turma.id}/provas/${showRemoveProva.prova.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao desvincular prova");
      }

      toast.success("Prova desvinculada da turma");
      setShowRemoveProva(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desvincular prova");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/docente/turmas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{turma.nome}</h1>
              {!turma.ativa && (
                <Badge variant="secondary">Inativa</Badge>
              )}
            </div>
            {turma.descricao && (
              <p className="text-muted-foreground mt-1">{turma.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={copyCode}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {turma.codigo}
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowEditTurma(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turma._count.alunos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turma._count.provas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Criada em</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(turma.createdAt), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alunos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alunos" className="gap-2">
            <Users className="h-4 w-4" />
            Alunos ({turma._count.alunos})
          </TabsTrigger>
          <TabsTrigger value="provas" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Provas ({turma._count.provas})
          </TabsTrigger>
        </TabsList>

        {/* Alunos Tab */}
        <TabsContent value="alunos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alunos da Turma</CardTitle>
              <Button onClick={() => setShowAddAluno(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Aluno
              </Button>
            </CardHeader>
            <CardContent>
              {turma.alunos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum aluno na turma</p>
                  <p className="text-sm">
                    Compartilhe o código <strong>{turma.codigo}</strong> com seus alunos
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Entrou em</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turma.alunos.map((ta) => (
                      <TableRow key={ta.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ta.aluno.avatar || undefined} />
                              <AvatarFallback>
                                {getInitials(ta.aluno.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{ta.aluno.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ta.aluno.email}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ta.dataEntrada), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setShowRemoveAluno(ta)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover da turma
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provas Tab */}
        <TabsContent value="provas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Provas Vinculadas</CardTitle>
              <Button
                onClick={() => setShowAddProva(true)}
                className="gap-2"
                disabled={provasDisponiveis.length === 0}
              >
                <Link2 className="h-4 w-4" />
                Vincular Prova
              </Button>
            </CardHeader>
            <CardContent>
              {turma.provas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma prova vinculada</p>
                  <p className="text-sm">
                    Vincule provas para que os alunos possam realizá-las
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prova</TableHead>
                      <TableHead>Simulado</TableHead>
                      <TableHead>Questões</TableHead>
                      <TableHead>Disponibilidade</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turma.provas.map((tp) => (
                      <TableRow key={tp.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{tp.prova.nome}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {tp.prova.codigo}
                              </Badge>
                              {tp.prova.tempoLimite && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {tp.prova.tempoLimite} min
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span>{tp.prova.simulado.nome}</span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {tp.prova.simulado.categoria}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{tp.prova._count.questoes}</TableCell>
                        <TableCell>
                          {tp.dataInicio || tp.dataFim ? (
                            <div className="text-sm">
                              {tp.dataInicio && (
                                <div>
                                  De:{" "}
                                  {format(new Date(tp.dataInicio), "dd/MM/yyyy HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              )}
                              {tp.dataFim && (
                                <div>
                                  Até:{" "}
                                  {format(new Date(tp.dataFim), "dd/MM/yyyy HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sempre disponível</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setShowRemoveProva(tp)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Desvincular prova
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Aluno Dialog */}
      <Dialog open={showAddAluno} onOpenChange={setShowAddAluno}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aluno</DialogTitle>
            <DialogDescription>
              Digite o email do aluno que deseja adicionar à turma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do aluno</Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@email.com"
                value={alunoEmail}
                onChange={(e) => setAlunoEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAluno(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAluno} disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Aluno Dialog */}
      <Dialog open={!!showRemoveAluno} onOpenChange={() => setShowRemoveAluno(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Aluno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{showRemoveAluno?.aluno.nome}</strong> da turma?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveAluno(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveAluno} disabled={loading}>
              {loading ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Prova Dialog */}
      <Dialog open={showAddProva} onOpenChange={setShowAddProva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Prova</DialogTitle>
            <DialogDescription>
              Selecione uma prova para vincular à turma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prova</Label>
              <Select value={selectedProvaId} onValueChange={setSelectedProvaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma prova" />
                </SelectTrigger>
                <SelectContent>
                  {provasDisponiveis.map((prova) => (
                    <SelectItem key={prova.id} value={prova.id}>
                      {prova.nome} ({prova.simulado.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Disponível a partir de (opcional)</Label>
                <Input
                  id="dataInicio"
                  type="datetime-local"
                  value={provaDataInicio}
                  onChange={(e) => setProvaDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Disponível até (opcional)</Label>
                <Input
                  id="dataFim"
                  type="datetime-local"
                  value={provaDataFim}
                  onChange={(e) => setProvaDataFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProva(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProva} disabled={loading}>
              {loading ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Prova Dialog */}
      <Dialog open={!!showRemoveProva} onOpenChange={() => setShowRemoveProva(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular Prova</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desvincular a prova{" "}
              <strong>{showRemoveProva?.prova.nome}</strong> da turma?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveProva(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveProva} disabled={loading}>
              {loading ? "Desvinculando..." : "Desvincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Turma Dialog */}
      <Dialog open={showEditTurma} onOpenChange={setShowEditTurma}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
          </DialogHeader>
          <TurmaForm
            turma={{
              id: turma.id,
              nome: turma.nome,
              descricao: turma.descricao,
            }}
            onSuccess={() => {
              setShowEditTurma(false);
              router.refresh();
            }}
            onCancel={() => setShowEditTurma(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
