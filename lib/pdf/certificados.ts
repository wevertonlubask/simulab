import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificadoData {
  codigo: string;
  titulo: string;
  categoria: string;
  nota: number;
  notaMinima: number;
  dataEmissao: string;
  aluno: {
    nome: string;
  };
  simulado: {
    nome: string;
    docente: string;
  };
  prova: {
    nome: string;
  };
  tentativa?: {
    totalAcertos?: number | null;
    totalQuestoes?: number | null;
  };
}

export function gerarCertificadoPDF(data: CertificadoData): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Cores
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const goldColor: [number, number, number] = [234, 179, 8]; // yellow-500
  const darkColor: [number, number, number] = [30, 41, 59]; // slate-800
  const grayColor: [number, number, number] = [100, 116, 139]; // slate-500

  // Borda decorativa
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Borda interna
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Cantos decorativos
  doc.setFillColor(...goldColor);
  const cornerSize = 8;
  // Canto superior esquerdo
  doc.circle(15, 15, cornerSize / 2, "F");
  // Canto superior direito
  doc.circle(pageWidth - 15, 15, cornerSize / 2, "F");
  // Canto inferior esquerdo
  doc.circle(15, pageHeight - 15, cornerSize / 2, "F");
  // Canto inferior direito
  doc.circle(pageWidth - 15, pageHeight - 15, cornerSize / 2, "F");

  // Cabeçalho
  let yPos = 35;

  // Logo/Título da plataforma
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("SIMULAB", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Simulados e Certificações", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Título do certificado
  doc.setFontSize(32);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Linha decorativa
  doc.setDrawColor(...goldColor);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 50, yPos);
  yPos += 15;

  // Texto de certificação
  doc.setFontSize(12);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("Certificamos que", pageWidth / 2, yPos, { align: "center" });
  yPos += 12;

  // Nome do aluno
  doc.setFontSize(24);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.aluno.nome.toUpperCase(), pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 12;

  // Texto de conclusão
  doc.setFontSize(12);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(
    "concluiu com aproveitamento satisfatório o simulado",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 12;

  // Nome do simulado
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.titulo, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Categoria
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "italic");
  doc.text(`Categoria: ${data.categoria}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  // Informações de desempenho
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");

  const notaFormatada = data.nota.toFixed(1);
  const acertos = data.tentativa?.totalAcertos ?? 0;
  const total = data.tentativa?.totalQuestoes ?? 0;

  let desempenhoText = `Obtendo nota ${notaFormatada}%`;
  if (total > 0) {
    desempenhoText += ` (${acertos} de ${total} questões corretas)`;
  }
  doc.text(desempenhoText, pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  // Data de emissão
  const dataFormatada = format(new Date(data.dataEmissao), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.text(`Emitido em ${dataFormatada}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 20;

  // Assinaturas
  const assinaturaY = pageHeight - 45;
  const assinaturaWidth = 60;

  // Assinatura do Docente
  doc.setDrawColor(...darkColor);
  doc.setLineWidth(0.3);
  doc.line(
    pageWidth / 2 - 80,
    assinaturaY,
    pageWidth / 2 - 80 + assinaturaWidth,
    assinaturaY
  );
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.text(data.simulado.docente, pageWidth / 2 - 80 + assinaturaWidth / 2, assinaturaY + 5, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Docente Responsável", pageWidth / 2 - 80 + assinaturaWidth / 2, assinaturaY + 9, {
    align: "center",
  });

  // Assinatura da Plataforma
  doc.setDrawColor(...darkColor);
  doc.line(
    pageWidth / 2 + 20,
    assinaturaY,
    pageWidth / 2 + 20 + assinaturaWidth,
    assinaturaY
  );
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text("Simulab", pageWidth / 2 + 20 + assinaturaWidth / 2, assinaturaY + 5, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Plataforma de Certificação", pageWidth / 2 + 20 + assinaturaWidth / 2, assinaturaY + 9, {
    align: "center",
  });

  // Código de validação no rodapé
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Código de Validação: ${data.codigo}`,
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );
  doc.text(
    "Valide este certificado em: simulab.com.br/certificados/validar",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  // Salvar o PDF
  const fileName = `certificado-${data.codigo.toLowerCase()}.pdf`;
  doc.save(fileName);
}

// Função para gerar o PDF como blob (para preview ou upload)
export function gerarCertificadoBlob(data: CertificadoData): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Cores
  const primaryColor: [number, number, number] = [59, 130, 246];
  const goldColor: [number, number, number] = [234, 179, 8];
  const darkColor: [number, number, number] = [30, 41, 59];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Borda decorativa
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Cantos decorativos
  doc.setFillColor(...goldColor);
  const cornerSize = 8;
  doc.circle(15, 15, cornerSize / 2, "F");
  doc.circle(pageWidth - 15, 15, cornerSize / 2, "F");
  doc.circle(15, pageHeight - 15, cornerSize / 2, "F");
  doc.circle(pageWidth - 15, pageHeight - 15, cornerSize / 2, "F");

  let yPos = 35;

  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("SIMULAB", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Simulados e Certificações", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  doc.setFontSize(32);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICADO", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setDrawColor(...goldColor);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 50, yPos, pageWidth / 2 + 50, yPos);
  yPos += 15;

  doc.setFontSize(12);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text("Certificamos que", pageWidth / 2, yPos, { align: "center" });
  yPos += 12;

  doc.setFontSize(24);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.aluno.nome.toUpperCase(), pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 12;

  doc.setFontSize(12);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(
    "concluiu com aproveitamento satisfatório o simulado",
    pageWidth / 2,
    yPos,
    { align: "center" }
  );
  yPos += 12;

  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(data.titulo, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "italic");
  doc.text(`Categoria: ${data.categoria}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 15;

  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");

  const notaFormatada = data.nota.toFixed(1);
  const acertos = data.tentativa?.totalAcertos ?? 0;
  const total = data.tentativa?.totalQuestoes ?? 0;

  let desempenhoText = `Obtendo nota ${notaFormatada}%`;
  if (total > 0) {
    desempenhoText += ` (${acertos} de ${total} questões corretas)`;
  }
  doc.text(desempenhoText, pageWidth / 2, yPos, { align: "center" });
  yPos += 20;

  const dataFormatada = format(new Date(data.dataEmissao), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.text(`Emitido em ${dataFormatada}`, pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += 20;

  const assinaturaY = pageHeight - 45;
  const assinaturaWidth = 60;

  doc.setDrawColor(...darkColor);
  doc.setLineWidth(0.3);
  doc.line(
    pageWidth / 2 - 80,
    assinaturaY,
    pageWidth / 2 - 80 + assinaturaWidth,
    assinaturaY
  );
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.text(data.simulado.docente, pageWidth / 2 - 80 + assinaturaWidth / 2, assinaturaY + 5, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Docente Responsável", pageWidth / 2 - 80 + assinaturaWidth / 2, assinaturaY + 9, {
    align: "center",
  });

  doc.setDrawColor(...darkColor);
  doc.line(
    pageWidth / 2 + 20,
    assinaturaY,
    pageWidth / 2 + 20 + assinaturaWidth,
    assinaturaY
  );
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text("Simulab", pageWidth / 2 + 20 + assinaturaWidth / 2, assinaturaY + 5, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Plataforma de Certificação", pageWidth / 2 + 20 + assinaturaWidth / 2, assinaturaY + 9, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    `Código de Validação: ${data.codigo}`,
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );
  doc.text(
    "Valide este certificado em: simulab.com.br/certificados/validar",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );

  return doc.output("blob");
}
