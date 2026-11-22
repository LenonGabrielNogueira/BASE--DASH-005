"use server";
import { z } from "zod";
import { executarAcao } from "@/server/acoes";
import { categoriaSchema } from "@/lib/validacao/categoria";
import {
  salvarCategoria,
  excluirCategoria,
} from "@/server/services/categorias";
const schema = categoriaSchema.extend({ id: z.string().min(1).optional() });
export async function salvar(entrada: unknown) {
  return executarAcao(schema, entrada, (c, { id, ...d }) =>
    salvarCategoria(c, d, id),
  );
}
export async function excluir(id: string) {
  return executarAcao(z.string().min(1), id, excluirCategoria);
}
