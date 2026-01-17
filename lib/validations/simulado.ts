import { z } from "zod";

export const simuladoSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .nullable(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  subcategoria: z.string().optional().nullable(),
  imagemUrl: z.string().url("URL inválida").optional().nullable(),
});

export const simuladoUpdateSchema = simuladoSchema.partial();

export const simuladoStatusSchema = z.object({
  status: z.enum(["ATIVO", "INATIVO", "EM_EDICAO"]),
});

export type SimuladoFormData = z.infer<typeof simuladoSchema>;
export type SimuladoUpdateData = z.infer<typeof simuladoUpdateSchema>;
