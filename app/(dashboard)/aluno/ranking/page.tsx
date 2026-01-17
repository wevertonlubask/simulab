"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Target,
  Loader2,
  User,
  Star,
} from "lucide-react";
import { toast } from "sonner";

interface RankingItem {
  posicao: number;
  aluno: {
    id: string;
    nome: string;
    avatar: string | null;
  };
  totalTentativas: number;
  totalAprovacoes: number;
  mediaNotas: number;
  melhorNota: number;
  provasRealizadas: number;
  taxaAprovacao: number;
  pontuacao: number;
}

interface Estatisticas {
  totalParticipantes: number;
  totalTentativas: number;
  mediaGeralNotas: number;
}

interface Turma {
  id: string;
  nome: string;
}

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [minhasEstatisticas, setMinhasEstatisticas] = useState<RankingItem | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [periodo, setPeriodo] = useState("todos");
  const [turmaId, setTurmaId] = useState("");
  const [tipo, setTipo] = useState("geral");

  // Carregar turmas do aluno
  useEffect(() => {
    async function loadTurmas() {
      try {
        const response = await fetch("/api/aluno/turmas");
        if (response.ok) {
          const data = await response.json();
          setTurmas(data.turmas || []);
        }
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
      }
    }
    loadTurmas();
  }, []);

  // Carregar ranking
  useEffect(() => {
    async function loadRanking() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tipo, periodo });
        if (tipo === "turma" && turmaId) {
          params.append("turmaId", turmaId);
        }

        const response = await fetch(`/api/ranking?${params}`);
        if (response.ok) {
          const data = await response.json();
          setRanking(data.ranking || []);
          setMinhasEstatisticas(data.minhasEstatisticas || null);
          setEstatisticas(data.estatisticas || null);
        } else {
          toast.error("Erro ao carregar ranking");
        }
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
        toast.error("Erro ao carregar ranking");
      } finally {
        setLoading(false);
      }
    }

    if (tipo === "geral" || (tipo === "turma" && turmaId)) {
      loadRanking();
    }
  }, [tipo, periodo, turmaId]);

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium">{posicao}º</span>;
    }
  };

  const getPosicaoBadge = (posicao: number) => {
    if (posicao === 1) return "bg-yellow-500";
    if (posicao === 2) return "bg-gray-400";
    if (posicao === 3) return "bg-amber-600";
    if (posicao <= 10) return "bg-primary";
    return "bg-muted";
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Ranking
        </h1>
        <p className="text-muted-foreground">
          Veja sua posição e compare seu desempenho com outros alunos
        </p>
      </div>

      {/* Minhas Estatísticas */}
      {minhasEstatisticas && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Minha Posição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center justify-center h-16 w-16 rounded-full ${getPosicaoBadge(
                    minhasEstatisticas.posicao
                  )} text-white`}
                >
                  {minhasEstatisticas.posicao <= 3 ? (
                    getPosicaoIcon(minhasEstatisticas.posicao)
                  ) : (
                    <span className="text-2xl font-bold">
                      {minhasEstatisticas.posicao}º
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {minhasEstatisticas.pontuacao} pts
                  </p>
                  <p className="text-sm text-muted-foreground">Pontuação Total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {minhasEstatisticas.provasRealizadas}
                  </p>
                  <p className="text-xs text-muted-foreground">Provas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {minhasEstatisticas.mediaNotas.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {minhasEstatisticas.melhorNota.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Melhor Nota</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {minhasEstatisticas.taxaAprovacao.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Aprovação</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Tabs value={tipo} onValueChange={setTipo} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">
                  <Trophy className="h-4 w-4 mr-2" />
                  Ranking Geral
                </TabsTrigger>
                <TabsTrigger value="turma">
                  <Target className="h-4 w-4 mr-2" />
                  Por Turma
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tipo === "turma" && (
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger className="w-full md:w-[200px]">
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

            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="mes">Último mês</SelectItem>
                <SelectItem value="semana">Última semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Participantes</CardDescription>
              <CardTitle className="text-2xl">
                {estatisticas.totalParticipantes}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Tentativas</CardDescription>
              <CardTitle className="text-2xl">
                {estatisticas.totalTentativas}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Média Geral</CardDescription>
              <CardTitle className="text-2xl">
                {estatisticas.mediaGeralNotas.toFixed(1)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabela de Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 50
          </CardTitle>
          <CardDescription>
            Os melhores desempenhos do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de ranking disponível</p>
              <p className="text-sm mt-2">
                {tipo === "turma" && !turmaId
                  ? "Selecione uma turma para ver o ranking"
                  : "Complete algumas provas para aparecer no ranking"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos.</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-center">Pontuação</TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    Provas
                  </TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    Média
                  </TableHead>
                  <TableHead className="text-center hidden lg:table-cell">
                    Melhor
                  </TableHead>
                  <TableHead className="text-center hidden lg:table-cell">
                    Aprovação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((item, index) => (
                  <TableRow
                    key={item.aluno.id}
                    className={
                      item.aluno.id === minhasEstatisticas?.aluno?.id
                        ? "bg-primary/5"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {getPosicaoIcon(item.posicao)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.aluno.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(item.aluno.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.aluno.nome}</p>
                          {item.posicao <= 3 && (
                            <div className="flex gap-1">
                              {item.posicao === 1 && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                  Líder
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.posicao <= 10 ? "default" : "secondary"}
                      >
                        {item.pontuacao} pts
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {item.provasRealizadas}
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {item.mediaNotas.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      {item.melhorNota.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <Badge
                        variant={
                          item.taxaAprovacao >= 70 ? "default" : "outline"
                        }
                      >
                        {item.taxaAprovacao.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
