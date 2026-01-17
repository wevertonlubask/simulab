"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  FileText,
  Trophy,
  TrendingUp,
  TrendingDown,
  Loader2,
  BookOpen,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface EstatisticasGerais {
  totalSimulados: number;
  totalProvas: number;
  totalTentativas: number;
  totalTurmas: number;
  totalAlunos: number;
}

interface TopSimulado {
  id: string;
  nome: string;
  categoria: string;
  totalProvas: number;
  totalTentativas: number;
}

interface TopTurma {
  id: string;
  nome: string;
  codigo: string;
  totalAlunos: number;
}

interface RelatorioGeral {
  estatisticas: EstatisticasGerais;
  topSimulados: TopSimulado[];
  topTurmas: TopTurma[];
}

interface RelatorioProva {
  prova: {
    id: string;
    nome: string;
    codigo: string;
    notaMinima: number;
    tempoLimite: number | null;
    simulado: {
      nome: string;
      categoria: string;
    };
  };
  estatisticas: {
    totalTentativas: number;
    aprovacoes: number;
    reprovacoes: number;
    taxaAprovacao: number;
    mediaGeral: number;
    notaMaxima: number;
    notaMinima: number;
    desvioPadrao: number;
  };
  estatisticasQuestoes: {
    ordem: number;
    questaoId: string;
    enunciado: string;
    tipo: string;
    dificuldade: string;
    totalRespostas: number;
    acertos: number;
    taxaAcerto: number;
  }[];
  ranking: {
    posicao: number;
    alunoId: string;
    alunoNome: string;
    alunoEmail: string;
    nota: number | null;
    tempoGasto: number | null;
    acertos: number | null;
    aprovado: boolean;
  }[];
}

interface RelatorioTurma {
  turma: {
    id: string;
    nome: string;
    codigo: string;
    totalAlunos: number;
  };
  estatisticas: {
    totalAlunos: number;
    alunosAtivos: number;
    provasDisponiveis: number;
    mediaTurma: number;
  };
  desempenhoAlunos: {
    alunoId: string;
    alunoNome: string;
    alunoEmail: string;
    totalTentativas: number;
    provasRealizadas: number;
    provasDisponiveis: number;
    aprovacoes: number;
    mediaGeral: number;
    taxaAprovacao: number;
  }[];
  provasDisponiveis: {
    id: string;
    nome: string;
    notaMinima: number;
  }[];
}

interface Simulado {
  id: string;
  nome: string;
}

interface Prova {
  id: string;
  nome: string;
}

interface Turma {
  id: string;
  nome: string;
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [loadingTurma, setLoadingTurma] = useState(false);
  const [relatorioGeral, setRelatorioGeral] = useState<RelatorioGeral | null>(null);
  const [relatorioProva, setRelatorioProva] = useState<RelatorioProva | null>(null);
  const [relatorioTurma, setRelatorioTurma] = useState<RelatorioTurma | null>(null);

  // Dados para os selects
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [provas, setProvas] = useState<Prova[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  // Seleções
  const [simuladoSelecionado, setSimuladoSelecionado] = useState<string>("");
  const [provaSelecionada, setProvaSelecionada] = useState<string>("");
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");

  // Carregar relatório geral
  useEffect(() => {
    async function loadRelatorioGeral() {
      try {
        const response = await fetch("/api/docente/relatorios");
        if (response.ok) {
          const data = await response.json();
          setRelatorioGeral(data);
        }
      } catch (error) {
        console.error("Erro ao carregar relatório:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRelatorioGeral();
  }, []);

  // Carregar simulados e turmas para os selects
  useEffect(() => {
    async function loadData() {
      try {
        const [simuladosRes, turmasRes] = await Promise.all([
          fetch("/api/simulados"),
          fetch("/api/turmas"),
        ]);

        if (simuladosRes.ok) {
          const data = await simuladosRes.json();
          setSimulados(data.simulados || []);
        }

        if (turmasRes.ok) {
          const data = await turmasRes.json();
          setTurmas(data.turmas || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }

    loadData();
  }, []);

  // Carregar provas quando um simulado for selecionado
  useEffect(() => {
    async function loadProvas() {
      if (!simuladoSelecionado) {
        setProvas([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/simulados/${simuladoSelecionado}/provas`
        );
        if (response.ok) {
          const data = await response.json();
          setProvas(data.provas || []);
        }
      } catch (error) {
        console.error("Erro ao carregar provas:", error);
      }
    }

    loadProvas();
  }, [simuladoSelecionado]);

  // Carregar relatório de prova
  useEffect(() => {
    async function loadRelatorioProva() {
      if (!provaSelecionada) {
        setRelatorioProva(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/docente/relatorios?tipo=prova&provaId=${provaSelecionada}`
        );
        if (response.ok) {
          const data = await response.json();
          setRelatorioProva(data);
        }
      } catch (error) {
        console.error("Erro ao carregar relatório da prova:", error);
      }
    }

    loadRelatorioProva();
  }, [provaSelecionada]);

  // Carregar relatório de turma
  useEffect(() => {
    async function loadRelatorioTurma() {
      if (!turmaSelecionada) {
        setRelatorioTurma(null);
        return;
      }

      setLoadingTurma(true);
      try {
        const response = await fetch(
          `/api/docente/relatorios?tipo=turma&turmaId=${turmaSelecionada}`
        );
        if (response.ok) {
          const data = await response.json();
          setRelatorioTurma(data);
        } else {
          console.error("Erro na resposta:", await response.text());
          toast.error("Erro ao carregar relatório da turma");
        }
      } catch (error) {
        console.error("Erro ao carregar relatório da turma:", error);
        toast.error("Erro ao carregar relatório da turma");
      } finally {
        setLoadingTurma(false);
      }
    }

    loadRelatorioTurma();
  }, [turmaSelecionada]);

  const formatarTempo = (segundos: number | null) => {
    if (!segundos) return "--";
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}min ${segs}s`;
  };

  const getDificuldadeLabel = (dificuldade: string) => {
    const labels: Record<string, string> = {
      FACIL: "Fácil",
      MEDIO: "Médio",
      DIFICIL: "Difícil",
    };
    return labels[dificuldade] || dificuldade;
  };

  const getDificuldadeColor = (dificuldade: string) => {
    const colors: Record<string, string> = {
      FACIL: "bg-green-500/10 text-green-600",
      MEDIO: "bg-yellow-500/10 text-yellow-600",
      DIFICIL: "bg-red-500/10 text-red-600",
    };
    return colors[dificuldade] || "bg-muted";
  };

  const exportarRelatorio = async (tipo: string, id?: string) => {
    try {
      // Import dinâmico para evitar problemas de SSR
      const { gerarRelatorioGeralPDF, gerarRelatorioProvaPDF, gerarRelatorioTurmaPDF } =
        await import("@/lib/pdf/relatorios");

      if (tipo === "geral" && relatorioGeral) {
        gerarRelatorioGeralPDF(relatorioGeral);
        toast.success("Relatório PDF gerado com sucesso!");
        return;
      }

      if (tipo === "prova" && relatorioProva) {
        gerarRelatorioProvaPDF(relatorioProva);
        toast.success("Relatório PDF gerado com sucesso!");
        return;
      }

      if (tipo === "turma" && relatorioTurma) {
        gerarRelatorioTurmaPDF(relatorioTurma);
        toast.success("Relatório PDF gerado com sucesso!");
        return;
      }

      toast.error("Carregue os dados do relatório antes de exportar");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize o desempenho dos alunos em provas e turmas
          </p>
        </div>
        <Button variant="outline" onClick={() => exportarRelatorio("geral")}>
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF Geral
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="prova">Por Prova</TabsTrigger>
          <TabsTrigger value="turma">Por Turma</TabsTrigger>
        </TabsList>

        {/* Tab Geral */}
        <TabsContent value="geral" className="space-y-6">
          {relatorioGeral && (
            <>
              {/* Cards de estatísticas */}
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Simulados
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioGeral.estatisticas.totalSimulados}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Provas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioGeral.estatisticas.totalProvas}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tentativas
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioGeral.estatisticas.totalTentativas}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Turmas</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioGeral.estatisticas.totalTurmas}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alunos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioGeral.estatisticas.totalAlunos}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Simulados e Turmas */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Simulados mais realizados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatorioGeral.topSimulados.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum simulado com tentativas ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {relatorioGeral.topSimulados.map((s, index) => (
                          <div key={s.id} className="flex items-center gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{s.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {s.totalProvas} provas
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{s.totalTentativas}</p>
                              <p className="text-xs text-muted-foreground">
                                tentativas
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Turmas com mais alunos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatorioGeral.topTurmas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma turma cadastrada ainda
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {relatorioGeral.topTurmas.map((t, index) => (
                          <div key={t.id} className="flex items-center gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{t.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                Código: {t.codigo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{t.totalAlunos}</p>
                              <p className="text-xs text-muted-foreground">
                                alunos
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Por Prova */}
        <TabsContent value="prova" className="space-y-6">
          {/* Seleção de prova */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Simulado</label>
                  <Select
                    value={simuladoSelecionado}
                    onValueChange={setSimuladoSelecionado}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um simulado" />
                    </SelectTrigger>
                    <SelectContent>
                      {simulados.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prova</label>
                  <Select
                    value={provaSelecionada}
                    onValueChange={setProvaSelecionada}
                    disabled={!simuladoSelecionado || provas.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma prova" />
                    </SelectTrigger>
                    <SelectContent>
                      {provas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {relatorioProva && (
            <>
              {/* Botão de exportação */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => exportarRelatorio("prova", provaSelecionada)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>

              {/* Estatísticas da prova */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tentativas
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioProva.estatisticas.totalTentativas}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Taxa de Aprovação
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {relatorioProva.estatisticas.taxaAprovacao.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioProva.estatisticas.aprovacoes} aprovados /{" "}
                      {relatorioProva.estatisticas.reprovacoes} reprovados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Média Geral
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioProva.estatisticas.mediaGeral.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mín: {relatorioProva.estatisticas.notaMinima.toFixed(1)}% /
                      Máx: {relatorioProva.estatisticas.notaMaxima.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Desvio Padrão
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioProva.estatisticas.desvioPadrao.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas por questão */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Questão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {relatorioProva.estatisticasQuestoes.map((q) => (
                      <div key={q.questaoId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Q{q.ordem}</span>
                            <Badge
                              variant="outline"
                              className={getDificuldadeColor(q.dificuldade)}
                            >
                              {getDificuldadeLabel(q.dificuldade)}
                            </Badge>
                          </div>
                          <span
                            className={`font-semibold ${
                              q.taxaAcerto >= 70
                                ? "text-green-600"
                                : q.taxaAcerto >= 40
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {q.taxaAcerto.toFixed(1)}% acertos
                          </span>
                        </div>
                        <Progress
                          value={q.taxaAcerto}
                          className={`h-2 ${
                            q.taxaAcerto >= 70
                              ? "[&>div]:bg-green-500"
                              : q.taxaAcerto >= 40
                              ? "[&>div]:bg-yellow-500"
                              : "[&>div]:bg-red-500"
                          }`}
                        />
                        <p className="text-xs text-muted-foreground">
                          {q.acertos} acertos de {q.totalRespostas} respostas
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Ranking de alunos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top 10 Alunos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead className="text-right">Nota</TableHead>
                        <TableHead className="text-right">Acertos</TableHead>
                        <TableHead className="text-right">Tempo</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioProva.ranking.map((r) => (
                        <TableRow key={r.alunoId}>
                          <TableCell>
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                r.posicao === 1
                                  ? "bg-yellow-500/20 text-yellow-600"
                                  : r.posicao === 2
                                  ? "bg-gray-300/20 text-gray-600"
                                  : r.posicao === 3
                                  ? "bg-orange-500/20 text-orange-600"
                                  : "bg-muted"
                              }`}
                            >
                              {r.posicao}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.alunoNome}</p>
                              <p className="text-xs text-muted-foreground">
                                {r.alunoEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {r.nota?.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {r.acertos}/{relatorioProva.prova.notaMinima ? "10" : "--"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatarTempo(r.tempoGasto)}
                          </TableCell>
                          <TableCell className="text-center">
                            {r.aprovado ? (
                              <Badge>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Aprovado
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Reprovado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!provaSelecionada && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Selecione uma prova
                </h3>
                <p className="text-muted-foreground text-center">
                  Escolha um simulado e uma prova para ver o relatório detalhado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Por Turma */}
        <TabsContent value="turma" className="space-y-6">
          {/* Seleção de turma */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Turma</label>
                {turmas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma turma cadastrada. Crie uma turma primeiro.
                  </p>
                ) : (
                  <Select
                    value={turmaSelecionada}
                    onValueChange={setTurmaSelecionada}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {loadingTurma && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {relatorioTurma && !loadingTurma && (
            <>
              {/* Botão de exportação */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => exportarRelatorio("turma", turmaSelecionada)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>

              {/* Estatísticas da turma */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Alunos
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioTurma.estatisticas.totalAlunos}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Alunos Ativos
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {relatorioTurma.estatisticas.alunosAtivos}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioTurma.estatisticas.totalAlunos > 0
                        ? (
                            (relatorioTurma.estatisticas.alunosAtivos /
                              relatorioTurma.estatisticas.totalAlunos) *
                            100
                          ).toFixed(0)
                        : 0}
                      % de participação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Provas Disponíveis
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioTurma.estatisticas.provasDisponiveis}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Média da Turma
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {relatorioTurma.estatisticas.mediaTurma.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desempenho dos alunos */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho dos Alunos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead className="text-center">Provas</TableHead>
                        <TableHead className="text-center">Aprovações</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                        <TableHead className="text-right">Taxa Aprov.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioTurma.desempenhoAlunos.map((a, index) => (
                        <TableRow key={a.alunoId}>
                          <TableCell>
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                index === 0
                                  ? "bg-yellow-500/20 text-yellow-600"
                                  : index === 1
                                  ? "bg-gray-300/20 text-gray-600"
                                  : index === 2
                                  ? "bg-orange-500/20 text-orange-600"
                                  : "bg-muted"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{a.alunoNome}</p>
                              <p className="text-xs text-muted-foreground">
                                {a.alunoEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {a.provasRealizadas}/{a.provasDisponiveis}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium">
                              {a.aprovacoes}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {a.mediaGeral > 0 ? `${a.mediaGeral.toFixed(1)}%` : "--"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${
                                a.taxaAprovacao >= 70
                                  ? "text-green-600"
                                  : a.taxaAprovacao >= 40
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {a.provasRealizadas > 0
                                ? `${a.taxaAprovacao.toFixed(0)}%`
                                : "--"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!turmaSelecionada && !loadingTurma && turmas.length > 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Selecione uma turma
                </h3>
                <p className="text-muted-foreground text-center">
                  Escolha uma turma para ver o relatório de desempenho dos alunos
                </p>
              </CardContent>
            </Card>
          )}

          {turmaSelecionada && !relatorioTurma && !loadingTurma && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum dado disponível
                </h3>
                <p className="text-muted-foreground text-center">
                  Não há dados de desempenho para esta turma ainda
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
