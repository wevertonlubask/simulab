import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { TurmasList } from "@/components/turmas/TurmasList";

export const metadata: Metadata = {
  title: "Turmas",
};

export default async function TurmasPage() {
  await requireRole(["DOCENTE", "SUPERADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
        <p className="text-muted-foreground">
          Gerencie suas turmas, alunos e provas vinculadas.
        </p>
      </div>

      <TurmasList />
    </div>
  );
}
