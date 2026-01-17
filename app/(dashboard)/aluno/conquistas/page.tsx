"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  BookOpen,
  CheckCircle,
  Crown,
  Flame,
  GraduationCap,
  Lock,
  Medal,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Book,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conquista {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  pontos: number;
  raridade: string;
  desbloqueada: boolean;
  desbloqueadaEm?: string;
}

interface Estatisticas {
  total: number;
  desbloqueadas: number;
  pontosTotais: number;
  progresso: number;
}

const iconeMap: Record<string, React.ReactNode> = {
  rocket: <Rocket className="h-6 w-6" />,
  "check-circle": <CheckCircle className="h-6 w-6" />,
  flame: <Flame className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  "trending-up": <TrendingUp className="h-6 w-6" />,
  medal: <Medal className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
  "book-open": <BookOpen className="h-6 w-6" />,
  "graduation-cap": <GraduationCap className="h-6 w-6" />,
  shield: <Shield className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  book: <Book className="h-6 w-6" />,
};

const raridadeConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  comum: {
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
  },
  incomum: {
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  raro: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
  épico: {
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  lendário: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
  },
};

export default function ConquistasPage() {
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroRaridade, setFiltroRaridade] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "desbloqueadas" | "bloqueadas">("todas");

  useEffect(() => {
    fetchConquistas();
  }, []);

  const fetchConquistas = async () => {
    try {
      const response = await fetch("/api/aluno/conquistas");
      const data = await response.json();
      setConquistas(data.conquistas);
      setEstatisticas(data.estatisticas);
    } catch (error) {
      console.error("Erro ao buscar conquistas:", error);
    } finally {
      setLoading(false);
    }
  };

  const conquistasFiltradas = conquistas.filter((c) => {
    if (filtroRaridade && c.raridade !== filtroRaridade) return false;
    if (filtroStatus === "desbloqueadas" && !c.desbloqueada) return false;
    if (filtroStatus === "bloqueadas" && c.desbloqueada) return false;
    return true;
  });

  const raridadesDisponiveis = Array.from(new Set(conquistas.map((c) => c.raridade)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conquistas</h1>
          <p className="text-muted-foreground">Desbloqueie conquistas ao completar desafios</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conquistas</h1>
        <p className="text-muted-foreground">
          Desbloqueie conquistas ao completar desafios
        </p>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {estatisticas.desbloqueadas}/{estatisticas.total}
              </div>
              <Progress value={estatisticas.progresso} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {estatisticas.progresso}% completo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.pontosTotais}</div>
              <p className="text-xs text-muted-foreground">pontos acumulados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desbloqueadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estatisticas.desbloqueadas}
              </div>
              <p className="text-xs text-muted-foreground">conquistas obtidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {estatisticas.total - estatisticas.desbloqueadas}
              </div>
              <p className="text-xs text-muted-foreground">ainda por conquistar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2">
          <Badge
            variant={filtroStatus === "todas" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroStatus("todas")}
          >
            Todas
          </Badge>
          <Badge
            variant={filtroStatus === "desbloqueadas" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroStatus("desbloqueadas")}
          >
            Desbloqueadas
          </Badge>
          <Badge
            variant={filtroStatus === "bloqueadas" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroStatus("bloqueadas")}
          >
            Bloqueadas
          </Badge>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex gap-2">
          <Badge
            variant={filtroRaridade === null ? "secondary" : "outline"}
            className="cursor-pointer"
            onClick={() => setFiltroRaridade(null)}
          >
            Todas raridades
          </Badge>
          {raridadesDisponiveis.map((raridade) => (
            <Badge
              key={raridade}
              variant={filtroRaridade === raridade ? "secondary" : "outline"}
              className={cn(
                "cursor-pointer",
                filtroRaridade === raridade && raridadeConfig[raridade]?.color
              )}
              onClick={() => setFiltroRaridade(raridade)}
            >
              {raridade.charAt(0).toUpperCase() + raridade.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid de Conquistas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conquistasFiltradas.map((conquista) => {
          const config = raridadeConfig[conquista.raridade] || raridadeConfig.comum;

          return (
            <Card
              key={conquista.id}
              className={cn(
                "relative overflow-hidden transition-all",
                conquista.desbloqueada
                  ? `border-2 ${config.borderColor}`
                  : "opacity-60 grayscale"
              )}
            >
              {conquista.desbloqueada && (
                <div
                  className={cn(
                    "absolute top-0 right-0 px-2 py-1 text-xs font-medium",
                    config.bgColor,
                    config.color
                  )}
                >
                  +{conquista.pontos} pts
                </div>
              )}

              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full",
                      conquista.desbloqueada
                        ? config.bgColor
                        : "bg-muted"
                    )}
                  >
                    {conquista.desbloqueada ? (
                      <span className={config.color}>
                        {iconeMap[conquista.icone] || <Trophy className="h-6 w-6" />}
                      </span>
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{conquista.nome}</h3>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", config.color)}
                      >
                        {conquista.raridade}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conquista.descricao}
                    </p>
                    {conquista.desbloqueada && conquista.desbloqueadaEm && (
                      <p className="text-xs text-muted-foreground">
                        Desbloqueada em{" "}
                        {format(new Date(conquista.desbloqueadaEm), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {conquistasFiltradas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conquista encontrada</h3>
            <p className="text-muted-foreground text-center">
              Tente alterar os filtros para ver mais conquistas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legenda de raridades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Raridades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(raridadeConfig).map(([raridade, config]) => (
              <div key={raridade} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", config.bgColor)} />
                <span className={cn("text-sm", config.color)}>
                  {raridade.charAt(0).toUpperCase() + raridade.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
