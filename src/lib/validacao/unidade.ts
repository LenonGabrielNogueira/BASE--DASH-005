import "./mensagens";
import { z } from "zod";
export const cadastroSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(100),
  cnpj: z
    .string()
    .trim()
    .regex(/^$|^\d{14}$/, "Informe 14 números para o CNPJ.")
    .optional(),
  ativa: z.boolean().default(true),
});
