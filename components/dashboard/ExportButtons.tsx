"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Table2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportData {
  resumo: {
    alunosAtivos: number;
    provasRealizadas: number;
    mediaGeral: number;
    taxaAprovacao: number;
  };
  ranking: {
    posicao: number;
    nome: string;
    email: string;
    notaMedia: number;
    totalProvas: number;
    taxaAprovacao: number;
  }[];
  realizacoes: {
    data: string;
    quantidade: number;
  }[];
  questoesProblematicas: {
    simulado: string;
    enunciado: string;
    taxaErro: number;
    vezesRespondida: number;
  }[];
  periodo: string;
}

interface ExportButtonsProps {
  data: ExportData;
  loading?: boolean;
}

export function ExportButtons({ data, loading = false }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const { toast } = useToast();

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241); // Primary color
      doc.text("Simulab - Relatório do Docente", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Período: ${data.periodo}`, pageWidth / 2, 28, { align: "center" });
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 34, { align: "center" });

      // Resumo
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Resumo", 14, 48);

      autoTable(doc, {
        startY: 52,
        head: [["Métrica", "Valor"]],
        body: [
          ["Alunos Ativos", data.resumo.alunosAtivos.toString()],
          ["Provas Realizadas", data.resumo.provasRealizadas.toString()],
          ["Média Geral", `${data.resumo.mediaGeral}%`],
          ["Taxa de Aprovação", `${data.resumo.taxaAprovacao}%`],
        ],
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Ranking (top 20)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY1 = (doc as any).lastAutoTable.finalY || 80;
      doc.text("Ranking de Alunos (Top 20)", 14, finalY1 + 12);

      autoTable(doc, {
        startY: finalY1 + 16,
        head: [["Pos.", "Nome", "Média", "Provas", "Aprovação"]],
        body: data.ranking.slice(0, 20).map((a) => [
          a.posicao.toString(),
          a.nome,
          `${a.notaMedia}%`,
          a.totalProvas.toString(),
          `${a.taxaAprovacao}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241] },
        columnStyles: {
          0: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
        },
      });

      // Questões Problemáticas
      if (data.questoesProblematicas.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY2 = (doc as any).lastAutoTable.finalY || 120;

        if (finalY2 > 220) {
          doc.addPage();
          doc.text("Questões Problemáticas", 14, 20);
          autoTable(doc, {
            startY: 24,
            head: [["Simulado", "Enunciado", "Taxa Erro", "Respostas"]],
            body: data.questoesProblematicas.map((q) => [
              q.simulado,
              q.enunciado.slice(0, 50) + "...",
              `${q.taxaErro}%`,
              q.vezesRespondida.toString(),
            ]),
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
          });
        } else {
          doc.text("Questões Problemáticas", 14, finalY2 + 12);
          autoTable(doc, {
            startY: finalY2 + 16,
            head: [["Simulado", "Enunciado", "Taxa Erro", "Respostas"]],
            body: data.questoesProblematicas.map((q) => [
              q.simulado,
              q.enunciado.slice(0, 50) + "...",
              `${q.taxaErro}%`,
              q.vezesRespondida.toString(),
            ]),
            theme: "striped",
            headStyles: { fillColor: [99, 102, 241] },
          });
        }
      }

      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Simulab - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`relatorio-docente-${new Date().toISOString().split("T")[0]}.pdf`);

      toast({
        title: "PDF exportado",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async () => {
    setExporting("excel");
    try {
      const workbook = XLSX.utils.book_new();

      // Aba Resumo
      const resumoData = [
        ["Métrica", "Valor"],
        ["Alunos Ativos", data.resumo.alunosAtivos],
        ["Provas Realizadas", data.resumo.provasRealizadas],
        ["Média Geral", `${data.resumo.mediaGeral}%`],
        ["Taxa de Aprovação", `${data.resumo.taxaAprovacao}%`],
        [],
        ["Período", data.periodo],
        ["Data de Geração", new Date().toLocaleDateString("pt-BR")],
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, wsResumo, "Resumo");

      // Aba Ranking
      const rankingData = [
        ["Posição", "Nome", "Email", "Média", "Provas", "Taxa Aprovação"],
        ...data.ranking.map((a) => [
          a.posicao,
          a.nome,
          a.email,
          `${a.notaMedia}%`,
          a.totalProvas,
          `${a.taxaAprovacao}%`,
        ]),
      ];
      const wsRanking = XLSX.utils.aoa_to_sheet(rankingData);
      XLSX.utils.book_append_sheet(workbook, wsRanking, "Ranking");

      // Aba Realizações
      const realizacoesData = [
        ["Data", "Quantidade"],
        ...data.realizacoes.map((r) => [
          new Date(r.data).toLocaleDateString("pt-BR"),
          r.quantidade,
        ]),
      ];
      const wsRealizacoes = XLSX.utils.aoa_to_sheet(realizacoesData);
      XLSX.utils.book_append_sheet(workbook, wsRealizacoes, "Realizações");

      // Aba Questões Problemáticas
      if (data.questoesProblematicas.length > 0) {
        const questoesData = [
          ["Simulado", "Enunciado", "Taxa de Erro", "Vezes Respondida"],
          ...data.questoesProblematicas.map((q) => [
            q.simulado,
            q.enunciado,
            `${q.taxaErro}%`,
            q.vezesRespondida,
          ]),
        ];
        const wsQuestoes = XLSX.utils.aoa_to_sheet(questoesData);
        XLSX.utils.book_append_sheet(workbook, wsQuestoes, "Questões");
      }

      XLSX.writeFile(
        workbook,
        `relatorio-docente-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Excel exportado",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading || exporting !== null}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportPDF} disabled={exporting !== null}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} disabled={exporting !== null}>
          <Table2 className="mr-2 h-4 w-4" />
          Exportar Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
