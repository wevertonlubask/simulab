import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
}

export function EmptyState({
  title = "Nenhum simulado encontrado",
  description = "Comece criando seu primeiro simulado para adicionar questões e gerar provas.",
  showCreateButton = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {showCreateButton && (
        <Link href="/docente/simulados/novo" className="mt-6">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Criar Simulado
          </Button>
        </Link>
      )}
    </div>
  );
}
