import "./mensagens";
import { z } from "zod";
export const itemSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(160),
  descricao: z.string().trim().max(2000).optional(),
  categoriaId: z.string().optional(),
  unidadeMedida: z.string().trim().min(1).max(10).default("UN"),
  valorUnitario: z
    .string()
    .regex(
      /^$|^\d{1,10}([.,]\d{1,2})?$/,
      "Informe um valor válido com até duas casas decimais.",
    )
    .optional(),
  altoValor: z.boolean().default(false),
  imagemUrl: z
    .union([z.literal(""), z.string().url().startsWith("https://")])
    .optional(),
  ativo: z.boolean().default(true),
});
export const filtrosSchema = z.object({
  pagina: z.coerce.number().int().min(1).max(100000).default(1),
  categoriaId: z.string().optional(),
  q: z.string().trim().max(100).default(""),
  ordem: z.enum(["nome", "data"]).default("nome"),
});
