"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuestaoCard } from "./QuestaoCard";
import { QuestoesFilters } from "./QuestoesFilters";
import { QuestaoPreviewModal } from "./QuestaoPreviewModal";
import { EstatisticasQuestoes } from "./EstatisticasQuestoes";
import { ImportarJsonModal } from "./ImportarJsonModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Upload, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Questao, Alternativa } from "@prisma/client";

interface QuestaoWithAlternativas extends Questao {
  alternativas: Alternativa[];
}

interface Stats {
  total: number;
  ativas: number;
  porDificuldade: {
    FACIL: number;
    MEDIO: number;
    DIFICIL: number;
  };
}

interface QuestoesListProps {
  simuladoId: string;
}

export function QuestoesList({ simuladoId }: QuestoesListProps) {
  const [questoes, setQuestoes] = useState<QuestaoWithAlternativas[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tipo, setTipo] = useState("todos");
  const [dificuldade, setDificuldade] = useState("todos");
  const [busca, setBusca] = useState("");
  const [previewQuestao, setPreviewQuestao] =
    useState<QuestaoWithAlternativas | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchQuestoes = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (tipo !== "todos") params.set("tipo", tipo);
      if (dificuldade !== "todos") params.set("dificuldade", dificuldade);
      if (busca) params.set("busca", busca);

      const response = await fetch(
        `/api/simulados/${simuladoId}/questoes?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar questões");
      }

      setQuestoes(data.questoes);
      setStats(data.stats);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar questões",
      });
    } finally {
      setIsLoading(false);
    }
  }, [simuladoId, tipo, dificuldade, busca, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        fetchQuestoes();
      },
      busca ? 300 : 0
    );

    return () => clearTimeout(debounceTimer);
  }, [fetchQuestoes, busca]);

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/questoes/${id}/duplicar`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao duplicar");
      }

      toast({
        title: "Questão duplicada!",
        description: "A cópia foi criada com sucesso.",
      });

      fetchQuestoes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao duplicar questão",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) {
      return;
    }

    try {
      const response = await fetch(`/api/questoes/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir");
      }

      toast({
        title: "Questão excluída",
        description: data.message,
      });

      fetchQuestoes();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir questão",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && <EstatisticasQuestoes stats={stats} />}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <QuestoesFilters
          tipo={tipo}
          dificuldade={dificuldade}
          busca={busca}
          onTipoChange={setTipo}
          onDificuldadeChange={setDificuldade}
          onBuscaChange={setBusca}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar JSON
          </Button>
          <Link href={`/docente/simulados/${simuladoId}/questoes/nova`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Questão
            </Button>
          </Link>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : questoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {busca || tipo !== "todos" || dificuldade !== "todos"
              ? "Nenhuma questão encontrada"
              : "Nenhuma questão criada"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {busca || tipo !== "todos" || dificuldade !== "todos"
              ? "Tente ajustar os filtros ou criar uma nova questão."
              : "Comece criando sua primeira questão ou importe via JSON."}
          </p>
          {!busca && tipo === "todos" && dificuldade === "todos" && (
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar JSON
              </Button>
              <Link href={`/docente/simulados/${simuladoId}/questoes/nova`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Questão
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questoes.map((questao) => (
            <QuestaoCard
              key={questao.id}
              questao={questao}
              simuladoId={simuladoId}
              onPreview={setPreviewQuestao}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <QuestaoPreviewModal
        questao={previewQuestao}
        open={!!previewQuestao}
        onClose={() => setPreviewQuestao(null)}
      />

      {/* Import Modal */}
      <ImportarJsonModal
        simuladoId={simuladoId}
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchQuestoes}
      />
    </div>
  );
}
