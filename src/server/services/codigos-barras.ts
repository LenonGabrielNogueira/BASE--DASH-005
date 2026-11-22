import { prisma } from "@/server/db";
import type { Contexto } from "@/types";
import type { z } from "zod";
import { codigoBarrasSchema } from "@/lib/validacao/codigo-barras";
import { exigirPapel } from "@/server/permissoes";
import { NaoEncontrado } from "@/lib/erros";
export async function salvarCodigoBarras(
  c: Contexto,
  itemId: string,
  entrada: z.infer<typeof codigoBarrasSchema>,
  id?: string,
) {
  exigirPapel(c);
  const dados = codigoBarrasSchema.parse(entrada);
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findFirst({
      where: { id: itemId, empresaId: c.empresaId, deletadoEm: null },
    });
    if (!item) throw new NaoEncontrado();
    if (!id)
      return tx.codigoBarras.create({
        data: { ...dados, itemId, empresaId: c.empresaId },
      });
    const r = await tx.codigoBarras.updateMany({
      where: {
        id,
        itemId,
        empresaId: c.empresaId,
        item: { deletadoEm: null, empresaId: c.empresaId },
      },
      data: dados,
    });
    if (!r.count) throw new NaoEncontrado();
  });
}
export async function excluirCodigoBarras(c: Contexto, id: string) {
  exigirPapel(c);
  const r = await prisma.codigoBarras.deleteMany({
    where: {
      id,
      empresaId: c.empresaId,
      item: { empresaId: c.empresaId, deletadoEm: null },
    },
  });
  if (!r.count) throw new NaoEncontrado();
}
