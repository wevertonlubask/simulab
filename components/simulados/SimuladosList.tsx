"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SimuladoCard } from "./SimuladoCard";
import { SimuladosFilters } from "./SimuladosFilters";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Simulado, StatusSimulado } from "@prisma/client";

interface SimuladoWithCount extends Simulado {
  _count: {
    questoes: number;
    provas: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function SimuladosList() {
  const [simulados, setSimulados] = useState<SimuladoWithCount[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoria, setCategoria] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const fetchSimulados = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (categoria !== "todos") params.set("categoria", categoria);
      if (status !== "todos") params.set("status", status);
      if (busca) params.set("busca", busca);

      const response = await fetch(`/api/simulados?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar simulados");
      }

      setSimulados(data.simulados);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar simulados",
      });
    } finally {
      setIsLoading(false);
    }
  }, [categoria, status, busca, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSimulados();
    }, busca ? 300 : 0);

    return () => clearTimeout(debounceTimer);
  }, [fetchSimulados, busca]);

  const handleStatusChange = async (id: string, newStatus: StatusSimulado) => {
    try {
      const response = await fetch(`/api/simulados/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar status");
      }

      toast({
        title: "Status atualizado",
        description: `Simulado ${newStatus === "ATIVO" ? "ativado" : "desativado"} com sucesso.`,
      });

      fetchSimulados();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao alterar status",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este simulado?")) {
      return;
    }

    try {
      const response = await fetch(`/api/simulados/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir simulado");
      }

      toast({
        title: "Simulado desativado",
        description: "O simulado foi desativado com sucesso.",
      });

      fetchSimulados();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir simulado",
      });
    }
  };

  return (
    <div className="space-y-6">
      <SimuladosFilters
        categoria={categoria}
        status={status}
        busca={busca}
        onCategoriaChange={setCategoria}
        onStatusChange={setStatus}
        onBuscaChange={setBusca}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : simulados.length === 0 ? (
        <EmptyState
          title={
            busca || categoria !== "todos" || status !== "todos"
              ? "Nenhum simulado encontrado"
              : "Nenhum simulado criado"
          }
          description={
            busca || categoria !== "todos" || status !== "todos"
              ? "Tente ajustar os filtros ou criar um novo simulado."
              : "Comece criando seu primeiro simulado para adicionar questões e gerar provas."
          }
          showCreateButton={!busca && categoria === "todos" && status === "todos"}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {simulados.map((simulado) => (
              <SimuladoCard
                key={simulado.id}
                simulado={simulado}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(pagination.page - 1));
                  router.push(`?${params.toString()}`);
                }}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("page", String(pagination.page + 1));
                  router.push(`?${params.toString()}`);
                }}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
