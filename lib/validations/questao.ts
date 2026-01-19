import { z } from "zod";

export const alternativaSchema = z.object({
  id: z.string().optional(),
  texto: z
    .string()
    .max(500, "Texto deve ter no máximo 500 caracteres")
    .default(""),
  imagemUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  correta: z.boolean().default(false),
  ordem: z.number().int().min(0).default(0),
});

// Schema para item de Drag and Drop
export const dragDropItemSchema = z.object({
  id: z.string(),
  texto: z.string().min(1, "Texto do item é obrigatório"),
  imagemUrl: z.string().nullable().optional(),
});

// Schema para zona de Drag and Drop
export const dragDropZonaSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label da zona é obrigatório"),
  imagemUrl: z.string().nullable().optional(),
  aceitaMultiplos: z.boolean().default(false),
  itensCorretos: z.array(z.string()).default([]),
});

// Schema de configuração para Drag and Drop
export const dragDropConfigSchema = z.object({
  itens: z.array(dragDropItemSchema).min(2, "Mínimo 2 itens"),
  zonas: z.array(dragDropZonaSchema).min(1, "Mínimo 1 zona"),
  pontuacaoParcial: z.boolean().default(true),
  layoutZonas: z.enum(["horizontal", "vertical", "grid"]).default("horizontal"),
});

// Schema para Associação
export const associacaoItemSchema = z.object({
  id: z.string(),
  texto: z.string().min(1, "Texto do item é obrigatório"),
  imagemUrl: z.string().nullable().optional(),
});

export const associacaoConexaoSchema = z.object({
  de: z.string(),
  para: z.string(),
});

export const associacaoConfigSchema = z.object({
  colunaA: z.array(associacaoItemSchema).min(2, "Mínimo 2 itens na coluna A"),
  colunaB: z.array(associacaoItemSchema).min(2, "Mínimo 2 itens na coluna B"),
  conexoesCorretas: z.array(associacaoConexaoSchema).min(1, "Defina pelo menos 1 conexão correta"),
  pontuacaoParcial: z.boolean().default(true),
  permitirMultiplasConexoes: z.boolean().default(false),
});

// Schema para Ordenação
export const ordenacaoItemSchema = z.object({
  id: z.string(),
  texto: z.string().min(1, "Texto do item é obrigatório"),
  ordemCorreta: z.number().int().min(1),
});

export const ordenacaoConfigSchema = z.object({
  instrucao: z.string().optional(),
  itens: z.array(ordenacaoItemSchema).min(2, "Mínimo 2 itens"),
  pontuacaoParcial: z.boolean().default(true),
});

// Schema para Lacuna
export const lacunaItemSchema = z.object({
  id: z.string(),
  respostasAceitas: z.array(z.string()).min(1, "Pelo menos 1 resposta aceita"),
  dica: z.string().nullable().optional(),
});

export const lacunaConfigSchema = z.object({
  texto: z.string().min(10, "Texto com lacunas é obrigatório"),
  lacunas: z.array(lacunaItemSchema).min(1, "Pelo menos 1 lacuna"),
  opcoes: z.array(z.string()).default([]),
  caseSensitive: z.boolean().default(false),
  pontuacaoParcial: z.boolean().default(true),
});

// Schema para Hotspot
export const hotspotAreaSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  largura: z.number().positive(),
  altura: z.number().positive(),
  correta: z.boolean().default(false),
  label: z.string().optional(),
});

export const hotspotConfigSchema = z.object({
  imagemUrl: z.string().min(1, "Imagem é obrigatória"),
  instrucao: z.string().optional(),
  areas: z.array(hotspotAreaSchema).min(1, "Pelo menos 1 área"),
  multiplosCliques: z.boolean().default(false),
});

// Schema para Comando
export const comandoConfigSchema = z.object({
  prompt: z.string().default("$"),
  contexto: z.string().min(10, "Contexto é obrigatório"),
  respostasAceitas: z.array(z.string()).min(1, "Pelo menos 1 resposta aceita"),
  caseSensitive: z.boolean().default(true),
  ignorarEspacosExtras: z.boolean().default(true),
  feedback: z.record(z.string()).optional(),
});

// Schema unificado de configuração
export const questaoConfigSchema = z.union([
  dragDropConfigSchema,
  associacaoConfigSchema,
  ordenacaoConfigSchema,
  lacunaConfigSchema,
  hotspotConfigSchema,
  comandoConfigSchema,
]).nullable().optional();

// Schema base para questões (sem validação condicional de alternativas)
const questaoBaseSchema = z.object({
  tipo: z.enum([
    "MULTIPLA_ESCOLHA_UNICA",
    "MULTIPLA_ESCOLHA_MULTIPLA",
    "DRAG_DROP",
    "ASSOCIACAO",
    "ORDENACAO",
    "LACUNA",
    "HOTSPOT",
    "COMANDO",
  ]),
  enunciado: z
    .string()
    .min(10, "Enunciado deve ter no mínimo 10 caracteres")
    .max(5000, "Enunciado deve ter no máximo 5000 caracteres"),
  imagemUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  explicacao: z
    .string()
    .max(5000, "Explicação deve ter no máximo 5000 caracteres")
    .optional()
    .nullable(),
  dificuldade: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
  peso: z
    .number()
    .min(0.5, "Peso mínimo é 0.5")
    .max(5.0, "Peso máximo é 5.0")
    .default(1.0),
  tags: z
    .array(z.string())
    .max(10, "Máximo 10 tags")
    .default([]),
  alternativas: z
    .array(alternativaSchema)
    .max(6, "Máximo 6 alternativas")
    .optional()
    .default([]),
  configuracao: questaoConfigSchema,
});

// Schema com validação condicional: alternativas obrigatórias apenas para múltipla escolha
export const questaoSchema = questaoBaseSchema.superRefine((data, ctx) => {
  const tiposMultiplaEscolha = ["MULTIPLA_ESCOLHA_UNICA", "MULTIPLA_ESCOLHA_MULTIPLA"];

  if (tiposMultiplaEscolha.includes(data.tipo)) {
    // Para múltipla escolha, exigir alternativas válidas
    if (!data.alternativas || data.alternativas.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mínimo 2 alternativas para questão de múltipla escolha",
        path: ["alternativas"],
      });
      return;
    }

    // Verificar se todas as alternativas têm texto
    for (let i = 0; i < data.alternativas.length; i++) {
      if (!data.alternativas[i].texto || data.alternativas[i].texto.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Texto da alternativa ${i + 1} é obrigatório`,
          path: ["alternativas", i, "texto"],
        });
      }
    }
  }
  // Para outros tipos, alternativas não são necessárias (validação ignorada)
});

export const questaoUpdateSchema = questaoBaseSchema.partial();

export const reordenarSchema = z.object({
  ordem: z.number().int().min(0),
});

export const importarQuestoesSchema = z.object({
  questoes: z.array(
    z.object({
      enunciado: z.string().min(10),
      tipo: z.enum([
        "MULTIPLA_ESCOLHA_UNICA",
        "MULTIPLA_ESCOLHA_MULTIPLA",
      ]).default("MULTIPLA_ESCOLHA_UNICA"),
      dificuldade: z.enum(["FACIL", "MEDIO", "DIFICIL"]),
      tags: z.array(z.string()).optional().default([]),
      explicacao: z.string().optional().nullable(),
      alternativas: z
        .array(
          z.object({
            texto: z.string().min(1),
            correta: z.boolean(),
          })
        )
        .min(2)
        .max(6),
    })
  ),
});

export type QuestaoFormData = z.infer<typeof questaoSchema>;
export type AlternativaFormData = z.infer<typeof alternativaSchema>;
export type ImportarQuestoesData = z.infer<typeof importarQuestoesSchema>;

// Tipos para questões avançadas
export type DragDropItem = z.infer<typeof dragDropItemSchema>;
export type DragDropZona = z.infer<typeof dragDropZonaSchema>;
export type DragDropConfig = z.infer<typeof dragDropConfigSchema>;

export type AssociacaoItem = z.infer<typeof associacaoItemSchema>;
export type AssociacaoConexao = z.infer<typeof associacaoConexaoSchema>;
export type AssociacaoConfig = z.infer<typeof associacaoConfigSchema>;

export type OrdenacaoItem = z.infer<typeof ordenacaoItemSchema>;
export type OrdenacaoConfig = z.infer<typeof ordenacaoConfigSchema>;

export type LacunaItem = z.infer<typeof lacunaItemSchema>;
export type LacunaConfig = z.infer<typeof lacunaConfigSchema>;

export type HotspotArea = z.infer<typeof hotspotAreaSchema>;
export type HotspotConfig = z.infer<typeof hotspotConfigSchema>;

export type ComandoConfig = z.infer<typeof comandoConfigSchema>;

export type QuestaoConfig = z.infer<typeof questaoConfigSchema>;

// Validation helper for multiple choice questions
export function validateMultiplaEscolha(
  tipo: string,
  alternativas: AlternativaFormData[]
): string | null {
  const corretas = alternativas.filter((a) => a.correta);

  if (tipo === "MULTIPLA_ESCOLHA_UNICA") {
    if (corretas.length !== 1) {
      return "Questão de múltipla escolha única deve ter exatamente 1 alternativa correta";
    }
  } else if (tipo === "MULTIPLA_ESCOLHA_MULTIPLA") {
    if (corretas.length < 1) {
      return "Questão de múltipla escolha múltipla deve ter pelo menos 1 alternativa correta";
    }
  }

  return null;
}
