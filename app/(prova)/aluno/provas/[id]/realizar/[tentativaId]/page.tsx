"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Loader2, Menu, Send, LogOut, AlertTriangle, Keyboard } from "lucide-react";
import { ProvaTimer } from "@/components/prova/ProvaTimer";
import { QuestaoContainer } from "@/components/prova/QuestaoContainer";
import { QuestaoNavegacao } from "@/components/prova/QuestaoNavegacao";
import { KeyboardShortcutsModal } from "@/components/prova/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { TipoQuestao } from "@prisma/client";

// Função auxiliar para verificar se uma resposta está realmente preenchida
function isRespostaPreenchida(resposta: unknown, tipo: TipoQuestao): boolean {
  if (resposta === undefined || resposta === null) return false;

  switch (tipo) {
    case "MULTIPLA_ESCOLHA_UNICA": {
      const r = resposta as { alternativaId?: string };
      return !!r.alternativaId;
    }
    case "MULTIPLA_ESCOLHA_MULTIPLA": {
      const r = resposta as { alternativasIds?: string[] };
      return Array.isArray(r.alternativasIds) && r.alternativasIds.length > 0;
    }
    case "DRAG_DROP": {
      const r = resposta as { posicoes?: Record<string, string[]> };
      if (!r.posicoes) return false;
      // Verificar se alguma zona tem itens
      return Object.values(r.posicoes).some(
        (items) => Array.isArray(items) && items.length > 0
      );
    }
    case "ASSOCIACAO": {
      const r = resposta as { conexoes?: Array<{ origem: string; destino: string }> };
      return Array.isArray(r.conexoes) && r.conexoes.length > 0;
    }
    case "ORDENACAO": {
      const r = resposta as { ordem?: string[] };
      return Array.isArray(r.ordem) && r.ordem.length > 0;
    }
    case "LACUNA": {
      const r = resposta as { respostas?: Record<string, string> };
      if (!r.respostas) return false;
      // Verificar se alguma lacuna foi preenchida
      return Object.values(r.respostas).some(
        (texto) => typeof texto === "string" && texto.trim() !== ""
      );
    }
    case "HOTSPOT": {
      const r = resposta as { regiaoSelecionada?: string };
      return !!r.regiaoSelecionada;
    }
    case "COMANDO": {
      const r = resposta as { comando?: string };
      return typeof r.comando === "string" && r.comando.trim() !== "";
    }
    default:
      // Para tipos desconhecidos, considerar preenchida se existir
      return true;
  }
}

interface PageProps {
  params: { id: string; tentativaId: string };
}

interface Alternativa {
  id: string;
  texto: string;
  imagemUrl?: string | null;
}

interface Questao {
  provaQuestaoId: string;
  ordem: number;
  questaoId: string;
  tipo: TipoQuestao;
  enunciado: string;
  imagemUrl?: string | null;
  configuracao?: Record<string, unknown> | null;
  alternativas: Alternativa[];
  resposta?: {
    id: string;
    resposta: unknown;
    marcadaRevisao: boolean;
  } | null;
}

interface TentativaData {
  tentativa: {
    id: string;
    numero: number;
    dataInicio: string;
    status: string;
  };
  prova: {
    id: string;
    nome: string;
    codigo: string;
    tempoLimite: number | null;
    mostrarResultado: string;
    simulado: {
      nome: string;
      categoria: string;
    };
  };
  tempoRestante: number | null;
  totalQuestoes: number;
  questoesRespondidas: number;
  questoesMarcadas: number;
  questoes: Questao[];
}

export default function RealizarProvaPage({ params }: PageProps) {
  const { id: provaId, tentativaId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<TentativaData | null>(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [respostas, setRespostas] = useState<
    Record<string, { resposta: unknown; marcadaRevisao: boolean }>
  >({});

  // Carregar dados da tentativa
  useEffect(() => {
    async function loadTentativa() {
      try {
        const response = await fetch(`/api/aluno/tentativas/${tentativaId}`);
        const result = await response.json();

        if (!response.ok) {
          if (result.status === "EXPIRADA") {
            toast.error("O tempo da prova expirou!");
            router.push(`/aluno/provas/${provaId}`);
            return;
          }
          throw new Error(result.error || "Erro ao carregar prova");
        }

        setData(result);

        // Inicializar respostas com dados existentes
        const respostasIniciais: Record<
          string,
          { resposta: unknown; marcadaRevisao: boolean }
        > = {};
        result.questoes.forEach((q: Questao) => {
          if (q.resposta) {
            respostasIniciais[q.provaQuestaoId] = {
              resposta: q.resposta.resposta,
              marcadaRevisao: q.resposta.marcadaRevisao,
            };
          }
        });
        setRespostas(respostasIniciais);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao carregar prova"
        );
        router.push(`/aluno/provas/${provaId}`);
      } finally {
        setLoading(false);
      }
    }

    loadTentativa();
  }, [tentativaId, provaId, router]);

  // Salvar resposta
  const salvarResposta = useCallback(
    async (
      provaQuestaoId: string,
      questaoId: string,
      resposta: unknown,
      marcadaRevisao?: boolean
    ) => {
      // Atualizar estado local imediatamente
      setRespostas((prev) => ({
        ...prev,
        [provaQuestaoId]: {
          resposta,
          marcadaRevisao: marcadaRevisao ?? prev[provaQuestaoId]?.marcadaRevisao ?? false,
        },
      }));

      // Salvar no servidor
      try {
        await fetch(`/api/aluno/tentativas/${tentativaId}/responder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provaQuestaoId,
            questaoId,
            resposta,
            marcadaRevisao,
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar resposta:", error);
        // Não mostrar toast para não atrapalhar o usuário
      }
    },
    [tentativaId]
  );

  // Handler para quando o tempo acabar
  const handleTimeUp = useCallback(() => {
    toast.error("O tempo da prova acabou! Sua prova será enviada.");
    handleSubmit();
  }, []);

  // Submeter prova
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/aluno/tentativas/${tentativaId}/submeter`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao submeter prova");
      }

      toast.success("Prova enviada com sucesso!");
      router.push(`/aluno/provas/${provaId}/resultado/${tentativaId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao submeter prova"
      );
      setSubmitting(false);
    }
  };

  // Sair da prova (salva progresso)
  const handleExit = () => {
    router.push(`/aluno/provas/${provaId}`);
  };

  // Handler para selecionar alternativa via teclado
  const handleSelectAlternative = useCallback(
    (index: number) => {
      if (!data) return;
      const questao = data.questoes[questaoAtual];
      if (
        questao.tipo !== "MULTIPLA_ESCOLHA_UNICA" &&
        questao.tipo !== "MULTIPLA_ESCOLHA_MULTIPLA"
      ) {
        return;
      }
      if (index >= questao.alternativas.length) return;

      const alternativaId = questao.alternativas[index].id;
      const respostaAtual = respostas[questao.provaQuestaoId];

      if (questao.tipo === "MULTIPLA_ESCOLHA_UNICA") {
        salvarResposta(questao.provaQuestaoId, questao.questaoId, { alternativaId });
      } else {
        // Múltipla escolha múltipla: toggle
        const alternativasIds = ((respostaAtual?.resposta as { alternativasIds?: string[] })?.alternativasIds || []);
        const novasAlternativas = alternativasIds.includes(alternativaId)
          ? alternativasIds.filter((id) => id !== alternativaId)
          : [...alternativasIds, alternativaId];
        salvarResposta(questao.provaQuestaoId, questao.questaoId, { alternativasIds: novasAlternativas });
      }
    },
    [data, questaoAtual, respostas, salvarResposta]
  );

  // Handler para marcar/desmarcar revisão via teclado
  const handleToggleReview = useCallback(() => {
    if (!data) return;
    const questao = data.questoes[questaoAtual];
    const respostaAtual = respostas[questao.provaQuestaoId];
    const novaMarcacao = !(respostaAtual?.marcadaRevisao ?? false);
    salvarResposta(
      questao.provaQuestaoId,
      questao.questaoId,
      respostaAtual?.resposta ?? null,
      novaMarcacao
    );
  }, [data, questaoAtual, respostas, salvarResposta]);

  // Configurar atalhos de teclado
  useKeyboardShortcuts({
    onNavigateLeft: () => questaoAtual > 0 && setQuestaoAtual(questaoAtual - 1),
    onNavigateRight: () =>
      data && questaoAtual < data.totalQuestoes - 1 && setQuestaoAtual(questaoAtual + 1),
    onSelectAlternative: handleSelectAlternative,
    onToggleReview: handleToggleReview,
    onSubmit: () => setShowSubmitDialog(true),
    onShowHelp: () => setShowShortcutsModal(true),
    enabled: !loading && !showSubmitDialog && !showExitDialog && !showShortcutsModal,
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const questaoAtualData = data.questoes[questaoAtual];
  const questoesComStatus = data.questoes.map((q) => ({
    provaQuestaoId: q.provaQuestaoId,
    ordem: q.ordem,
    respondida: isRespostaPreenchida(respostas[q.provaQuestaoId]?.resposta, q.tipo),
    marcadaRevisao: respostas[q.provaQuestaoId]?.marcadaRevisao || false,
  }));

  const questoesRespondidas = questoesComStatus.filter((q) => q.respondida).length;
  const questoesMarcadas = questoesComStatus.filter((q) => q.marcadaRevisao).length;
  const questoesNaoRespondidas = data.questoes.length - questoesRespondidas;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card">
        <div className="flex min-h-14 items-center justify-between px-2 sm:px-4 py-2 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Menu mobile */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0 h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Navegação</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <QuestaoNavegacao
                    questoes={questoesComStatus}
                    questaoAtual={questaoAtual}
                    onNavigate={(index) => {
                      setQuestaoAtual(index);
                      setSidebarOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm sm:text-base truncate">{data.prova.nome}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {data.prova.simulado.categoria}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Tentativa {data.tentativa.numero}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
            {/* Timer */}
            {data.tempoRestante !== null && (
              <ProvaTimer
                tempoRestanteInicial={data.tempoRestante}
                onTimeUp={handleTimeUp}
              />
            )}

            {/* Status - hidden on small screens */}
            <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {questoesRespondidas}/{data.totalQuestoes} respondidas
              </span>
              {questoesMarcadas > 0 && (
                <span className="text-orange-500">
                  {questoesMarcadas} para revisar
                </span>
              )}
            </div>

            {/* Botão de atalhos */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcutsModal(true)}
              className="hidden sm:flex h-8 w-8"
              title="Atalhos de teclado (?)"
            >
              <Keyboard className="h-4 w-4" />
            </Button>

            {/* Ações */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="gap-1 h-8 px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              className="gap-1 h-8 px-2 sm:px-3"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Enviar Prova</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-72 flex-col border-r bg-card p-4 overflow-y-auto">
          <QuestaoNavegacao
            questoes={questoesComStatus}
            questaoAtual={questaoAtual}
            onNavigate={setQuestaoAtual}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 sm:p-4">
          <QuestaoContainer
            questao={{
              ...questaoAtualData,
              resposta: respostas[questaoAtualData.provaQuestaoId]
                ? {
                    id: questaoAtualData.resposta?.id || "",
                    resposta: respostas[questaoAtualData.provaQuestaoId].resposta,
                    marcadaRevisao:
                      respostas[questaoAtualData.provaQuestaoId].marcadaRevisao,
                  }
                : questaoAtualData.resposta,
            } as Questao}
            indice={questaoAtual}
            total={data.totalQuestoes}
            onResposta={salvarResposta}
            onAnterior={() => setQuestaoAtual((prev) => prev - 1)}
            onProxima={() => setQuestaoAtual((prev) => prev + 1)}
            temAnterior={questaoAtual > 0}
            temProxima={questaoAtual < data.totalQuestoes - 1}
          />
        </main>
      </div>

      {/* Dialog de Submissão */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Prova</AlertDialogTitle>
            <AlertDialogDescription>
              {questoesNaoRespondidas > 0 ? (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 text-orange-600 mb-4">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Atenção!</p>
                    <p>
                      Você tem {questoesNaoRespondidas} questão
                      {questoesNaoRespondidas > 1 ? "ões" : ""} não respondida
                      {questoesNaoRespondidas > 1 ? "s" : ""}.
                    </p>
                  </div>
                </div>
              ) : null}
              {questoesMarcadas > 0 && (
                <p className="text-muted-foreground mb-2">
                  Você marcou {questoesMarcadas} questão
                  {questoesMarcadas > 1 ? "ões" : ""} para revisão.
                </p>
              )}
              <p className="text-muted-foreground">
                Tem certeza que deseja enviar sua prova? Esta ação não pode ser
                desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Continuar Prova
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Prova
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Saída */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Seu progresso será salvo e você poderá continuar depois
              {data.tempoRestante !== null
                ? ", desde que ainda haja tempo disponível"
                : ""}
              .
              <br />
              <br />
              Deseja sair agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Prova</AlertDialogCancel>
            <AlertDialogAction onClick={handleExit}>
              Sair e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Atalhos */}
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
