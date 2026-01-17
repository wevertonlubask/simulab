import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimuladoForm } from "@/components/simulados/SimuladoForm";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Novo Simulado",
};

export default async function NovoSimuladoPage() {
  await requireRole(["DOCENTE", "SUPERADMIN"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/docente/simulados"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Simulado</h1>
        <p className="text-muted-foreground">
          Crie um novo banco de questões
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Simulado</CardTitle>
        </CardHeader>
        <CardContent>
          <SimuladoForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
