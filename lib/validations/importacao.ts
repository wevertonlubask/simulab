import { z } from "zod";

// Tipos de questão suportados
export const TipoQuestaoEnum = z.enum([
  "MULTIPLA_ESCOLHA_UNICA",
  "MULTIPLA_ESCOLHA_MULTIPLA",
  "DRAG_DROP",
  "ASSOCIACAO",
  "ORDENACAO",
  "LACUNA",
  "COMANDO",
]);

export const DificuldadeEnum = z.enum(["FACIL", "MEDIO", "DIFICIL"]);

// Schema para alternativa
export const AlternativaImportSchema = z.object({
  texto: z.string().min(1, "Texto da alternativa é obrigatório"),
  correta: z.boolean().default(false),
  imagemUrl: z.string().url().optional(),
});

// Schema para configuração de Drag & Drop
export const DragDropConfigSchema = z.object({
  itens: z.array(z.object({
    id: z.string(),
    texto: z.string().min(1),
    imagemUrl: z.string().url().optional(),
  })).min(1, "Pelo menos 1 item é necessário"),
  zonas: z.array(z.object({
    id: z.string(),
    label: z.string().min(1),
    itensCorretos: z.array(z.string()).min(1),
  })).min(1, "Pelo menos 1 zona é necessária"),
});

// Schema para configuração de Associação
export const AssociacaoConfigSchema = z.object({
  colunaA: z.array(z.object({
    id: z.string(),
    texto: z.string().min(1),
  })).min(2, "Pelo menos 2 itens na coluna A"),
  colunaB: z.array(z.object({
    id: z.string(),
    texto: z.string().min(1),
  })).min(2, "Pelo menos 2 itens na coluna B"),
  conexoesCorretas: z.array(z.object({
    de: z.string(),
    para: z.string(),
  })).min(1, "Pelo menos 1 conexão correta"),
});

// Schema para configuração de Ordenação
export const OrdenacaoConfigSchema = z.object({
  itens: z.array(z.object({
    id: z.string(),
    texto: z.string().min(1),
    ordemCorreta: z.number().int().positive(),
  })).min(2, "Pelo menos 2 itens para ordenar"),
});

// Schema para configuração de Lacuna
export const LacunaConfigSchema = z.object({
  texto: z.string().min(1, "Texto com lacunas é obrigatório"),
  lacunas: z.array(z.object({
    id: z.string(),
    respostasAceitas: z.array(z.string()).min(1, "Pelo menos 1 resposta aceita"),
  })).min(1, "Pelo menos 1 lacuna"),
});

// Schema para configuração de Comando
export const ComandoConfigSchema = z.object({
  prompt: z.string().optional(),
  contexto: z.string().optional(),
  respostasAceitas: z.array(z.string()).min(1, "Pelo menos 1 comando aceito"),
  caseSensitive: z.boolean().optional().default(false),
  ignorarEspacosExtras: z.boolean().optional().default(true),
});

// Schema base para questão importada
export const QuestaoImportBaseSchema = z.object({
  tipo: TipoQuestaoEnum,
  enunciado: z.string().min(1, "Enunciado é obrigatório"),
  dificuldade: DificuldadeEnum,
  tags: z.array(z.string()).optional().default([]),
  explicacao: z.string().optional(),
  imagemUrl: z.string().url().optional(),
});

// Schema base para questão de múltipla escolha (sem refine para poder usar extend)
const QuestaoMultiplaEscolhaBaseSchema = QuestaoImportBaseSchema.extend({
  alternativas: z.array(AlternativaImportSchema)
    .min(2, "Pelo menos 2 alternativas são necessárias")
    .max(6, "Máximo de 6 alternativas"),
});

// Schema para questão de múltipla escolha única
export const QuestaoMultiplaEscolhaUnicaSchema = QuestaoMultiplaEscolhaBaseSchema.extend({
  tipo: z.literal("MULTIPLA_ESCOLHA_UNICA"),
}).refine(
  (data) => data.alternativas.filter((a) => a.correta).length === 1,
  { message: "Questão de escolha única deve ter exatamente 1 alternativa correta", path: ["alternativas"] }
);

// Schema para questão de múltipla escolha múltipla
export const QuestaoMultiplaEscolhaMultiplaSchema = QuestaoMultiplaEscolhaBaseSchema.extend({
  tipo: z.literal("MULTIPLA_ESCOLHA_MULTIPLA"),
}).refine(
  (data) => data.alternativas.filter((a) => a.correta).length >= 1,
  { message: "Questão de múltipla escolha deve ter pelo menos 1 alternativa correta", path: ["alternativas"] }
);

// Schema combinado para compatibilidade
export const QuestaoMultiplaEscolhaSchema = z.union([
  QuestaoMultiplaEscolhaUnicaSchema,
  QuestaoMultiplaEscolhaMultiplaSchema,
]);

// Schema para questão Drag & Drop
export const QuestaoDragDropSchema = QuestaoImportBaseSchema.extend({
  tipo: z.literal("DRAG_DROP"),
  configuracao: DragDropConfigSchema,
});

// Schema para questão de Associação
export const QuestaoAssociacaoSchema = QuestaoImportBaseSchema.extend({
  tipo: z.literal("ASSOCIACAO"),
  configuracao: AssociacaoConfigSchema,
});

// Schema para questão de Ordenação
export const QuestaoOrdenacaoSchema = QuestaoImportBaseSchema.extend({
  tipo: z.literal("ORDENACAO"),
  configuracao: OrdenacaoConfigSchema,
});

// Schema para questão de Lacuna
export const QuestaoLacunaSchema = QuestaoImportBaseSchema.extend({
  tipo: z.literal("LACUNA"),
  configuracao: LacunaConfigSchema,
});

// Schema para questão de Comando
export const QuestaoComandoSchema = QuestaoImportBaseSchema.extend({
  tipo: z.literal("COMANDO"),
  configuracao: ComandoConfigSchema,
});

// Schemas para discriminatedUnion (sem refine)
const QuestaoMultiplaEscolhaUnicaSchemaBase = QuestaoMultiplaEscolhaBaseSchema.extend({
  tipo: z.literal("MULTIPLA_ESCOLHA_UNICA"),
});

const QuestaoMultiplaEscolhaMultiplaSchemaBase = QuestaoMultiplaEscolhaBaseSchema.extend({
  tipo: z.literal("MULTIPLA_ESCOLHA_MULTIPLA"),
});

// Schema unificado para qualquer tipo de questão
export const QuestaoImportSchema = z.discriminatedUnion("tipo", [
  QuestaoMultiplaEscolhaUnicaSchemaBase,
  QuestaoMultiplaEscolhaMultiplaSchemaBase,
  QuestaoDragDropSchema,
  QuestaoAssociacaoSchema,
  QuestaoOrdenacaoSchema,
  QuestaoLacunaSchema,
  QuestaoComandoSchema,
]);

// Schema para o arquivo de importação completo
export const ImportacaoFileSchema = z.object({
  questoes: z.array(QuestaoImportSchema).min(1, "O arquivo deve conter pelo menos 1 questão"),
});

// Tipos
export type QuestaoImport = z.infer<typeof QuestaoImportSchema>;
export type ImportacaoFile = z.infer<typeof ImportacaoFileSchema>;

// Status de validação
export type ValidationStatus = "ok" | "warning" | "error";

export interface QuestaoValidada {
  index: number;
  questao: Partial<QuestaoImport>;
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

// Função para validar uma questão
export function validarQuestao(questao: unknown, index: number): QuestaoValidada {
  const result: QuestaoValidada = {
    index,
    questao: questao as Partial<QuestaoImport>,
    status: "ok",
    errors: [],
    warnings: [],
  };

  try {
    // Tentar validar com o schema
    const parsed = QuestaoImportSchema.safeParse(questao);

    if (!parsed.success) {
      result.status = "error";
      result.errors = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    } else {
      result.questao = parsed.data;

      // Verificações adicionais (warnings)
      if (!parsed.data.explicacao) {
        result.warnings.push("Sem explicação - recomendado adicionar");
        if (result.status === "ok") result.status = "warning";
      }

      if (parsed.data.tags.length === 0) {
        result.warnings.push("Sem tags - recomendado adicionar para facilitar buscas");
        if (result.status === "ok") result.status = "warning";
      }

      if (parsed.data.enunciado.length < 20) {
        result.warnings.push("Enunciado muito curto");
        if (result.status === "ok") result.status = "warning";
      }
    }
  } catch (error) {
    result.status = "error";
    result.errors.push("Erro ao processar questão: formato inválido");
  }

  return result;
}

// Função para validar array de questões
export function validarQuestoes(questoes: unknown[]): QuestaoValidada[] {
  return questoes.map((q, i) => validarQuestao(q, i));
}
