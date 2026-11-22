import { prisma } from "@/server/db";
import type { Contexto } from "@/types";
import { exigirPapel } from "@/server/permissoes";
import { ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
export const listarCategorias = (c: Contexto) =>
  prisma.categoria.findMany({
    where: { empresaId: c.empresaId, deletadoEm: null },
    orderBy: { nome: "asc" },
  });
export async function obterCategoria(c: Contexto, id: string) {
  const registro = await prisma.categoria.findFirst({
    where: { id, empresaId: c.empresaId, deletadoEm: null },
  });
  if (!registro) throw new NaoEncontrado();
  return registro;
}
export async function salvarCategoria(
  c: Contexto,
  dados: { nome: string; descricao?: string },
  id?: string,
) {
  exigirPapel(c);
  return prisma.$transaction(async (tx) => {
    // O mesmo bloqueio é usado por itens para serializar associação e exclusão de categoria.
    await tx.$queryRaw`SELECT id FROM "Empresa" WHERE id = ${c.empresaId} FOR UPDATE`;
    if (
      id &&
      !(await tx.categoria.findFirst({
        where: { id, empresaId: c.empresaId, deletadoEm: null },
      }))
    )
      throw new NaoEncontrado();
    const existente = await tx.categoria.findFirst({
      where: { empresaId: c.empresaId, nome: dados.nome },
    });
    if (existente && existente.id !== id && !existente.deletadoEm)
      throw new ConflitoDeDados("Já existe uma categoria com esse nome.");
    if (!id && existente?.deletadoEm)
      return tx.categoria.update({
        where: { id: existente.id, empresaId: c.empresaId },
        data: { ...dados, deletadoEm: null },
      });
    if (id && existente && existente.id !== id)
      throw new ConflitoDeDados(
        "Esse nome pertence a uma categoria excluída. Crie-a novamente para restaurar.",
      );
    return id
      ? tx.categoria.update({
          where: { id, empresaId: c.empresaId },
          data: dados,
        })
      : tx.categoria.create({ data: { ...dados, empresaId: c.empresaId } });
  });
}
export async function excluirCategoria(c: Contexto, id: string) {
  exigirPapel(c);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Empresa" WHERE id = ${c.empresaId} FOR UPDATE`;
    if (
      !(await tx.categoria.findFirst({
        where: { id, empresaId: c.empresaId, deletadoEm: null },
      }))
    )
      throw new NaoEncontrado();
    const quantidade = await tx.item.count({
      where: {
        empresaId: c.empresaId,
        categoriaId: id,
        ativo: true,
        deletadoEm: null,
      },
    });
    if (quantidade)
      throw new ConflitoDeDados(
        `A categoria possui ${quantidade} item(ns) ativo(s). Reclassifique-os antes de excluir.`,
      );
    await tx.item.updateMany({
      where: { empresaId: c.empresaId, categoriaId: id },
      data: { categoriaId: null },
    });
    await tx.categoria.update({
      where: { id, empresaId: c.empresaId },
      data: { deletadoEm: new Date() },
    });
  });
}
