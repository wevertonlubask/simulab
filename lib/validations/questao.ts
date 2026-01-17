import { z } from "zod";

export const alternativaSchema = z.object({
  id: z.string().optional(),
  texto: z
    .string()
    .min(1, "Texto da alternativa é obrigatório")
    .max(500, "Texto deve ter no máximo 500 caracteres"),
  imagemUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  correta: z.boolean().default(false),
  ordem: z.number().int().min(0).default(0),
});

export const questaoSchema = z.object({
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
    .min(2, "Mínimo 2 alternativas")
    .max(6, "Máximo 6 alternativas"),
});

export const questaoUpdateSchema = questaoSchema.partial();

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
