"use server";
import { z } from "zod";
import { executarAcao } from "@/server/acoes";
import { itemSchema } from "@/lib/validacao/item";
import { codigoBarrasSchema } from "@/lib/validacao/codigo-barras";
import { salvarItem, excluirItem } from "@/server/services/itens";
import {
  salvarCodigoBarras,
  excluirCodigoBarras,
} from "@/server/services/codigos-barras";
export async function salvar(entrada: unknown) {
  return executarAcao(
    itemSchema.extend({ id: z.string().min(1).optional() }),
    entrada,
    (c, { id, ...d }) => salvarItem(c, d, id),
  );
}
export async function excluir(id: string) {
  return executarAcao(z.string().min(1), id, excluirItem);
}
export async function salvarCodigo(entrada: unknown) {
  return executarAcao(
    z.object({
      itemId: z.string().min(1),
      id: z.string().min(1).optional(),
      dados: codigoBarrasSchema,
    }),
    entrada,
    (c, d) => salvarCodigoBarras(c, d.itemId, d.dados, d.id),
  );
}
export async function excluirCodigo(id: string) {
  return executarAcao(z.string().min(1), id, excluirCodigoBarras);
}
