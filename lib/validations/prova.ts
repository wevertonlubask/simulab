import { z } from "zod";

export const gerarProvasSchema = z.object({
  qtdQuestoesPorProva: z
    .number()
    .int()
    .min(10, "Mínimo 10 questões por prova")
    .max(200, "Máximo 200 questões por prova"),
  filtros: z
    .object({
      dificuldades: z.array(z.enum(["FACIL", "MEDIO", "DIFICIL"])).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  percentuais: z
    .object({
      FACIL: z.number().min(0).max(100),
      MEDIO: z.number().min(0).max(100),
      DIFICIL: z.number().min(0).max(100),
    })
    .refine(
      (p) => p.FACIL + p.MEDIO + p.DIFICIL === 100,
      "Percentuais devem somar 100%"
    )
    .optional(),
  nomeBase: z.string().min(1, "Nome base é obrigatório").optional(),
});

export const provaConfigSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().max(1000).optional().nullable(),
  tempoLimite: z.number().int().min(1).max(480).optional().nullable(),
  tentativasMax: z.number().int().min(1).max(100).optional().nullable(), // null = ilimitado
  intervaloTentativas: z.number().int().min(0).max(168).default(0),
  notaMinima: z.number().min(0).max(100).default(70),
  notaConsiderada: z.enum(["MAIOR", "ULTIMA"]).default("MAIOR"),
  mostrarResultado: z.enum(["IMEDIATO", "DATA", "NUNCA"]).default("IMEDIATO"),
  dataResultado: z.coerce.date().optional().nullable(),
  embaralharQuestoes: z.boolean().default(true),
  embaralharAlternativas: z.boolean().default(true),
});

export const provaStatusSchema = z.object({
  status: z.enum(["RASCUNHO", "PUBLICADA", "ENCERRADA"]),
});

export type GerarProvasData = z.infer<typeof gerarProvasSchema>;
export type ProvaConfigData = z.infer<typeof provaConfigSchema>;
