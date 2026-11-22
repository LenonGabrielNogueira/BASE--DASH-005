import { z } from "zod";

export const motivoQuebraSchema = z.object({
  id: z.string().min(1).optional(),
  nome: z.string().trim().min(1, "Informe o nome do motivo.").max(100),
  descricao: z.string().trim().max(500).optional(),
  ativo: z.boolean(),
});
