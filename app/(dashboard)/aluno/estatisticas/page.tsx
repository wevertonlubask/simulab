import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { EstatisticasCharts } from "@/components/aluno/EstatisticasCharts";

export const metadata: Metadata = {
  title: "Estatísticas",
};

export default async function EstatisticasPage() {
  await requireRole(["ALUNO"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estatísticas</h1>
        <p className="text-muted-foreground">
          Visualize seu desempenho com gráficos detalhados
        </p>
      </div>

      <EstatisticasCharts />
    </div>
  );
}
