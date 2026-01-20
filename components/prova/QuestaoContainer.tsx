"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestaoMultiplaEscolha } from "./QuestaoMultiplaEscolha";
import { QuestaoOrdenacao } from "./QuestaoOrdenacao";
import { QuestaoLacuna } from "./QuestaoLacuna";
import { QuestaoComando } from "./QuestaoComando";
import { QuestaoAssociacao } from "./QuestaoAssociacao";
import { DragDropDisplay, type DragDropResposta } from "@/components/questoes/tipos/DragDropDisplay";
import { AssociacaoDisplay, type AssociacaoResposta } from "@/components/questoes/tipos/AssociacaoDisplay";
import { OrdenacaoDisplay, type OrdenacaoResposta } from "@/components/questoes/tipos/OrdenacaoDisplay";
import { LacunaDisplay, type LacunaResposta } from "@/components/questoes/tipos/LacunaDisplay";
import { ComandoDisplay, type ComandoResposta } from "@/components/questoes/tipos/ComandoDisplay";
import { HotspotDisplay, type HotspotResposta } from "@/components/questoes/tipos/HotspotDisplay";
import type { DragDropConfig, AssociacaoConfig, OrdenacaoConfig, LacunaConfig, ComandoConfig, HotspotConfig } from "@/lib/validations/questao";
import type { TipoQuestao } from "@prisma/client";

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

interface QuestaoContainerProps {
  questao: Questao;
  indice: number;
  total: number;
  onResposta: (provaQuestaoId: string, questaoId: string, resposta: unknown, marcadaRevisao?: boolean) => void;
  onAnterior: () => void;
  onProxima: () => void;
  temAnterior: boolean;
  temProxima: boolean;
  disabled?: boolean;
}

export function QuestaoContainer({
  questao,
  indice,
  total,
  onResposta,
  onAnterior,
  onProxima,
  temAnterior,
  temProxima,
  disabled = false,
}: QuestaoContainerProps) {
  const [marcadaRevisao, setMarcadaRevisao] = useState(
    questao.resposta?.marcadaRevisao || false
  );

  // Sincronizar estado local com a questão atual quando ela muda
  useEffect(() => {
    setMarcadaRevisao(questao.resposta?.marcadaRevisao || false);
  }, [questao.provaQuestaoId, questao.resposta?.marcadaRevisao]);

  const handleRespostaChange = useCallback(
    (resposta: unknown) => {
      onResposta(questao.provaQuestaoId, questao.questaoId, resposta, marcadaRevisao);
    },
    [questao.provaQuestaoId, questao.questaoId, marcadaRevisao, onResposta]
  );

  const toggleMarcacao = () => {
    const novaMarcacao = !marcadaRevisao;
    setMarcadaRevisao(novaMarcacao);
    onResposta(
      questao.provaQuestaoId,
      questao.questaoId,
      questao.resposta?.resposta || null,
      novaMarcacao
    );
  };

  const getTipoLabel = (tipo: TipoQuestao) => {
    const labels: Record<TipoQuestao, string> = {
      MULTIPLA_ESCOLHA_UNICA: "Múltipla Escolha",
      MULTIPLA_ESCOLHA_MULTIPLA: "Múltipla Escolha (várias)",
      DRAG_DROP: "Arrastar e Soltar",
      ASSOCIACAO: "Associação",
      ORDENACAO: "Ordenação",
      LACUNA: "Preencher Lacunas",
      HOTSPOT: "Hotspot",
      COMANDO: "Comando",
    };
    return labels[tipo] || tipo;
  };

  const renderQuestao = () => {
    const respostaAtual = questao.resposta?.resposta as Record<string, unknown> | null;

    switch (questao.tipo) {
      case "MULTIPLA_ESCOLHA_UNICA":
        return (
          <QuestaoMultiplaEscolha
            alternativas={questao.alternativas}
            multipla={false}
            respostaAtual={respostaAtual as { alternativaId?: string } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );

      case "MULTIPLA_ESCOLHA_MULTIPLA":
        return (
          <QuestaoMultiplaEscolha
            alternativas={questao.alternativas}
            multipla={true}
            respostaAtual={respostaAtual as { alternativasIds?: string[] } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );

      case "ORDENACAO": {
        const ordenacaoConfig = questao.configuracao as OrdenacaoConfig | null;

        // Verificar se usa o novo formato (itens com ordem)
        if (ordenacaoConfig && "itens" in ordenacaoConfig && Array.isArray(ordenacaoConfig.itens)) {
          const ordenacaoResposta: OrdenacaoResposta =
            respostaAtual && typeof respostaAtual === "object" && "ordem" in respostaAtual
              ? (respostaAtual as unknown as OrdenacaoResposta)
              : { ordem: [] };
          return (
            <OrdenacaoDisplay
              config={ordenacaoConfig}
              value={ordenacaoResposta}
              onChange={(value) => handleRespostaChange(value)}
              disabled={disabled}
            />
          );
        }

        // Fallback para formato antigo (usando alternativas)
        return (
          <QuestaoOrdenacao
            itens={questao.alternativas}
            respostaAtual={respostaAtual as { ordem?: string[] } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );
      }

      case "LACUNA": {
        const lacunaConfig = questao.configuracao as LacunaConfig | null;

        // Verificar se usa o novo formato (texto com lacunas)
        if (lacunaConfig && "texto" in lacunaConfig && "lacunas" in lacunaConfig) {
          const lacunaResposta: LacunaResposta =
            respostaAtual && typeof respostaAtual === "object" && "respostas" in respostaAtual
              ? (respostaAtual as unknown as LacunaResposta)
              : { respostas: {} };
          return (
            <LacunaDisplay
              config={lacunaConfig}
              value={lacunaResposta}
              onChange={(value) => handleRespostaChange(value)}
              disabled={disabled}
            />
          );
        }

        // Fallback para formato antigo (usando enunciado)
        return (
          <QuestaoLacuna
            enunciado={questao.enunciado}
            respostaAtual={respostaAtual as { lacunas?: Record<string, string> } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );
      }

      case "COMANDO": {
        const comandoConfig = questao.configuracao as ComandoConfig | null;

        // Verificar se usa o novo formato (prompt, contexto, respostasAceitas)
        if (comandoConfig && "prompt" in comandoConfig && "respostasAceitas" in comandoConfig) {
          const comandoResposta: ComandoResposta =
            respostaAtual && typeof respostaAtual === "object" && "comando" in respostaAtual
              ? (respostaAtual as unknown as ComandoResposta)
              : { comando: "" };
          return (
            <ComandoDisplay
              config={comandoConfig}
              value={comandoResposta}
              onChange={(value) => handleRespostaChange(value)}
              disabled={disabled}
            />
          );
        }

        // Fallback para formato antigo
        return (
          <QuestaoComando
            respostaAtual={respostaAtual as { comando?: string } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );
      }

      case "ASSOCIACAO": {
        const config = questao.configuracao as AssociacaoConfig | null;

        // Verificar se usa o novo formato (colunaA/colunaB)
        if (config && "colunaA" in config && "colunaB" in config) {
          const associacaoResposta: AssociacaoResposta =
            respostaAtual && typeof respostaAtual === "object" && "conexoes" in respostaAtual
              ? (respostaAtual as unknown as AssociacaoResposta)
              : { conexoes: [] };
          return (
            <AssociacaoDisplay
              config={config}
              value={associacaoResposta}
              onChange={(value) => handleRespostaChange(value)}
              disabled={disabled}
            />
          );
        }

        // Fallback para formato antigo (itensEsquerda/itensDireita)
        const legacyConfig = questao.configuracao as {
          itensEsquerda?: { id: string; texto: string }[];
          itensDireita?: { id: string; texto: string }[];
        } | null;
        return (
          <QuestaoAssociacao
            itensEsquerda={legacyConfig?.itensEsquerda || []}
            itensDireita={legacyConfig?.itensDireita || []}
            respostaAtual={respostaAtual as { associacoes?: Record<string, string> } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );
      }

      case "DRAG_DROP": {
        const dragDropConfig = questao.configuracao as DragDropConfig | null;
        if (!dragDropConfig) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <p>Configuração de Drag & Drop não encontrada.</p>
            </div>
          );
        }
        const dragDropResposta: DragDropResposta =
          respostaAtual && typeof respostaAtual === "object" && "posicoes" in respostaAtual
            ? (respostaAtual as unknown as DragDropResposta)
            : { posicoes: {} };
        return (
          <DragDropDisplay
            config={dragDropConfig}
            value={dragDropResposta}
            onChange={(value) => handleRespostaChange(value)}
            disabled={disabled}
          />
        );
      }

      case "HOTSPOT": {
        const hotspotConfig = questao.configuracao as HotspotConfig | null;
        if (!hotspotConfig) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <p>Configuração de Hotspot não encontrada.</p>
            </div>
          );
        }
        const hotspotResposta: HotspotResposta =
          respostaAtual && typeof respostaAtual === "object" && "cliques" in respostaAtual
            ? (respostaAtual as unknown as HotspotResposta)
            : { cliques: [] };
        return (
          <HotspotDisplay
            config={hotspotConfig}
            value={hotspotResposta}
            onChange={(value) => handleRespostaChange(value)}
            disabled={disabled}
          />
        );
      }

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tipo de questão não suportado: {questao.tipo}</p>
          </div>
        );
    }
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b py-2 sm:py-3 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-sm sm:text-lg font-semibold whitespace-nowrap">
              Questão {indice + 1} de {total}
            </span>
            <Badge variant="secondary" className="text-xs hidden xs:inline-flex">{getTipoLabel(questao.tipo)}</Badge>
          </div>
          <Button
            variant={marcadaRevisao ? "default" : "outline"}
            size="sm"
            onClick={toggleMarcacao}
            className={cn(
              "gap-1 sm:gap-2 h-8 text-xs sm:text-sm flex-shrink-0 px-2 sm:px-3",
              marcadaRevisao && "bg-orange-500 hover:bg-orange-600"
            )}
          >
            <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{marcadaRevisao ? "Marcada" : "Marcar para revisão"}</span>
            <span className="sm:hidden">{marcadaRevisao ? "Marcada" : "Revisar"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto py-3 sm:py-6 px-3 sm:px-6">
        {/* Enunciado */}
        {questao.tipo !== "LACUNA" && (
          <div className="mb-4 sm:mb-6">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: questao.enunciado }}
            />
            {questao.imagemUrl && (
              <img
                src={questao.imagemUrl}
                alt="Imagem da questão"
                className="mt-4 max-w-full rounded-lg"
              />
            )}
          </div>
        )}

        {/* Componente específico do tipo de questão */}
        {renderQuestao()}
      </CardContent>

      {/* Navegação - sempre visível na parte inferior */}
      <div className="flex-shrink-0 border-t p-2 sm:p-4 bg-card">
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={onAnterior}
            disabled={!temAnterior}
            className="gap-1 sm:gap-2 h-9 px-2 sm:px-4 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <Button
            variant="outline"
            onClick={onProxima}
            disabled={!temProxima}
            className="gap-1 sm:gap-2 h-9 px-2 sm:px-4 text-sm"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
