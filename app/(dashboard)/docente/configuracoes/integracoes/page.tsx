"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Download,
  Upload,
  Link2,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Simulado {
  id: string;
  nome: string;
  categoria: string;
}

export default function IntegracoesPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loadingSimulados, setLoadingSimulados] = useState(false);
  const [exportSimuladoId, setExportSimuladoId] = useState("");
  const [importSimuladoId, setImportSimuladoId] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  // Carregar simulados
  const loadSimulados = async () => {
    if (simulados.length > 0) return;

    setLoadingSimulados(true);
    try {
      const response = await fetch("/api/simulados");
      if (response.ok) {
        const data = await response.json();
        setSimulados(data.simulados || []);
      }
    } catch (err) {
      console.error("Erro ao carregar simulados:", err);
    } finally {
      setLoadingSimulados(false);
    }
  };

  // Exportar para Moodle
  const handleExportMoodle = async () => {
    if (!exportSimuladoId) {
      toast.error("Selecione um simulado");
      return;
    }

    setExporting(true);
    try {
      const response = await fetch(
        `/api/integrations/moodle/export?simuladoId=${exportSimuladoId}`
      );

      if (!response.ok) {
        throw new Error("Erro ao exportar");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `simulado_moodle.gift`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Questões exportadas para formato GIFT!");
    } catch (err) {
      console.error("Erro ao exportar:", err);
      toast.error("Erro ao exportar questões");
    } finally {
      setExporting(false);
    }
  };

  // Importar do Moodle
  const handleImportMoodle = async () => {
    if (!importSimuladoId) {
      toast.error("Selecione um simulado");
      return;
    }

    if (!importFile) {
      toast.error("Selecione um arquivo GIFT");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("simuladoId", importSimuladoId);

      const response = await fetch("/api/integrations/moodle/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao importar");
      }

      toast.success(data.message);
      setImportFile(null);
    } catch (err) {
      console.error("Erro ao importar:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao importar questões"
      );
    } finally {
      setImporting(false);
    }
  };

  // Conectar Google Classroom
  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const response = await fetch("/api/integrations/google-classroom/auth");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar");
      }

      // Redirecionar para página de autorização do Google
      window.location.href = data.authUrl;
    } catch (err) {
      console.error("Erro ao conectar Google:", err);
      toast.error(
        err instanceof Error ? err.message : "Erro ao conectar com Google Classroom"
      );
      setConnectingGoogle(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Conecte o Simulab com outras plataformas de ensino
        </p>
      </div>

      {/* Mensagens de status */}
      {success === "google_connected" && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-600 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>Google Classroom conectado com sucesso!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-600 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>
            {error === "google_auth_failed"
              ? "Falha na autenticação com Google"
              : error === "not_configured"
              ? "Integração não configurada"
              : "Ocorreu um erro na integração"}
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Moodle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Moodle
            </CardTitle>
            <CardDescription>
              Importe e exporte questões no formato GIFT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Formato GIFT</Badge>
              <span className="text-sm text-muted-foreground">
                Compatível com Moodle 2.x e 3.x
              </span>
            </div>

            <div className="flex gap-2">
              <Dialog onOpenChange={(open) => open && loadSimulados()}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Exportar para Moodle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Simulado</Label>
                      {loadingSimulados ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando...
                        </div>
                      ) : (
                        <Select
                          value={exportSimuladoId}
                          onValueChange={setExportSimuladoId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um simulado" />
                          </SelectTrigger>
                          <SelectContent>
                            {simulados.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      As questões serão exportadas no formato GIFT, que pode ser
                      importado diretamente no Moodle.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleExportMoodle} disabled={exporting}>
                      {exporting && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Exportar GIFT
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog onOpenChange={(open) => open && loadSimulados()}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar do Moodle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Simulado de destino</Label>
                      {loadingSimulados ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando...
                        </div>
                      ) : (
                        <Select
                          value={importSimuladoId}
                          onValueChange={setImportSimuladoId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um simulado" />
                          </SelectTrigger>
                          <SelectContent>
                            {simulados.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Arquivo GIFT</Label>
                      <Input
                        type="file"
                        accept=".gift,.txt"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecione um arquivo no formato GIFT exportado do Moodle.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleImportMoodle} disabled={importing}>
                      {importing && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Importar Questões
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="pt-2">
              <a
                href="https://docs.moodle.org/en/GIFT_format"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Saiba mais sobre o formato GIFT
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Google Classroom */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              Google Classroom
            </CardTitle>
            <CardDescription>
              Sincronize turmas e publique provas no Classroom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">OAuth 2.0</Badge>
              <span className="text-sm text-muted-foreground">
                Conexão segura com sua conta Google
              </span>
            </div>

            <Button
              className="w-full"
              onClick={handleConnectGoogle}
              disabled={connectingGoogle}
            >
              {connectingGoogle ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Conectar Google Classroom
            </Button>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Com a integração você poderá:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Importar alunos de suas turmas</li>
                <li>Publicar provas como atividades</li>
                <li>Sincronizar notas automaticamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração para Administradores</CardTitle>
          <CardDescription>
            Variáveis de ambiente necessárias para as integrações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Google Classroom</h4>
              <code className="block bg-muted p-3 rounded text-sm">
                GOOGLE_CLIENT_ID=seu_client_id
                <br />
                GOOGLE_CLIENT_SECRET=seu_client_secret
                <br />
                GOOGLE_REDIRECT_URI=https://seudominio.com/api/integrations/google-classroom/callback
              </code>
            </div>
            <p className="text-sm text-muted-foreground">
              Obtenha as credenciais no{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
              . Ative a Google Classroom API no projeto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
