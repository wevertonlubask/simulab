"use client";

import { useState, useCallback } from "react";
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

      case "ORDENACAO":
        return (
          <QuestaoOrdenacao
            itens={questao.alternativas}
            respostaAtual={respostaAtual as { ordem?: string[] } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );

      case "LACUNA":
        return (
          <QuestaoLacuna
            enunciado={questao.enunciado}
            respostaAtual={respostaAtual as { lacunas?: Record<string, string> } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );

      case "COMANDO":
        return (
          <QuestaoComando
            respostaAtual={respostaAtual as { comando?: string } | null}
            onChange={handleRespostaChange}
            disabled={disabled}
          />
        );

      case "ASSOCIACAO": {
        const config = questao.configuracao as {
          itensEsquerda?: { id: string; texto: string }[];
          itensDireita?: { id: string; texto: string }[];
        } | null;
        return (
          <QuestaoAssociacao
            itensEsquerda={config?.itensEsquerda || []}
            itensDireita={config?.itensDireita || []}
            respostaAtual={respostaAtual as { associacoes?: Record<string, string> } | null}
            onChange={handleRespostaChange}
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
    <Card className="flex-1 flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">
              Questão {indice + 1} de {total}
            </span>
            <Badge variant="secondary">{getTipoLabel(questao.tipo)}</Badge>
          </div>
          <Button
            variant={marcadaRevisao ? "default" : "outline"}
            size="sm"
            onClick={toggleMarcacao}
            className={cn(
              "gap-2",
              marcadaRevisao && "bg-orange-500 hover:bg-orange-600"
            )}
          >
            <Flag className="h-4 w-4" />
            {marcadaRevisao ? "Marcada" : "Marcar para revisão"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto py-6">
        {/* Enunciado */}
        {questao.tipo !== "LACUNA" && (
          <div className="mb-6">
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

      {/* Navegação */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onAnterior}
            disabled={!temAnterior}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={onProxima}
            disabled={!temProxima}
            className="gap-2"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
