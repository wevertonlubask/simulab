"use client";

import { useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Upload, FileUp, AlertTriangle, Loader2 } from "lucide-react";
import { FileDropzone } from "@/components/importacao/FileDropzone";
import { TemplateDownloader } from "@/components/importacao/TemplateDownloader";
import { ImportPreviewTable } from "@/components/importacao/ImportPreviewTable";
import { ImportEditModal } from "@/components/importacao/ImportEditModal";
import { ImportProgressBar } from "@/components/importacao/ImportProgressBar";
import { ImportResultCard } from "@/components/importacao/ImportResultCard";
import { parseFile, readFile } from "@/lib/importacao/parsers";
import { validarQuestoes, type QuestaoValidada, type QuestaoImport } from "@/lib/validations/importacao";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ImportState = "idle" | "parsing" | "preview" | "importing" | "done";

export default function ImportarQuestoesPage({ params }: PageProps) {
  const { id: simuladoId } = use(params);
  const router = useRouter();

  const [state, setState] = useState<ImportState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [questoesValidadas, setQuestoesValidadas] = useState<QuestaoValidada[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [modo, setModo] = useState<"adicionar" | "substituir">("adicionar");
  const [showSubstituirDialog, setShowSubstituirDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: "" });
  const [importResult, setImportResult] = useState<{
    importadas: number;
    ignoradas: number;
    erros: number;
    total: number;
  } | null>(null);

  // Processar arquivo selecionado
  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setState("parsing");
    setParseErrors([]);

    try {
      const content = await readFile(file);
      const result = await parseFile(file, content);

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
      }

      if (result.questoes.length > 0) {
        const validadas = validarQuestoes(result.questoes);
        setQuestoesValidadas(validadas);
        setState("preview");
      } else if (result.errors.length === 0) {
        toast.error("Nenhuma questão encontrada no arquivo");
        setState("idle");
      } else {
        setState("idle");
      }
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
      setState("idle");
    }
  }, []);

  // Limpar arquivo selecionado
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setQuestoesValidadas([]);
    setParseErrors([]);
    setState("idle");
    setImportResult(null);
  }, []);

  // Editar questão
  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  // Salvar edição
  const handleSaveEdit = (index: number, questao: Partial<QuestaoImport>) => {
    const novasQuestoes = [...questoesValidadas];
    novasQuestoes[index] = {
      ...novasQuestoes[index],
      questao,
    };

    // Revalidar
    const revalidadas = validarQuestoes(novasQuestoes.map((q) => q.questao));
    setQuestoesValidadas(revalidadas);
    setEditingIndex(null);
  };

  // Iniciar importação
  const handleImport = async () => {
    if (modo === "substituir") {
      setShowSubstituirDialog(true);
      return;
    }

    await executeImport();
  };

  // Executar importação
  const executeImport = async () => {
    setShowSubstituirDialog(false);
    setState("importing");

    const questoesValidas = questoesValidadas
      .filter((q) => q.status !== "error")
      .map((q) => q.questao);

    setImportProgress({
      current: 0,
      total: questoesValidas.length,
      status: "Preparando importação...",
    });

    try {
      const response = await fetch(`/api/simulados/${simuladoId}/importar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questoes: questoesValidas,
          modo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na importação");
      }

      setImportResult(data.resultado);
      setState("done");
      toast.success(`${data.resultado.importadas} questões importadas com sucesso!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na importação");
      setState("preview");
    }
  };

  const questoesValidas = questoesValidadas.filter((q) => q.status !== "error").length;
  const questoesComErro = questoesValidadas.filter((q) => q.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/docente/simulados/${simuladoId}/questoes`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Questões</h1>
          <p className="text-muted-foreground">
            Importe questões em massa via CSV, Excel ou JSON
          </p>
        </div>
      </div>

      {/* Estado: Resultado da importação */}
      {state === "done" && importResult && (
        <ImportResultCard result={importResult} simuladoId={simuladoId} />
      )}

      {/* Estado: Importando */}
      {state === "importing" && (
        <Card>
          <CardContent className="py-8">
            <ImportProgressBar
              current={importProgress.current}
              total={importProgress.total}
              status={importProgress.status}
            />
          </CardContent>
        </Card>
      )}

      {/* Estado: Preview */}
      {state === "preview" && (
        <>
          {/* Opções de importação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opções de Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={modo}
                onValueChange={(v) => setModo(v as "adicionar" | "substituir")}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="adicionar"
                  className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary"
                >
                  <RadioGroupItem value="adicionar" id="adicionar" />
                  <div>
                    <p className="font-medium">Adicionar às existentes</p>
                    <p className="text-sm text-muted-foreground">
                      Mantém as questões atuais e adiciona as novas
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="substituir"
                  className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 [&:has(:checked)]:border-primary [&:has(:checked)]:border-red-500"
                >
                  <RadioGroupItem value="substituir" id="substituir" />
                  <div>
                    <p className="font-medium text-red-600">Substituir todas</p>
                    <p className="text-sm text-muted-foreground">
                      Remove todas as questões existentes
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Tabela de preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Preview das Questões</CardTitle>
                  <CardDescription>
                    Revise as questões antes de importar
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{questoesValidadas.length} questões</Badge>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    Escolher outro arquivo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ImportPreviewTable questoes={questoesValidadas} onEdit={handleEdit} />
            </CardContent>
          </Card>

          {/* Botão de importar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {questoesValidas > 0 && (
                <span className="text-green-600 font-medium">{questoesValidas} questões serão importadas</span>
              )}
              {questoesComErro > 0 && (
                <span className="text-red-500 ml-2">({questoesComErro} com erros serão ignoradas)</span>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleImport}
              disabled={questoesValidas === 0}
              className="gap-2"
            >
              <FileUp className="h-4 w-4" />
              Importar {questoesValidas} Questões
            </Button>
          </div>
        </>
      )}

      {/* Estado: Idle ou Parsing */}
      {(state === "idle" || state === "parsing") && (
        <>
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>
                Baixe um template para preencher com suas questões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateDownloader />
            </CardContent>
          </Card>

          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload do Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDropzone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClear}
                disabled={state === "parsing"}
              />

              {state === "parsing" && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-muted-foreground">Processando arquivo...</span>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-600">Erros encontrados no arquivo:</p>
                      <ul className="mt-2 space-y-1 text-sm text-red-500">
                        {parseErrors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {parseErrors.length > 5 && (
                          <li>...e mais {parseErrors.length - 5} erros</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ol className="space-y-2 text-muted-foreground">
                <li>Baixe um dos templates acima (CSV, Excel ou JSON)</li>
                <li>Preencha o template com suas questões seguindo o formato</li>
                <li>Faça upload do arquivo preenchido</li>
                <li>Revise o preview e corrija eventuais erros</li>
                <li>Confirme a importação</li>
              </ol>

              <h4 className="mt-6 mb-2 font-semibold text-foreground">Tipos de questão suportados:</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                <li><Badge variant="secondary">MULTIPLA_ESCOLHA_UNICA</Badge></li>
                <li><Badge variant="secondary">MULTIPLA_ESCOLHA_MULTIPLA</Badge></li>
                <li><Badge variant="secondary">DRAG_DROP</Badge> (via JSON)</li>
                <li><Badge variant="secondary">ASSOCIACAO</Badge> (via JSON)</li>
                <li><Badge variant="secondary">ORDENACAO</Badge> (via JSON)</li>
                <li><Badge variant="secondary">LACUNA</Badge> (via JSON)</li>
                <li><Badge variant="secondary">COMANDO</Badge> (via JSON)</li>
              </ul>

              <p className="mt-4 text-sm">
                <strong>Nota:</strong> Os templates CSV e Excel suportam apenas questões de múltipla escolha.
                Para outros tipos, utilize o template JSON.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de edição */}
      <ImportEditModal
        questao={editingIndex !== null ? questoesValidadas[editingIndex] : null}
        open={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        onSave={handleSaveEdit}
      />

      {/* Dialog de confirmação para substituir */}
      <AlertDialog open={showSubstituirDialog} onOpenChange={setShowSubstituirDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Substituir Todas as Questões?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá <strong className="text-red-500">DELETAR</strong> todas as questões
              existentes neste simulado e substituí-las pelas questões importadas.
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeImport}
              className="bg-red-500 hover:bg-red-600"
            >
              Sim, Substituir Todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
