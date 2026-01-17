"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Target,
  Trophy,
  CheckCircle2,
  Flame,
} from "lucide-react";
import {
  StatCard,
  EvolucaoChart,
  CategoriasChart,
  RadarDesempenho,
  ProvasPendentesCard,
  UltimasProvasCard,
  QuestoesRevisarCard,
  StreakWidget,
} from "@/components/dashboard";

interface ResumoData {
  notaMedia: number;
  totalProvas: number;
  taxaAprovacao: number;
  streak: number;
  variacao: number;
}

interface EvolucaoData {
  data: string;
  prova: string;
  nota: number;
}

interface CategoriaData {
  categoria: string;
  taxaAcerto: number;
  totalQuestoes: number;
}

interface TagData {
  tag: string;
  taxaAcerto: number;
  total: number;
}

interface ProvaPendente {
  id: string;
  titulo: string;
  turma: string;
  turmaId: string;
  prazo: string | null;
  tentativasRestantes: number;
  tempoLimite: number | null;
}

interface UltimaProva {
  id: string;
  titulo: string;
  categoria: string | null;
  nota: number | null;
  aprovado: boolean | null;
  data: string;
}

interface QuestaoRevisar {
  questaoId: string;
  enunciado: string;
  simulado: string;
  categoria: string;
  vezesErrada: number;
}

export default function AlunoDashboardPage() {
  const { data: session, status } = useSession();
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [evolucao, setEvolucao] = useState<EvolucaoData[]>([]);
  const [categorias, setCategorias] = useState<CategoriaData[]>([]);
  const [tags, setTags] = useState<TagData[]>([]);
  const [provasPendentes, setProvasPendentes] = useState<ProvaPendente[]>([]);
  const [ultimasProvas, setUltimasProvas] = useState<UltimaProva[]>([]);
  const [questoesRevisar, setQuestoesRevisar] = useState<QuestaoRevisar[]>([]);
  const [loading, setLoading] = useState({
    resumo: true,
    evolucao: true,
    categorias: true,
    tags: true,
    provasPendentes: true,
    ultimasProvas: true,
    questoesRevisar: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (session?.user?.role !== "ALUNO") {
      redirect("/");
    }
  }, [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all data in parallel
      const fetchResumo = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/resumo");
          if (res.ok) {
            const data = await res.json();
            setResumo(data);
          }
        } catch (error) {
          console.error("Error fetching resumo:", error);
        } finally {
          setLoading((prev) => ({ ...prev, resumo: false }));
        }
      };

      const fetchEvolucao = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/evolucao?limit=20");
          if (res.ok) {
            const data = await res.json();
            setEvolucao(data);
          }
        } catch (error) {
          console.error("Error fetching evolucao:", error);
        } finally {
          setLoading((prev) => ({ ...prev, evolucao: false }));
        }
      };

      const fetchCategorias = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/categorias");
          if (res.ok) {
            const data = await res.json();
            setCategorias(data);
          }
        } catch (error) {
          console.error("Error fetching categorias:", error);
        } finally {
          setLoading((prev) => ({ ...prev, categorias: false }));
        }
      };

      const fetchTags = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/tags");
          if (res.ok) {
            const data = await res.json();
            setTags(data);
          }
        } catch (error) {
          console.error("Error fetching tags:", error);
        } finally {
          setLoading((prev) => ({ ...prev, tags: false }));
        }
      };

      const fetchProvasPendentes = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/provas-pendentes?limit=5");
          if (res.ok) {
            const data = await res.json();
            setProvasPendentes(data);
          }
        } catch (error) {
          console.error("Error fetching provas pendentes:", error);
        } finally {
          setLoading((prev) => ({ ...prev, provasPendentes: false }));
        }
      };

      const fetchUltimasProvas = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/ultimas-provas?limit=5");
          if (res.ok) {
            const data = await res.json();
            setUltimasProvas(data);
          }
        } catch (error) {
          console.error("Error fetching ultimas provas:", error);
        } finally {
          setLoading((prev) => ({ ...prev, ultimasProvas: false }));
        }
      };

      const fetchQuestoesRevisar = async () => {
        try {
          const res = await fetch("/api/aluno/dashboard/questoes-revisar?limit=5");
          if (res.ok) {
            const data = await res.json();
            setQuestoesRevisar(data);
          }
        } catch (error) {
          console.error("Error fetching questoes revisar:", error);
        } finally {
          setLoading((prev) => ({ ...prev, questoesRevisar: false }));
        }
      };

      await Promise.all([
        fetchResumo(),
        fetchEvolucao(),
        fetchCategorias(),
        fetchTags(),
        fetchProvasPendentes(),
        fetchUltimasProvas(),
        fetchQuestoesRevisar(),
      ]);
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userName = session?.user?.nome?.split(" ")[0] || "Aluno";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e continue evoluindo
          </p>
        </div>
        {resumo && resumo.streak > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2 text-orange-500">
            <Flame className="h-5 w-5" />
            <span className="font-bold">{resumo.streak} dias</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Nota Média"
          value={resumo ? `${resumo.notaMedia}%` : "--"}
          icon={Target}
          trend={resumo?.variacao}
          trendLabel="vs. mês anterior"
          loading={loading.resumo}
        />
        <StatCard
          title="Provas Realizadas"
          value={resumo?.totalProvas ?? "--"}
          icon={Trophy}
          loading={loading.resumo}
        />
        <StatCard
          title="Taxa de Aprovação"
          value={resumo ? `${resumo.taxaAprovacao}%` : "--"}
          icon={CheckCircle2}
          loading={loading.resumo}
          iconClassName={
            resumo && resumo.taxaAprovacao >= 70
              ? "bg-green-500/10"
              : resumo && resumo.taxaAprovacao >= 50
              ? "bg-yellow-500/10"
              : "bg-red-500/10"
          }
        />
        <StatCard
          title="Sequência Atual"
          value={resumo ? `${resumo.streak} 🔥` : "--"}
          icon={Flame}
          description="dias consecutivos"
          loading={loading.resumo}
          iconClassName="bg-orange-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EvolucaoChart data={evolucao} loading={loading.evolucao} />
        <CategoriasChart data={categorias} loading={loading.categorias} />
      </div>

      {/* Radar and Streak Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RadarDesempenho data={tags} loading={loading.tags} />
        <StreakWidget
          streak={resumo?.streak || 0}
          xp={resumo ? resumo.totalProvas * 10 : 0}
          xpNextLevel={100}
          level={resumo ? Math.floor(resumo.totalProvas / 10) + 1 : 1}
          loading={loading.resumo}
        />
      </div>

      {/* Lists Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProvasPendentesCard
          provas={provasPendentes}
          loading={loading.provasPendentes}
        />
        <UltimasProvasCard
          provas={ultimasProvas}
          loading={loading.ultimasProvas}
        />
      </div>

      {/* Questões para Revisar */}
      <QuestoesRevisarCard
        questoes={questoesRevisar}
        loading={loading.questoesRevisar}
      />
    </div>
  );
}
