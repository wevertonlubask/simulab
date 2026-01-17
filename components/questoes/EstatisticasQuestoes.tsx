import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface EstatisticasQuestoesProps {
  stats: {
    total: number;
    ativas: number;
    porDificuldade: {
      FACIL: number;
      MEDIO: number;
      DIFICIL: number;
    };
  };
}

export function EstatisticasQuestoes({ stats }: EstatisticasQuestoesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.ativas} ativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Fácil</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {stats.porDificuldade.FACIL}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.porDificuldade.FACIL / stats.total) * 100)}%`
              : "0%"}{" "}
            do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Médio</CardTitle>
          <AlertTriangle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {stats.porDificuldade.MEDIO}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.porDificuldade.MEDIO / stats.total) * 100)}%`
              : "0%"}{" "}
            do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Difícil</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {stats.porDificuldade.DIFICIL}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.porDificuldade.DIFICIL / stats.total) * 100)}%`
              : "0%"}{" "}
            do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
