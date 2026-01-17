import { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SimuladosList } from "@/components/simulados/SimuladosList";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Simulados",
};

export default async function SimuladosPage() {
  await requireRole(["DOCENTE", "SUPERADMIN"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
          <p className="text-muted-foreground">
            Gerencie seus bancos de questões
          </p>
        </div>
        <Link href="/docente/simulados/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Simulado
          </Button>
        </Link>
      </div>

      <SimuladosList />
    </div>
  );
}
