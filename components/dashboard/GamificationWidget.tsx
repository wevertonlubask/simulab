"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, ChevronRight, Star, Target } from "lucide-react";
import { NivelBadge } from "@/components/gamification/NivelBadge";
import { StreakCounter } from "@/components/gamification/StreakCounter";

interface NivelInfo {
  nivel: number;
  nome: string;
  xpAtual: number;
  xpNecessario: number;
  xpProximoNivel: number;
  progresso: number;
}

interface Conquista {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  xpBonus: number;
  desbloqueadaEm?: string;
}

interface ProximaConquista {
  id: string;
  nome: string;
  icone: string;
  progresso: number;
  progressoAtual: number;
  progressoTotal: number;
}

interface GamificationData {
  xp: number;
  nivel: NivelInfo;
  streak: number;
  maiorStreak: number;
  ultimaAtividade: string | null;
  conquistasDesbloqueadas: number;
  conquistasTotal: number;
  ultimaConquista: Conquista | null;
  proximaConquista?: ProximaConquista | null;
}

interface GamificationWidgetProps {
  className?: string;
}

export function GamificationWidget({ className }: GamificationWidgetProps) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [proximaConquista, setProximaConquista] = useState<ProximaConquista | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [perfilRes, conquistasRes] = await Promise.all([
          fetch("/api/gamification/me"),
          fetch("/api/gamification/conquistas"),
        ]);

        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          setData(perfilData);
        }

        if (conquistasRes.ok) {
          const conquistasData = await conquistasRes.json();
          setProximaConquista(conquistasData.proximaConquista);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de gamificação:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Não foi possível carregar gamificação</p>
        </CardContent>
      </Card>
    );
  }

  const xpNoNivel = data.nivel.xpAtual - data.nivel.xpNecessario;
  const xpParaProximo = data.nivel.xpProximoNivel - data.nivel.xpNecessario;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível e XP */}
        <div className="flex items-center gap-4">
          <NivelBadge nivel={data.nivel.nivel} nome={data.nivel.nome} size="lg" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">Nível {data.nivel.nivel}</span>
              <span className="text-sm text-muted-foreground">
                {xpNoNivel.toLocaleString()} / {xpParaProximo.toLocaleString()} XP
              </span>
            </div>
            <Progress value={data.nivel.progresso} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{data.nivel.nome}</p>
          </div>
        </div>

        {/* Streak e Conquistas */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <StreakCounter streak={data.streak} maiorStreak={data.maiorStreak} size="md" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>
              {data.conquistasDesbloqueadas}/{data.conquistasTotal}
            </span>
          </div>
        </div>

        {/* Última conquista */}
        {data.ultimaConquista && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <span className="text-xl">{data.ultimaConquista.icone}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{data.ultimaConquista.nome}</p>
              <p className="text-xs text-muted-foreground">Última conquista</p>
            </div>
            <Badge variant="outline" className="text-xs">
              +{data.ultimaConquista.xpBonus} XP
            </Badge>
          </div>
        )}

        {/* Próxima conquista */}
        {proximaConquista && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-dashed">
            <span className="text-xl opacity-50">{proximaConquista.icone}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{proximaConquista.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={proximaConquista.progresso} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {proximaConquista.progressoAtual}/{proximaConquista.progressoTotal}
                </span>
              </div>
            </div>
            <Target className="h-4 w-4 text-primary" />
          </div>
        )}

        {/* Link para conquistas */}
        <Link
          href="/aluno/conquistas"
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
        >
          Ver todas conquistas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
