import "./mensagens";
import { z } from "zod";
export const tipoLocalizacaoSchema = z.enum([
  "SECAO",
  "MODULO",
  "PRATELEIRA",
  "POSICAO",
]);
export const localizacaoSchema = z
  .object({
    tipo: tipoLocalizacaoSchema,
    id: z.string().min(1).optional(),
    paiId: z.string().min(1).optional(),
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{1,10}$/, "Use de 1 a 10 letras ou números.")
      .optional(),
    nome: z.string().trim().max(120).default(""),
    descricao: z.string().trim().max(2000).default(""),
  })
  .superRefine((d, ctx) => {
    if (d.tipo === "SECAO" && (!d.nome || (!d.id && !d.codigo)))
      ctx.addIssue({
        code: "custom",
        message: "Informe código e nome da seção.",
      });
    if (!d.id && d.tipo !== "SECAO" && !d.paiId)
      ctx.addIssue({ code: "custom", message: "Informe a localização pai." });
  });
export const alvoSchema = z.object({
  tipo: tipoLocalizacaoSchema,
  id: z.string().min(1),
});
export const loteSchema = z.object({
  moduloId: z.string().min(1),
  prateleiras: z.coerce.number().int().min(1).max(20),
  posicoes: z.coerce.number().int().min(1).max(100),
});
export const alocacaoSchema = z.object({
  itemId: z.string().min(1),
  posicaoId: z.string().min(1),
  observacao: z.string().trim().max(500).default(""),
});
