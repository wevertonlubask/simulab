"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ClipboardList,
  MoreVertical,
  Eye,
  Users,
  Pencil,
  Play,
  StopCircle,
  FileText,
  Filter,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Prova, Simulado, Turma } from "@prisma/client";

interface ProvaWithRelations extends Prova {
  simulado: Pick<Simulado, "id" | "nome" | "categoria">;
  totalQuestoes: number;
  totalTentativas: number;
  turmas: Pick<Turma, "id" | "nome">[];
}

interface Filtros {
  categorias: string[];
  simulados: { id: string; nome: string }[];
  turmas: { id: string; nome: string }[];
}

interface Estatisticas {
  total: number;
  rascunho: number;
  publicadas: number;
  encerradas: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO: {
    label: "Rascunho",
    color: "bg-gray-100 text-gray-800",
    icon: <FileText className="h-3 w-3" />,
  },
  PUBLICADA: {
    label: "Publicada",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  ENCERRADA: {
    label: "Encerrada",
    color: "bg-red-100 text-red-800",
    icon: <StopCircle className="h-3 w-3" />,
  },
};

export default function ProvasDocentePage() {
  const [provas, setProvas] = useState<ProvaWithRelations[]>([]);
  const [filtros, setFiltros] = useState<Filtros | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [simuladoId, setSimuladoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [page, setPage] = useState(1);

  const { toast } = useToast();
  const router = useRouter();

  const fetchProvas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (simuladoId) params.set("simuladoId", simuladoId);
      if (turmaId) params.set("turmaId", turmaId);
      if (categoria) params.set("categoria", categoria);

      const response = await fetch(`/api/docente/provas?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar provas");
      }

      setProvas(data.provas);
      setFiltros(data.filtros);
      setEstatisticas(data.estatisticas);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar provas",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, simuladoId, turmaId, categoria, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        fetchProvas();
      },
      search ? 300 : 0
    );

    return () => clearTimeout(debounceTimer);
  }, [fetchProvas, search]);

  const handlePublicar = async (id: string) => {
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
        description: error instanceof Error ? error.message : "Erro ao publicar prova",
      });
    }
  };

  const handleEncerrar = async (id: string) => {
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
        description: error instanceof Error ? error.message : "Erro ao encerrar prova",
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSimuladoId("");
    setTurmaId("");
    setCategoria("");
    setPage(1);
  };

  const hasActiveFilters = search || status || simuladoId || turmaId || categoria;

  if (loading && provas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas provas
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas provas
        </p>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <p className="text-sm text-muted-foreground">Total de provas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{estatisticas.rascunho}</div>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{estatisticas.publicadas}</div>
              <p className="text-sm text-muted-foreground">Publicadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{estatisticas.encerradas}</div>
              <p className="text-sm text-muted-foreground">Encerradas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                <SelectItem value="PUBLICADA">Publicada</SelectItem>
                <SelectItem value="ENCERRADA">Encerrada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={simuladoId || "all"} onValueChange={(v) => setSimuladoId(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Simulado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os simulados</SelectItem>
                {filtros?.simulados.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={turmaId || "all"} onValueChange={(v) => setTurmaId(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {filtros?.turmas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoria || "all"} onValueChange={(v) => setCategoria(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {filtros?.categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar todos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de provas */}
      {provas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma prova encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters
                ? "Tente ajustar os filtros para ver mais provas"
                : "Crie provas a partir dos seus simulados"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {provas.map((prova) => {
            const statusInfo = statusConfig[prova.status] || statusConfig.RASCUNHO;

            return (
              <Card key={prova.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base truncate">{prova.nome}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        <Link
                          href={`/docente/simulados/${prova.simulado.id}`}
                          className="hover:underline truncate"
                        >
                          {prova.simulado.nome}
                        </Link>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/docente/provas/${prova.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/docente/provas/${prova.id}/questoes`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar questões
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {prova.status === "RASCUNHO" && (
                          <DropdownMenuItem onClick={() => handlePublicar(prova.id)}>
                            <Play className="mr-2 h-4 w-4" />
                            Publicar
                          </DropdownMenuItem>
                        )}
                        {prova.status === "PUBLICADA" && (
                          <DropdownMenuItem
                            onClick={() => handleEncerrar(prova.id)}
                            className="text-red-600"
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            Encerrar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusInfo.color}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </Badge>
                    <Badge variant="outline">{prova.simulado.categoria}</Badge>
                  </div>

                  {prova.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {prova.descricao}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{prova.totalQuestoes} questões</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{prova.totalTentativas} tentativas</span>
                    </div>
                    {prova.tempoLimite && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{prova.tempoLimite} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Nota mín: {prova.notaMinima}%</span>
                    </div>
                  </div>

                  {prova.turmas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prova.turmas.slice(0, 3).map((turma) => (
                        <Badge key={turma.id} variant="secondary" className="text-xs">
                          {turma.nome}
                        </Badge>
                      ))}
                      {prova.turmas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{prova.turmas.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Criada em {format(new Date(prova.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
