"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Users, FileCheck, Target, TrendingUp } from "lucide-react";
import {
  StatCard,
  RealizacoesChart,
  MediasSimuladosChart,
  DistribuicaoChart,
  RankingTable,
  QuestoesProblematicasCard,
  AlertasCard,
  ExportButtons,
  PeriodoSelector,
  FiltrosDocente,
} from "@/components/dashboard";

interface ResumoData {
  alunosAtivos: number;
  provasRealizadas: number;
  mediaGeral: number;
  taxaAprovacao: number;
  turmaIds: string[];
}

interface RealizacaoData {
  data: string;
  quantidade: number;
}

interface MediaSimuladoData {
  simulado: string;
  media: number;
  totalProvas: number;
}

interface DistribuicaoData {
  faixa: string;
  quantidade: number;
  percentual: number;
  cor: string;
  [key: string]: string | number;
}

interface AlunoRanking {
  posicao: number;
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  notaMedia: number;
  totalProvas: number;
  taxaAprovacao: number;
}

interface QuestaoProblematica {
  questaoId: string;
  enunciado: string;
  simulado: string;
  taxaErro: number;
  vezesRespondida: number;
}

interface AlertasData {
  alunosInativos: number;
  alunosInativosList: { id: string; nome: string }[];
  provasBaixaAprovacao: number;
  provasBaixaAprovacaoList: { id: string; titulo: string; taxa: number }[];
  simuladosNaoPublicados: number;
}

interface Turma {
  id: string;
  nome: string;
}

interface Simulado {
  id: string;
  titulo: string;
}

export default function DocenteDashboardPage() {
  const { data: session, status } = useSession();

  // Filters
  const [periodo, setPeriodo] = useState(30);
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [simuladoId, setSimuladoId] = useState<string | null>(null);

  // Ranking pagination
  const [rankingPage, setRankingPage] = useState(1);
  const [rankingLimit, setRankingLimit] = useState(10);
  const [rankingSearch, setRankingSearch] = useState("");

  // Data
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [resumo, setResumo] = useState<ResumoData | null>(null);
  const [realizacoes, setRealizacoes] = useState<RealizacaoData[]>([]);
  const [mediasSimulados, setMediasSimulados] = useState<MediaSimuladoData[]>([]);
  const [distribuicao, setDistribuicao] = useState<DistribuicaoData[]>([]);
  const [ranking, setRanking] = useState<{
    alunos: AlunoRanking[];
    total: number;
    page: number;
    totalPages: number;
  }>({ alunos: [], total: 0, page: 1, totalPages: 0 });
  const [questoesProblematicas, setQuestoesProblematicas] = useState<QuestaoProblematica[]>([]);
  const [alertas, setAlertas] = useState<AlertasData | null>(null);

  const [loading, setLoading] = useState({
    resumo: true,
    realizacoes: true,
    mediasSimulados: true,
    distribuicao: true,
    ranking: true,
    questoesProblematicas: true,
    alertas: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (session?.user?.role && !["DOCENTE", "SUPERADMIN"].includes(session.user.role)) {
      redirect("/");
    }
  }, [session, status]);

  // Fetch turmas and simulados for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [turmasRes, simuladosRes] = await Promise.all([
          fetch("/api/turmas"),
          fetch("/api/simulados"),
        ]);

        if (turmasRes.ok) {
          const data = await turmasRes.json();
          setTurmas(data.turmas || data || []);
        }
        if (simuladosRes.ok) {
          const data = await simuladosRes.json();
          setSimulados(data.simulados || data || []);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };

    if (session?.user?.id) {
      fetchFilters();
    }
  }, [session?.user?.id]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      periodo: periodo.toString(),
    });
    if (turmaId) params.append("turmaId", turmaId);
    if (simuladoId) params.append("simuladoId", simuladoId);

    const fetchResumo = async () => {
      try {
        const res = await fetch(`/api/docente/dashboard/resumo?${params}`);
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

    const fetchRealizacoes = async () => {
      try {
        const res = await fetch(`/api/docente/dashboard/realizacoes?${params}`);
        if (res.ok) {
          const data = await res.json();
          setRealizacoes(data);
        }
      } catch (error) {
        console.error("Error fetching realizacoes:", error);
      } finally {
        setLoading((prev) => ({ ...prev, realizacoes: false }));
      }
    };

    const fetchMediasSimulados = async () => {
      try {
        const res = await fetch(`/api/docente/dashboard/medias-simulados?${params}`);
        if (res.ok) {
          const data = await res.json();
          setMediasSimulados(data);
        }
      } catch (error) {
        console.error("Error fetching medias simulados:", error);
      } finally {
        setLoading((prev) => ({ ...prev, mediasSimulados: false }));
      }
    };

    const fetchDistribuicao = async () => {
      try {
        const res = await fetch(`/api/docente/dashboard/distribuicao?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDistribuicao(data);
        }
      } catch (error) {
        console.error("Error fetching distribuicao:", error);
      } finally {
        setLoading((prev) => ({ ...prev, distribuicao: false }));
      }
    };

    const fetchQuestoesProblematicas = async () => {
      try {
        const res = await fetch("/api/docente/dashboard/questoes-problematicas?limit=10");
        if (res.ok) {
          const data = await res.json();
          setQuestoesProblematicas(data);
        }
      } catch (error) {
        console.error("Error fetching questoes problematicas:", error);
      } finally {
        setLoading((prev) => ({ ...prev, questoesProblematicas: false }));
      }
    };

    const fetchAlertas = async () => {
      try {
        const res = await fetch("/api/docente/dashboard/alertas");
        if (res.ok) {
          const data = await res.json();
          setAlertas(data);
        }
      } catch (error) {
        console.error("Error fetching alertas:", error);
      } finally {
        setLoading((prev) => ({ ...prev, alertas: false }));
      }
    };

    setLoading({
      resumo: true,
      realizacoes: true,
      mediasSimulados: true,
      distribuicao: true,
      ranking: true,
      questoesProblematicas: true,
      alertas: true,
    });

    await Promise.all([
      fetchResumo(),
      fetchRealizacoes(),
      fetchMediasSimulados(),
      fetchDistribuicao(),
      fetchQuestoesProblematicas(),
      fetchAlertas(),
    ]);
  }, [periodo, turmaId, simuladoId]);

  // Fetch ranking separately (has pagination)
  const fetchRanking = useCallback(async () => {
    const params = new URLSearchParams({
      periodo: periodo.toString(),
      page: rankingPage.toString(),
      limit: rankingLimit.toString(),
    });
    if (turmaId) params.append("turmaId", turmaId);
    if (simuladoId) params.append("simuladoId", simuladoId);
    if (rankingSearch) params.append("search", rankingSearch);

    setLoading((prev) => ({ ...prev, ranking: true }));
    try {
      const res = await fetch(`/api/docente/dashboard/ranking?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRanking(data);
      }
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setLoading((prev) => ({ ...prev, ranking: false }));
    }
  }, [periodo, turmaId, simuladoId, rankingPage, rankingLimit, rankingSearch]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id, fetchData]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRanking();
    }
  }, [session?.user?.id, fetchRanking]);

  // Reset ranking page when filters change
  useEffect(() => {
    setRankingPage(1);
  }, [periodo, turmaId, simuladoId]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userName = session?.user?.nome?.split(" ")[0] || "Docente";

  const getPeriodoLabel = () => {
    switch (periodo) {
      case 7:
        return "Últimos 7 dias";
      case 30:
        return "Últimos 30 dias";
      case 90:
        return "Últimos 3 meses";
      default:
        return "Todo o período";
    }
  };

  const exportData = {
    resumo: resumo || { alunosAtivos: 0, provasRealizadas: 0, mediaGeral: 0, taxaAprovacao: 0 },
    ranking: ranking.alunos,
    realizacoes,
    questoesProblematicas,
    periodo: getPeriodoLabel(),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {userName}!
          </p>
        </div>
        <ExportButtons data={exportData} loading={loading.resumo} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PeriodoSelector value={periodo} onChange={setPeriodo} />
        <FiltrosDocente
          turmas={turmas}
          simulados={simulados}
          turmaId={turmaId}
          simuladoId={simuladoId}
          onTurmaChange={setTurmaId}
          onSimuladoChange={setSimuladoId}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Alunos Ativos"
          value={resumo?.alunosAtivos ?? "--"}
          icon={Users}
          description="no período"
          loading={loading.resumo}
        />
        <StatCard
          title="Provas Realizadas"
          value={resumo?.provasRealizadas ?? "--"}
          icon={FileCheck}
          description="no período"
          loading={loading.resumo}
        />
        <StatCard
          title="Média Geral"
          value={resumo ? `${resumo.mediaGeral}%` : "--"}
          icon={Target}
          loading={loading.resumo}
          iconClassName={
            resumo && resumo.mediaGeral >= 70
              ? "bg-green-500/10"
              : resumo && resumo.mediaGeral >= 50
              ? "bg-yellow-500/10"
              : "bg-red-500/10"
          }
        />
        <StatCard
          title="Taxa de Aprovação"
          value={resumo ? `${resumo.taxaAprovacao}%` : "--"}
          icon={TrendingUp}
          loading={loading.resumo}
          iconClassName={
            resumo && resumo.taxaAprovacao >= 70
              ? "bg-green-500/10"
              : resumo && resumo.taxaAprovacao >= 50
              ? "bg-yellow-500/10"
              : "bg-red-500/10"
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RealizacoesChart data={realizacoes} loading={loading.realizacoes} />
        <MediasSimuladosChart data={mediasSimulados} loading={loading.mediasSimulados} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DistribuicaoChart data={distribuicao} loading={loading.distribuicao} />
        <AlertasCard alertas={alertas} loading={loading.alertas} />
      </div>

      {/* Ranking Table */}
      <RankingTable
        alunos={ranking.alunos}
        total={ranking.total}
        page={ranking.page}
        totalPages={ranking.totalPages}
        loading={loading.ranking}
        onPageChange={setRankingPage}
        onSearch={setRankingSearch}
        onLimitChange={(limit) => {
          setRankingLimit(parseInt(limit));
          setRankingPage(1);
        }}
      />

      {/* Questões Problemáticas */}
      <QuestoesProblematicasCard
        questoes={questoesProblematicas}
        loading={loading.questoesProblematicas}
      />
    </div>
  );
}
