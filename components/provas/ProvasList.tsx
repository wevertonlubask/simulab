"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProvaCard } from "./ProvaCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileQuestion, Play, Square, Archive } from "lucide-react";
import type { Prova } from "@prisma/client";

interface ProvaWithCount extends Prova {
  _count: {
    questoes: number;
    tentativas: number;
  };
}

interface Stats {
  total: number;
  rascunho: number;
  publicadas: number;
  encerradas: number;
}

interface ProvasListProps {
  simuladoId: string;
}

export function ProvasList({ simuladoId }: ProvasListProps) {
  const [provas, setProvas] = useState<ProvaWithCount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const { toast } = useToast();

  const fetchProvas = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "todos") params.set("status", statusFilter);

      const response = await fetch(
        `/api/simulados/${simuladoId}/provas?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar provas");
      }

      setProvas(data.provas);
      setStats(data.stats);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar provas",
      });
    } finally {
      setIsLoading(false);
    }
  }, [simuladoId, statusFilter, toast]);

  useEffect(() => {
    fetchProvas();
  }, [fetchProvas]);

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/provas/${id}/publicar`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao publicar");
      }

      toast({
        title: "Prova publicada!",
        description: "A prova está disponível para os alunos.",
      });

      fetchProvas();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao publicar prova",
      });
    }
  };

  const handleClose = async (id: string) => {
    if (!confirm("Tem certeza que deseja encerrar esta prova?")) {
      return;
    }

    try {
      const response = await fetch(`/api/provas/${id}/encerrar`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao encerrar");
      }

      toast({
        title: "Prova encerrada",
        description: "A prova não está mais disponível para os alunos.",
      });

      fetchProvas();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao encerrar prova",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta prova?")) {
      return;
    }

    try {
      const response = await fetch(`/api/provas/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir");
      }

      toast({
        title: "Prova excluída",
        description: "A prova foi excluída com sucesso.",
      });

      fetchProvas();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir prova",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileQuestion className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Rascunho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rascunho}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4 text-success" />
                Publicadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {stats.publicadas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Square className="h-4 w-4 text-destructive" />
                Encerradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.encerradas}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="PUBLICADA">Publicadas</SelectItem>
            <SelectItem value="ENCERRADA">Encerradas</SelectItem>
          </SelectContent>
        </Select>
        <Link href={`/docente/simulados/${simuladoId}/provas/gerar`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Gerar Prova
          </Button>
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : provas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {statusFilter !== "todos"
              ? "Nenhuma prova encontrada"
              : "Nenhuma prova gerada"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {statusFilter !== "todos"
              ? "Tente ajustar o filtro de status."
              : "Gere sua primeira prova a partir das questões do simulado."}
          </p>
          {statusFilter === "todos" && (
            <Link
              href={`/docente/simulados/${simuladoId}/provas/gerar`}
              className="mt-6"
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Gerar Prova
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {provas.map((prova) => (
            <ProvaCard
              key={prova.id}
              prova={prova}
              simuladoId={simuladoId}
              onPublish={handlePublish}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
