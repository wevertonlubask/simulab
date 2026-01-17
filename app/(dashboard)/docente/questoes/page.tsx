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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileQuestion,
  MoreVertical,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Filter,
  X,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react";
import type { Questao, Alternativa, Simulado } from "@prisma/client";

interface QuestaoWithRelations extends Questao {
  alternativas: Alternativa[];
  simulado: Pick<Simulado, "id" | "nome" | "categoria">;
  _count: {
    provas: number;
  };
}

interface Filtros {
  categorias: string[];
  simulados: { id: string; nome: string }[];
  tipos: { tipo: string; count: number }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const tipoLabels: Record<string, string> = {
  MULTIPLA_ESCOLHA_UNICA: "Múltipla Escolha (Única)",
  MULTIPLA_ESCOLHA_MULTIPLA: "Múltipla Escolha (Múltipla)",
  ORDENACAO: "Ordenação",
  ASSOCIACAO: "Associação",
  LACUNA: "Preencher Lacunas",
  DRAG_DROP: "Arrastar e Soltar",
  HOTSPOT: "Hotspot",
  COMANDO: "Linha de Comando",
};

const dificuldadeConfig: Record<string, { label: string; color: string }> = {
  FACIL: { label: "Fácil", color: "bg-green-100 text-green-800" },
  MEDIO: { label: "Médio", color: "bg-yellow-100 text-yellow-800" },
  DIFICIL: { label: "Difícil", color: "bg-red-100 text-red-800" },
};

export default function QuestoesDocentePage() {
  const [questoes, setQuestoes] = useState<QuestaoWithRelations[]>([]);
  const [filtros, setFiltros] = useState<Filtros | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewQuestao, setPreviewQuestao] = useState<QuestaoWithRelations | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [simuladoId, setSimuladoId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [dificuldade, setDificuldade] = useState("");
  const [ativo, setAtivo] = useState("");
  const [page, setPage] = useState(1);

  const { toast } = useToast();
  const router = useRouter();

  const fetchQuestoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (tipo) params.set("tipo", tipo);
      if (simuladoId) params.set("simuladoId", simuladoId);
      if (categoria) params.set("categoria", categoria);
      if (dificuldade) params.set("dificuldade", dificuldade);
      if (ativo) params.set("ativo", ativo);

      const response = await fetch(`/api/docente/questoes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar questões");
      }

      setQuestoes(data.questoes);
      setFiltros(data.filtros);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar questões",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, tipo, simuladoId, categoria, dificuldade, ativo, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(
      () => {
        fetchQuestoes();
      },
      search ? 300 : 0
    );

    return () => clearTimeout(debounceTimer);
  }, [fetchQuestoes, search]);

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
        description: error instanceof Error ? error.message : "Erro ao duplicar questão",
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
        description: error instanceof Error ? error.message : "Erro ao excluir questão",
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTipo("");
    setSimuladoId("");
    setCategoria("");
    setDificuldade("");
    setAtivo("");
    setPage(1);
  };

  const hasActiveFilters = search || tipo || simuladoId || categoria || dificuldade || ativo;

  if (loading && questoes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas questões em um só lugar
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
        <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
        <p className="text-muted-foreground">
          Gerencie todas as suas questões em um só lugar
        </p>
      </div>

      {/* Estatísticas rápidas */}
      {pagination && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pagination.total}</div>
              <p className="text-sm text-muted-foreground">Total de questões</p>
            </CardContent>
          </Card>
          {filtros?.tipos.slice(0, 3).map((t) => (
            <Card key={t.tipo}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{t.count}</div>
                <p className="text-sm text-muted-foreground truncate">
                  {tipoLabels[t.tipo] || t.tipo}
                </p>
              </CardContent>
            </Card>
          ))}
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
                  placeholder="Buscar no enunciado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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

            <Select value={tipo || "all"} onValueChange={(v) => setTipo(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(tipoLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dificuldade || "all"} onValueChange={(v) => setDificuldade(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="FACIL">Fácil</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="DIFICIL">Difícil</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ativo || "all"} onValueChange={(v) => setAtivo(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativas</SelectItem>
                <SelectItem value="false">Inativas</SelectItem>
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

      {/* Lista de questões */}
      {questoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma questão encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters
                ? "Tente ajustar os filtros para ver mais questões"
                : "Comece criando questões em seus simulados"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {questoes.map((questao) => (
            <Card key={questao.id} className={!questao.ativo ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {tipoLabels[questao.tipo] || questao.tipo}
                      </Badge>
                      <Badge className={dificuldadeConfig[questao.dificuldade]?.color || ""}>
                        {dificuldadeConfig[questao.dificuldade]?.label || questao.dificuldade}
                      </Badge>
                      {!questao.ativo && (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>

                    <p className="text-sm line-clamp-3">{questao.enunciado}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      <Link
                        href={`/docente/simulados/${questao.simulado.id}/questoes`}
                        className="hover:underline"
                      >
                        {questao.simulado.nome}
                      </Link>
                      <span>•</span>
                      <span>{questao.simulado.categoria}</span>
                      {questao._count.provas > 0 && (
                        <>
                          <span>•</span>
                          <span>{questao._count.provas} prova(s)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewQuestao(questao)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/docente/simulados/${questao.simuladoId}/questoes/${questao.id}`
                          )
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(questao.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(questao.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
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

      {/* Modal de Preview */}
      <Dialog open={!!previewQuestao} onOpenChange={() => setPreviewQuestao(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da Questão</DialogTitle>
          </DialogHeader>
          {previewQuestao && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {tipoLabels[previewQuestao.tipo] || previewQuestao.tipo}
                </Badge>
                <Badge className={dificuldadeConfig[previewQuestao.dificuldade]?.color || ""}>
                  {dificuldadeConfig[previewQuestao.dificuldade]?.label}
                </Badge>
                <Badge variant="secondary">Peso: {previewQuestao.peso}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2">Enunciado</h4>
                <p className="text-sm whitespace-pre-wrap">{previewQuestao.enunciado}</p>
              </div>

              {previewQuestao.alternativas.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Alternativas</h4>
                  <div className="space-y-2">
                    {previewQuestao.alternativas.map((alt, index) => (
                      <div
                        key={alt.id}
                        className={`flex items-start gap-2 p-2 rounded ${
                          alt.correta ? "bg-green-50 border border-green-200" : "bg-muted"
                        }`}
                      >
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)})
                        </span>
                        <span className="flex-1">{alt.texto}</span>
                        {alt.correta ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewQuestao.explicacao && (
                <div>
                  <h4 className="font-medium mb-2">Explicação</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {previewQuestao.explicacao}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                <span>Simulado: {previewQuestao.simulado.nome}</span>
                <span>Categoria: {previewQuestao.simulado.categoria}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
