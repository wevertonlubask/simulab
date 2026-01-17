"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  Calendar,
  BookOpen,
  Users,
  FileText,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  _count: {
    tentativas: number;
    turmasAluno: number;
    turmasDocente: number;
    simulados: number;
  };
}

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "SUPERADMIN":
      return "Super Admin";
    case "DOCENTE":
      return "Docente";
    case "ALUNO":
      return "Aluno";
    default:
      return role;
  }
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "SUPERADMIN":
      return "default";
    case "DOCENTE":
      return "secondary";
    default:
      return "outline";
  }
}

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password form states
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.user);
          setNome(data.user.nome);
          setEmail(data.user.email);
          setAvatarUrl(data.user.avatar || "");
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        toast.error("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          avatar: avatarUrl || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
        await update({ nome, email });
        toast.success("Perfil atualizado com sucesso!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmarSenha,
        }),
      });

      if (response.ok) {
        toast.success("Senha alterada com sucesso!");
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card do perfil */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar || undefined} alt={profile.nome} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(profile.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.nome}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge variant={getRoleBadgeVariant(profile.role)} className="mt-2">
                {getRoleLabel(profile.role)}
              </Badge>

              <Separator className="my-4" />

              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Membro desde
                  </span>
                  <span className="font-medium">
                    {format(new Date(profile.createdAt), "MMM yyyy", { locale: ptBR })}
                  </span>
                </div>

                {profile.role === "ALUNO" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Turmas
                      </span>
                      <span className="font-medium">{profile._count.turmasAluno}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Tentativas
                      </span>
                      <span className="font-medium">{profile._count.tentativas}</span>
                    </div>
                  </>
                )}

                {(profile.role === "DOCENTE" || profile.role === "SUPERADMIN") && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Turmas
                      </span>
                      <span className="font-medium">{profile._count.turmasDocente}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Simulados
                      </span>
                      <span className="font-medium">{profile._count.simulados}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="perfil">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="perfil">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="seguranca">
                  <Lock className="h-4 w-4 mr-2" />
                  Segurança
                </TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-9"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">URL do Avatar</Label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="avatar"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="pl-9"
                      placeholder="https://exemplo.com/avatar.jpg"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Insira a URL de uma imagem para seu avatar
                  </p>
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar alterações
                </Button>
              </TabsContent>

              <TabsContent value="seguranca" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="senhaAtual"
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      className="pl-9"
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="novaSenha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="pl-9"
                      placeholder="Digite a nova senha"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmarSenha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="pl-9"
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !senhaAtual || !novaSenha || !confirmarSenha}
                  className="w-full"
                  variant="secondary"
                >
                  {changingPassword ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Alterar senha
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
