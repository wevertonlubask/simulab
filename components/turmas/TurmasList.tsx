"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TurmaCard } from "./TurmaCard";
import { TurmaForm } from "./TurmaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Users } from "lucide-react";

interface Turma {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  ativa: boolean;
  _count: {
    alunos: number;
    provas: number;
  };
}

export function TurmasList() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("todas");
  const [busca, setBusca] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchTurmas = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (status !== "todas") params.set("status", status);
      if (busca) params.set("busca", busca);

      const response = await fetch(`/api/turmas?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar turmas");
      }

      setTurmas(data.turmas);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar turmas",
      });
    } finally {
      setIsLoading(false);
    }
  }, [status, busca, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTurmas();
    }, busca ? 300 : 0);

    return () => clearTimeout(debounceTimer);
  }, [fetchTurmas, busca]);

  const handleStatusChange = async (id: string, ativa: boolean) => {
    try {
      const response = await fetch(`/api/turmas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativa }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao alterar status");
      }

      toast({
        title: "Status atualizado",
        description: `Turma ${ativa ? "ativada" : "desativada"} com sucesso.`,
      });

      fetchTurmas();
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
    if (!confirm("Tem certeza que deseja desativar esta turma?")) {
      return;
    }

    try {
      const response = await fetch(`/api/turmas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao desativar turma");
      }

      toast({
        title: "Turma desativada",
        description: "A turma foi desativada com sucesso.",
      });

      fetchTurmas();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao desativar turma",
      });
    }
  };

  const handleTurmaCreated = () => {
    setIsDialogOpen(false);
    fetchTurmas();
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Ações */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar turma..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="inativas">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Crie uma turma para organizar seus alunos e vincular provas.
              </DialogDescription>
            </DialogHeader>
            <TurmaForm
              onSuccess={handleTurmaCreated}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Turmas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma turma encontrada</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {busca || status !== "todas"
              ? "Tente ajustar os filtros."
              : "Crie sua primeira turma para começar."}
          </p>
          {!busca && status === "todas" && (
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Turma
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
