import "./mensagens";
import { z } from "zod";
export const categoriaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(100),
  descricao: z.string().trim().max(1000).optional(),
});
