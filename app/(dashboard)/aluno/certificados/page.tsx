"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Award,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { gerarCertificadoPDF } from "@/lib/pdf/certificados";

interface Certificado {
  id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  nota: number;
  notaMinima: number;
  dataEmissao: string;
  dataValidade: string | null;
  prova: {
    id: string;
    nome: string;
    simulado: string;
    imagemUrl: string | null;
  };
  tentativaId: string;
}

export default function CertificadosPage() {
  const { data: session, status } = useSession();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    async function fetchCertificados() {
      try {
        const response = await fetch("/api/aluno/certificados");
        if (response.ok) {
          const data = await response.json();
          setCertificados(data);
        }
      } catch (error) {
        console.error("Erro ao buscar certificados:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchCertificados();
    }
  }, [session?.user?.id]);

  const handleDownload = async (certificado: Certificado) => {
    setDownloadingId(certificado.id);
    try {
      // Buscar dados completos do certificado
      const response = await fetch(`/api/aluno/certificados/${certificado.tentativaId}`);
      if (response.ok) {
        const data = await response.json();
        gerarCertificadoPDF({
          codigo: data.codigo,
          titulo: data.titulo,
          categoria: data.categoria,
          nota: data.nota,
          notaMinima: data.notaMinima,
          dataEmissao: data.dataEmissao,
          aluno: data.aluno,
          simulado: data.simulado,
          prova: data.prova,
          tentativa: data.tentativa,
        });
      }
    } catch (error) {
      console.error("Erro ao baixar certificado:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const categorias = Array.from(new Set(certificados.map((c) => c.categoria)));

  const filteredCertificados = certificados.filter((cert) => {
    const matchesSearch =
      search === "" ||
      cert.titulo.toLowerCase().includes(search.toLowerCase()) ||
      cert.codigo.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria =
      categoriaFilter === "all" || cert.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Award className="h-8 w-8 text-yellow-500" />
            Meus Certificados
          </h1>
          <p className="text-muted-foreground">
            Visualize e baixe seus certificados de aprovação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {certificados.length} certificado{certificados.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificados Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCertificados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
            {certificados.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum certificado ainda
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete provas com aprovação para ganhar seus certificados.
                  Eles aparecerão aqui automaticamente!
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground text-center">
                  Tente ajustar os filtros de busca
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCertificados.map((certificado) => (
            <Card
              key={certificado.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header decorativo */}
              <div className="h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500" />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="mb-2">
                    {certificado.categoria}
                  </Badge>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {certificado.nota.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">
                  {certificado.titulo}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Emitido em{" "}
                      {format(new Date(certificado.dataEmissao), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span className="font-mono text-xs">{certificado.codigo}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(certificado)}
                    disabled={downloadingId === certificado.id}
                    className="flex-1"
                  >
                    {downloadingId === certificado.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(
                        `/certificados/validar/${certificado.codigo}`,
                        "_blank"
                      )
                    }
                    title="Verificar autenticidade"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
