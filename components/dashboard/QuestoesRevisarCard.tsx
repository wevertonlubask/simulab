"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, ChevronRight, Eye } from "lucide-react";

interface QuestaoRevisar {
  questaoId: string;
  enunciado: string;
  simulado: string;
  categoria: string;
  vezesErrada: number;
}

interface QuestoesRevisarCardProps {
  questoes: QuestaoRevisar[];
  loading?: boolean;
}

export function QuestoesRevisarCard({ questoes, loading = false }: QuestoesRevisarCardProps) {
  const [selectedQuestao, setSelectedQuestao] = useState<QuestaoRevisar | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Questões para Revisar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-lg border">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Questões para Revisar</CardTitle>
            {questoes.length > 0 && (
              <Badge variant="destructive">{questoes.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {questoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-500/10 p-3 mb-3">
                <AlertCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                Parabéns! Nenhuma questão frequentemente errada
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questoes.map((questao) => (
                <div
                  key={questao.questaoId}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm line-clamp-2">{questao.enunciado}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {questao.categoria}
                      </Badge>
                      <span className="text-xs text-destructive">
                        {questao.vezesErrada}x errada
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedQuestao(questao)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Revisar
                    </Button>
                  </div>
                </div>
              ))}
              {questoes.length >= 5 && (
                <button className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline w-full">
                  Ver mais
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedQuestao} onOpenChange={() => setSelectedQuestao(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Questão</DialogTitle>
          </DialogHeader>
          {selectedQuestao && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge>{selectedQuestao.simulado}</Badge>
                <Badge variant="outline">{selectedQuestao.categoria}</Badge>
                <Badge variant="destructive">
                  {selectedQuestao.vezesErrada}x errada
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="whitespace-pre-wrap">{selectedQuestao.enunciado}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Revise esta questão e pratique novamente no simulado correspondente
                para melhorar seu desempenho.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
