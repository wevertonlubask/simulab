import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatorioGeralData {
  estatisticas: {
    totalSimulados: number;
    totalProvas: number;
    totalTentativas: number;
    totalTurmas: number;
    totalAlunos: number;
  };
  topSimulados: Array<{
    nome: string;
    categoria: string;
    totalProvas: number;
    totalTentativas: number;
  }>;
  topTurmas: Array<{
    nome: string;
    codigo: string;
    totalAlunos: number;
  }>;
}

interface RelatorioProvaData {
  prova: {
    nome: string;
    codigo: string;
    notaMinima: number;
    tempoLimite: number | null;
    simulado: {
      nome: string;
      categoria: string;
    };
  };
  estatisticas: {
    totalTentativas: number;
    aprovacoes: number;
    reprovacoes: number;
    taxaAprovacao: number;
    mediaGeral: number;
    notaMaxima: number;
    notaMinima: number;
    desvioPadrao: number;
  };
  estatisticasQuestoes: Array<{
    ordem: number;
    enunciado: string;
    tipo: string;
    dificuldade: string;
    taxaAcerto: number;
  }>;
  ranking: Array<{
    posicao: number;
    alunoNome: string;
    alunoEmail: string;
    nota: number | null;
    aprovado: boolean;
  }>;
}

interface RelatorioTurmaData {
  turma: {
    nome: string;
    codigo: string;
    totalAlunos: number;
  };
  estatisticas: {
    totalAlunos: number;
    alunosAtivos: number;
    provasDisponiveis: number;
    mediaTurma: number;
  };
  desempenhoAlunos: Array<{
    alunoNome: string;
    alunoEmail: string;
    provasRealizadas: number;
    provasDisponiveis: number;
    aprovacoes: number;
    mediaGeral: number;
    taxaAprovacao: number;
  }>;
}

export function gerarRelatorioGeralPDF(data: RelatorioGeralData): void {
  const doc = new jsPDF();
  const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // primary blue
  doc.text("Simulab - Relatório Geral", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${dataAtual}`, 14, 30);

  // Estatísticas Gerais
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Estatísticas Gerais", 14, 45);

  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Simulados", data.estatisticas.totalSimulados.toString()],
      ["Total de Provas", data.estatisticas.totalProvas.toString()],
      ["Total de Tentativas", data.estatisticas.totalTentativas.toString()],
      ["Total de Turmas", data.estatisticas.totalTurmas.toString()],
      ["Total de Alunos", data.estatisticas.totalAlunos.toString()],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });

  // Top Simulados
  const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Top Simulados por Tentativas", 14, finalY1 + 15);

  autoTable(doc, {
    startY: finalY1 + 20,
    head: [["Simulado", "Categoria", "Provas", "Tentativas"]],
    body: data.topSimulados.map((s) => [
      s.nome,
      s.categoria,
      s.totalProvas.toString(),
      s.totalTentativas.toString(),
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  // Top Turmas
  const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Top Turmas por Alunos", 14, finalY2 + 15);

  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Turma", "Código", "Alunos"]],
    body: data.topTurmas.map((t) => [t.nome, t.codigo, t.totalAlunos.toString()]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  // Rodapé
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Simulab`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save("relatorio-geral.pdf");
}

export function gerarRelatorioProvaPDF(data: RelatorioProvaData): void {
  const doc = new jsPDF();
  const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text("Simulab - Relatório de Prova", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${dataAtual}`, 14, 30);

  // Informações da Prova
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Informações da Prova", 14, 45);

  autoTable(doc, {
    startY: 50,
    body: [
      ["Prova:", data.prova.nome],
      ["Código:", data.prova.codigo],
      ["Simulado:", data.prova.simulado.nome],
      ["Categoria:", data.prova.simulado.categoria],
      ["Nota Mínima:", `${data.prova.notaMinima}%`],
      ["Tempo Limite:", data.prova.tempoLimite ? `${data.prova.tempoLimite} min` : "Sem limite"],
    ],
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });

  // Estatísticas
  const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Estatísticas de Desempenho", 14, finalY1 + 15);

  autoTable(doc, {
    startY: finalY1 + 20,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Tentativas", data.estatisticas.totalTentativas.toString()],
      ["Aprovações", data.estatisticas.aprovacoes.toString()],
      ["Reprovações", data.estatisticas.reprovacoes.toString()],
      ["Taxa de Aprovação", `${data.estatisticas.taxaAprovacao.toFixed(1)}%`],
      ["Média Geral", data.estatisticas.mediaGeral.toFixed(1)],
      ["Nota Máxima", data.estatisticas.notaMaxima.toFixed(1)],
      ["Nota Mínima", data.estatisticas.notaMinima.toFixed(1)],
      ["Desvio Padrão", data.estatisticas.desvioPadrao.toFixed(2)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });

  // Desempenho por Questão
  const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Desempenho por Questão", 14, finalY2 + 15);

  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["#", "Tipo", "Dificuldade", "Taxa de Acerto"]],
    body: data.estatisticasQuestoes.map((q) => [
      q.ordem.toString(),
      q.tipo.replace(/_/g, " "),
      q.dificuldade,
      `${q.taxaAcerto.toFixed(1)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  // Ranking - nova página
  doc.addPage();

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Ranking de Alunos", 14, 20);

  autoTable(doc, {
    startY: 25,
    head: [["Pos.", "Aluno", "E-mail", "Nota", "Status"]],
    body: data.ranking.map((r) => [
      r.posicao.toString(),
      r.alunoNome,
      r.alunoEmail,
      r.nota?.toFixed(1) ?? "-",
      r.aprovado ? "Aprovado" : "Reprovado",
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      4: {
        textColor: [100, 100, 100] as [number, number, number],
      },
    },
    didParseCell: function(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const rowIndex = hookData.row.index;
        if (data.ranking[rowIndex]?.aprovado) {
          hookData.cell.styles.textColor = [34, 197, 94] as [number, number, number];
        } else {
          hookData.cell.styles.textColor = [239, 68, 68] as [number, number, number];
        }
      }
    },
  });

  // Rodapé
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Simulab`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio-prova-${data.prova.codigo}.pdf`);
}

export function gerarRelatorioTurmaPDF(data: RelatorioTurmaData): void {
  const doc = new jsPDF();
  const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246);
  doc.text("Simulab - Relatório de Turma", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${dataAtual}`, 14, 30);

  // Informações da Turma
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Informações da Turma", 14, 45);

  autoTable(doc, {
    startY: 50,
    body: [
      ["Turma:", data.turma.nome],
      ["Código:", data.turma.codigo],
      ["Total de Alunos:", data.turma.totalAlunos.toString()],
    ],
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });

  // Estatísticas
  const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Estatísticas Gerais", 14, finalY1 + 15);

  autoTable(doc, {
    startY: finalY1 + 20,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Alunos", data.estatisticas.totalAlunos.toString()],
      ["Alunos Ativos", data.estatisticas.alunosAtivos.toString()],
      ["Provas Disponíveis", data.estatisticas.provasDisponiveis.toString()],
      ["Média da Turma", data.estatisticas.mediaTurma.toFixed(1)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });

  // Desempenho dos Alunos
  const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(14);
  doc.text("Desempenho dos Alunos", 14, finalY2 + 15);

  autoTable(doc, {
    startY: finalY2 + 20,
    head: [["Aluno", "Provas", "Aprovações", "Média", "Taxa Aprovação"]],
    body: data.desempenhoAlunos.map((a) => [
      a.alunoNome,
      `${a.provasRealizadas}/${a.provasDisponiveis}`,
      a.aprovacoes.toString(),
      a.mediaGeral.toFixed(1),
      `${a.taxaAprovacao.toFixed(0)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  // Rodapé
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Simulab`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`relatorio-turma-${data.turma.codigo}.pdf`);
}
