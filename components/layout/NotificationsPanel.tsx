"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Clock,
  Trophy,
  Users,
  MessageSquare,
  Info,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  lida: boolean;
  createdAt: string;
}

const tipoIcons: Record<string, React.ReactNode> = {
  NOVA_PROVA: <FileText className="h-4 w-4 text-blue-500" />,
  PRAZO_PROVA: <Clock className="h-4 w-4 text-orange-500" />,
  RESULTADO_DISPONIVEL: <Trophy className="h-4 w-4 text-green-500" />,
  NOVA_TURMA: <Users className="h-4 w-4 text-purple-500" />,
  AVISO_DOCENTE: <MessageSquare className="h-4 w-4 text-cyan-500" />,
  SISTEMA: <Info className="h-4 w-4 text-gray-500" />,
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/aluno/notificacoes?limit=50");
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data.notificacoes);
        setTotalNaoLidas(data.totalNaoLidas);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotificacoes();
    }
  }, [open, fetchNotificacoes]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/aluno/notificacoes?limit=1");
        if (response.ok) {
          const data = await response.json();
          setTotalNaoLidas(data.totalNaoLidas);
        }
      } catch (error) {
        console.error("Erro ao buscar contagem:", error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const marcarComoLida = async (id: string) => {
    try {
      const response = await fetch("/api/aluno/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificacaoId: id }),
      });

      if (response.ok) {
        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
        setTotalNaoLidas((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const response = await fetch("/api/aluno/notificacoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcarTodas: true }),
      });

      if (response.ok) {
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
        setTotalNaoLidas(0);
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const response = await fetch(`/api/aluno/notificacoes?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const notificacao = notificacoes.find((n) => n.id === id);
        setNotificacoes((prev) => prev.filter((n) => n.id !== id));
        if (notificacao && !notificacao.lida) {
          setTotalNaoLidas((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const limparLidas = async () => {
    try {
      const response = await fetch("/api/aluno/notificacoes?apenasLidas=true", {
        method: "DELETE",
      });

      if (response.ok) {
        setNotificacoes((prev) => prev.filter((n) => !n.lida));
      }
    } catch (error) {
      console.error("Erro ao limpar notificações:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNaoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
              {totalNaoLidas > 0 && (
                <Badge variant="secondary">{totalNaoLidas} novas</Badge>
              )}
            </SheetTitle>
          </div>
          {notificacoes.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={marcarTodasComoLidas}
                disabled={totalNaoLidas === 0}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={limparLidas}
                disabled={notificacoes.every((n) => !n.lida)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar lidas
              </Button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors relative group",
                    !notificacao.lida && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {tipoIcons[notificacao.tipo] || tipoIcons.SISTEMA}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            "text-sm font-medium line-clamp-1",
                            !notificacao.lida && "font-semibold"
                          )}
                        >
                          {notificacao.titulo}
                        </h4>
                        {!notificacao.lida && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notificacao.mensagem}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notificacao.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {notificacao.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-7 px-2"
                              onClick={() => {
                                if (!notificacao.lida) {
                                  marcarComoLida(notificacao.id);
                                }
                                setOpen(false);
                              }}
                            >
                              <Link href={notificacao.link}>Ver</Link>
                            </Button>
                          )}
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => marcarComoLida(notificacao.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => excluirNotificacao(notificacao.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
