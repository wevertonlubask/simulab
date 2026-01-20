import { createHash } from "crypto";

export interface CertificateData {
  alunoNome: string;
  alunoEmail: string;
  titulo: string;
  categoria: string;
  nota: number;
  notaMinima: number;
  dataEmissao: Date;
  tentativaId: string;
}

// Gerar código único para o certificado
export function generateCertificateCode(data: CertificateData): string {
  const payload = `${data.tentativaId}-${data.alunoEmail}-${data.dataEmissao.toISOString()}`;
  const hash = createHash("sha256").update(payload).digest("hex");
  // Pegar os primeiros 12 caracteres e formatar
  return hash.slice(0, 12).toUpperCase();
}

// Formatar data para exibição
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

// Calcular status de aprovação
export function getApprovalStatus(nota: number, notaMinima: number): {
  aprovado: boolean;
  porcentagem: number;
  label: string;
} {
  const aprovado = nota >= notaMinima;
  return {
    aprovado,
    porcentagem: Math.round(nota),
    label: aprovado ? "APROVADO" : "REPROVADO",
  };
}
