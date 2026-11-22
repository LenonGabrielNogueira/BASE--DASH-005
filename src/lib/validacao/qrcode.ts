import "./mensagens";
import { z } from "zod";
import { alvoSchema } from "./localizacao";
export const tokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{22}$/, "QR Code não encontrado.");
export const operacaoQrSchema = alvoSchema.extend({
  operacao: z.enum(["gerar", "regenerar", "deletar"]),
});
export const etiquetasSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "Selecione ao menos um QR.")
    .max(200, "Selecione no máximo 200 etiquetas."),
  formato: z.enum(["A4", "TERMICA"]),
});
