"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  BookOpen,
  FileText,
  Target,
  Activity,
  TrendingUp,
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  GraduationCap,
  UserCog,
  BarChart3,
  HelpCircle,
  Settings,
} from "lucide-react";
import { LogoUploader, LogoUploaderSkeleton } from "@/components/admin/LogoUploader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stats {
  totais: {
    users: number;
    alunos: number;
    docentes: number;
    superadmins: number;
    simulados: number;
    provas: number;
    tentativas: number;
    turmas: number;
    questoes: number;
  };
  porStatus: {
    tentativas: Record<string, number>;
    simulados: Record<string, number>;
    provas: Record<string, number>;
  };
  ultimos30Dias: {
    novosUsuarios: number;
    novasTentativas: number;
  };
  categorias: { nome: string; total: number }[];
  atividadeRecente: {
    tentativas: number;
    usuarios: number;
    simulados: number;
  };
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
  _count: {
    turmasAluno: number;
    turmasDocente: number;
    simulados: number;
    tentativas: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  DOCENTE: "Docente",
  ALUNO: "Aluno",
};

const roleIcons: Record<string, React.ReactNode> = {
  SUPERADMIN: <Shield className="h-4 w-4" />,
  DOCENTE: <UserCog className="h-4 w-4" />,
  ALUNO: <GraduationCap className="h-4 w-4" />,
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  SUPERADMIN: "default",
  DOCENTE: "secondary",
  ALUNO: "outline",
};

interface LogoConfig {
  logo_light: string | null;
  logo_dark: string | null;
  logo_favicon: string | null;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [logos, setLogos] = useState<LogoConfig | null>(null);
  const [loadingLogos, setLoadingLogos] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal de criar/editar usuário
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "ALUNO",
  });
  const [saving, setSaving] = useState(false);

  // Carregar estatísticas
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Carregar logos
  const loadLogos = useCallback(async () => {
    try {
      setLoadingLogos(true);
      const response = await fetch("/api/admin/config/logo");
      if (response.ok) {
        const data = await response.json();
        setLogos(data);
      }
    } catch (error) {
      console.error("Erro ao carregar logos:", error);
    } finally {
      setLoadingLogos(false);
    }
  }, []);

  useEffect(() => {
    loadLogos();
  }, [loadLogos]);

  // Carregar usuários
  useEffect(() => {
    async function loadUsers() {
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(searchQuery && { search: searchQuery }),
          ...(roleFilter && { role: roleFilter }),
        });

        const response = await fetch(`/api/admin/users?${params}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    }

    loadUsers();
  }, [pagination.page, searchQuery, roleFilter]);

  const handleCreateUser = async () => {
    setSaving(true);
    try {
      // Não enviar senha vazia - usar senha padrão do backend
      const dataToSend = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
        ...(formData.senha && { senha: formData.senha }),
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        toast.success("Usuário criado com sucesso!");
        setIsCreateOpen(false);
        setFormData({ nome: "", email: "", senha: "", role: "ALUNO" });
        // Recarregar lista
        const params = new URLSearchParams({
          page: "1",
          limit: pagination.limit.toString(),
        });
        const usersResponse = await fetch(`/api/admin/users?${params}`);
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(data.users);
          setPagination(data.pagination);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao criar usuário");
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast.error("Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const updateData: Record<string, string> = {};
      if (formData.nome !== editingUser.nome) updateData.nome = formData.nome;
      if (formData.email !== editingUser.email) updateData.email = formData.email;
      if (formData.role !== editingUser.role) updateData.role = formData.role;
      if (formData.senha) updateData.senha = formData.senha;

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success("Usuário atualizado com sucesso!");
        setIsEditOpen(false);
        setEditingUser(null);
        // Atualizar lista
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, ...formData }
              : u
          )
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Usuário excluído com sucesso!");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário");
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: "",
      role: user.role,
    });
    setIsEditOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e visualize estatísticas do sistema
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {stats && (
            <>
              {/* Cards principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Usuários
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totais.users}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.ultimos30Dias.novosUsuarios} nos últimos 30 dias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Simulados
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totais.simulados}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totais.questoes} questões no total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Provas
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totais.provas}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.totais.turmas} turmas ativas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tentativas
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totais.tentativas}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.ultimos30Dias.novasTentativas} nos últimos 30 dias
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Distribuição de usuários e atividade */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Distribuição de Usuários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Super Admins</span>
                      </div>
                      <Badge variant="default">{stats.totais.superadmins}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-blue-500" />
                        <span>Docentes</span>
                      </div>
                      <Badge variant="secondary">{stats.totais.docentes}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-500" />
                        <span>Alunos</span>
                      </div>
                      <Badge variant="outline">{stats.totais.alunos}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Atividade (7 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Novas tentativas</span>
                      <span className="font-semibold">
                        {stats.atividadeRecente.tentativas}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Novos usuários</span>
                      <span className="font-semibold">
                        {stats.atividadeRecente.usuarios}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Novos simulados</span>
                      <span className="font-semibold">
                        {stats.atividadeRecente.simulados}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Categorias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.categorias.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma categoria ainda
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {stats.categorias.map((cat, index) => (
                          <div key={cat.nome} className="flex items-center gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {cat.nome}
                              </p>
                            </div>
                            <Badge variant="outline">{cat.total}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Usuários */}
        <TabsContent value="users" className="space-y-6">
          {/* Filtros e ações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select
                  value={roleFilter || "all"}
                  onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrar por papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="DOCENTE">Docente</SelectItem>
                    <SelectItem value="ALUNO">Aluno</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) =>
                            setFormData({ ...formData, nome: e.target.value })
                          }
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="senha">Senha (opcional)</Label>
                        <Input
                          id="senha"
                          type="password"
                          value={formData.senha}
                          onChange={(e) =>
                            setFormData({ ...formData, senha: e.target.value })
                          }
                          placeholder="Deixe vazio para usar Mudar@123"
                        />
                        <p className="text-xs text-muted-foreground">
                          Se não informar, o usuário receberá a senha padrão e precisará alterá-la no primeiro login.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Papel</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(v) =>
                            setFormData({ ...formData, role: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALUNO">Aluno</SelectItem>
                            <SelectItem value="DOCENTE">Docente</SelectItem>
                            <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateUser} disabled={saving}>
                        {saving && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Criar Usuário
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários ({pagination.total})</CardTitle>
              <CardDescription>
                Lista de todos os usuários cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead className="text-center">Atividade</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariants[user.role]}>
                          <span className="mr-1">{roleIcons[user.role]}</span>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.role === "ALUNO" ? (
                          <span className="text-sm">
                            {user._count.tentativas} tentativas
                          </span>
                        ) : user.role === "DOCENTE" ? (
                          <span className="text-sm">
                            {user._count.simulados} simulados
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Admin
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(user.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir usuário?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Todos os dados
                                  associados a este usuário serão excluídos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page - 1 }))
                      }
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: p.page + 1 }))
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal de edição */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-senha">Nova Senha (opcional)</Label>
                  <Input
                    id="edit-senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                    placeholder="Deixe em branco para manter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Papel</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      setFormData({ ...formData, role: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALUNO">Aluno</SelectItem>
                      <SelectItem value="DOCENTE">Docente</SelectItem>
                      <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditUser} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo do Sistema</CardTitle>
              <CardDescription>
                Configure as logos para tema claro e escuro, além do favicon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogos ? (
                <LogoUploaderSkeleton />
              ) : (
                <LogoUploader
                  initialLogos={logos || undefined}
                  onLogoChange={loadLogos}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
