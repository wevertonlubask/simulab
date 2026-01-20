"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Lock,
  Star,
  Trophy,
  Flame,
  Target,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { XPBar } from "@/components/gamification/XPBar";
import { NivelBadge } from "@/components/gamification/NivelBadge";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { ConquistaCard } from "@/components/gamification/ConquistaCard";
import { LeaderboardTable } from "@/components/gamification/LeaderboardTable";

interface Conquista {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: string;
  xpBonus: number;
  ordem: number;
  desbloqueada: boolean;
  desbloqueadaEm?: string | null;
  progresso: number;
  progressoAtual: number;
  progressoTotal: number;
}

interface NivelInfo {
  nivel: number;
  nome: string;
  xpAtual: number;
  xpNecessario: number;
  xpProximoNivel: number;
  progresso: number;
}

interface GamificationPerfil {
  xp: number;
  nivel: NivelInfo;
  streak: number;
  maiorStreak: number;
  ultimaAtividade: string | null;
  conquistasDesbloqueadas: number;
  conquistasTotal: number;
  ultimaConquista: Conquista | null;
}

interface LeaderboardEntry {
  posicao: number;
  userId: string;
  nome: string;
  avatar: string | null;
  xp: number;
  nivel: number;
  nomeNivel: string;
}

interface ConquistasData {
  conquistas: Conquista[];
  porCategoria: Record<string, Conquista[]>;
  estatisticas: {
    total: number;
    desbloqueadas: number;
    progressoGeral: number;
    xpTotalConquistas: number;
  };
  proximaConquista: Conquista | null;
}

const CATEGORIA_CONFIG: Record<string, { label: string; icon: typeof Trophy; color: string }> = {
  PROVAS: { label: "Provas", icon: Target, color: "text-blue-500" },
  NOTAS: { label: "Notas", icon: Star, color: "text-green-500" },
  STREAKS: { label: "Streaks", icon: Flame, color: "text-orange-500" },
  ESPECIAIS: { label: "Especiais", icon: Zap, color: "text-purple-500" },
};

export default function ConquistasPage() {
  const [perfil, setPerfil] = useState<GamificationPerfil | null>(null);
  const [conquistas, setConquistas] = useState<ConquistasData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conquistas");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "desbloqueadas" | "bloqueadas">("todas");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perfilRes, conquistasRes, leaderboardRes] = await Promise.all([
        fetch("/api/gamification/me"),
        fetch("/api/gamification/conquistas"),
        fetch("/api/gamification/leaderboard?periodo=30&limit=50"),
      ]);

      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        setPerfil(perfilData);
      }

      if (conquistasRes.ok) {
        const conquistasData = await conquistasRes.json();
        setConquistas(conquistasData);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard);
        // Encontrar userId do usuário atual na entrada do leaderboard
        if (leaderboardData.minhaEntrada) {
          setCurrentUserId(leaderboardData.minhaEntrada.userId);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const conquistasFiltradas = conquistas?.conquistas.filter((c) => {
    if (filtroCategoria && c.categoria !== filtroCategoria) return false;
    if (filtroStatus === "desbloqueadas" && !c.desbloqueada) return false;
    if (filtroStatus === "bloqueadas" && c.desbloqueada) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Conquistas & Gamificação
          </h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Conquistas & Gamificação
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, níveis e conquistas
        </p>
      </div>

      {/* Perfil de Gamificação */}
      {perfil && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* XP e Nível */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Seu Nível</CardTitle>
                <NivelBadge nivel={perfil.nivel.nivel} nome={perfil.nivel.nome} />
              </div>
            </CardHeader>
            <CardContent>
              <XPBar
                xpAtual={perfil.nivel.xpAtual}
                xpNecessario={perfil.nivel.xpNecessario}
                xpProximoNivel={perfil.nivel.xpProximoNivel}
                nivelAtual={perfil.nivel.nivel}
                nomeNivel={perfil.nivel.nome}
                progresso={perfil.nivel.progresso}
              />
            </CardContent>
          </Card>

          {/* Streak */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <StreakCounter
                  streak={perfil.streak}
                  maiorStreak={perfil.maiorStreak}
                  size="lg"
                />
                {perfil.maiorStreak > perfil.streak && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Recorde: {perfil.maiorStreak} dias
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conquistas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                {perfil.conquistasDesbloqueadas}/{perfil.conquistasTotal}
              </div>
              <Progress
                value={(perfil.conquistasDesbloqueadas / perfil.conquistasTotal) * 100}
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground text-center mt-1">
                {Math.round((perfil.conquistasDesbloqueadas / perfil.conquistasTotal) * 100)}% completo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Próxima Conquista */}
      {conquistas?.proximaConquista && (
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Próxima Conquista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl">{conquistas.proximaConquista.icone}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{conquistas.proximaConquista.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {conquistas.proximaConquista.descricao}
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span>
                      {conquistas.proximaConquista.progressoAtual} / {conquistas.proximaConquista.progressoTotal}
                    </span>
                  </div>
                  <Progress value={conquistas.proximaConquista.progresso} className="h-2" />
                </div>
              </div>
              <Badge variant="outline">+{conquistas.proximaConquista.xpBonus} XP</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Conquistas e Leaderboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="conquistas" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Conquistas
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking XP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conquistas" className="space-y-4">
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
                <CheckCircle className="h-3 w-3 mr-1" />
                Desbloqueadas
              </Badge>
              <Badge
                variant={filtroStatus === "bloqueadas" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFiltroStatus("bloqueadas")}
              >
                <Lock className="h-3 w-3 mr-1" />
                Bloqueadas
              </Badge>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex gap-2">
              <Badge
                variant={filtroCategoria === null ? "secondary" : "outline"}
                className="cursor-pointer"
                onClick={() => setFiltroCategoria(null)}
              >
                Todas categorias
              </Badge>
              {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <Badge
                    key={key}
                    variant={filtroCategoria === key ? "secondary" : "outline"}
                    className={cn("cursor-pointer", filtroCategoria === key && config.color)}
                    onClick={() => setFiltroCategoria(key)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Grid de Conquistas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conquistasFiltradas.map((conquista) => (
              <ConquistaCard
                key={conquista.id}
                codigo={conquista.codigo}
                nome={conquista.nome}
                descricao={conquista.descricao}
                icone={conquista.icone}
                categoria={conquista.categoria}
                xpBonus={conquista.xpBonus}
                desbloqueada={conquista.desbloqueada}
                desbloqueadaEm={conquista.desbloqueadaEm}
                progresso={conquista.progresso}
                progressoAtual={conquista.progressoAtual}
                progressoTotal={conquista.progressoTotal}
              />
            ))}
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

          {/* Legenda de Categorias */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex flex-wrap gap-4">
                {Object.entries(CATEGORIA_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", config.color)} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ranking por XP
              </CardTitle>
              <CardDescription>
                Os jogadores com mais XP nos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                entries={leaderboard}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
