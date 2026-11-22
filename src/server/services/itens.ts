import { prisma } from "@/server/db";
import type { Contexto } from "@/types";
import type { z } from "zod";
import type { filtrosSchema, itemSchema } from "@/lib/validacao/item";
import { exigirPapel } from "@/server/permissoes";
import { ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
import { gerarCodigoInterno } from "@/lib/codigo-interno";
export async function listarItens(
  c: Contexto,
  filtro: z.infer<typeof filtrosSchema>,
) {
  const where = {
    empresaId: c.empresaId,
    deletadoEm: null,
    ...(filtro.categoriaId ? { categoriaId: filtro.categoriaId } : {}),
    ...(filtro.q
      ? { nome: { contains: filtro.q, mode: "insensitive" as const } }
      : {}),
  };
  const [itens, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      include: {
        categoria: { where: { empresaId: c.empresaId, deletadoEm: null } },
      },
      orderBy:
        filtro.ordem === "data"
          ? [{ criadoEm: "desc" }, { id: "asc" }]
          : [{ nome: "asc" }, { id: "asc" }],
      skip: (filtro.pagina - 1) * 20,
      take: 20,
    }),
    prisma.item.count({ where }),
  ]);
  return { itens, total };
}
export async function obterItem(c: Contexto, id: string) {
  const item = await prisma.item.findFirst({
    where: { id, empresaId: c.empresaId, deletadoEm: null },
    include: {
      categoria: { where: { empresaId: c.empresaId, deletadoEm: null } },
      codigosBarras: {
        where: { empresaId: c.empresaId },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!item) throw new NaoEncontrado();
  return item;
}
export async function salvarItem(
  c: Contexto,
  dados: z.infer<typeof itemSchema>,
  id?: string,
) {
  exigirPapel(c);
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Empresa" WHERE id = ${c.empresaId} FOR UPDATE`;
      if (
        id &&
        !(await tx.item.findFirst({
          where: { id, empresaId: c.empresaId, deletadoEm: null },
        }))
      )
        throw new NaoEncontrado();
      if (
        dados.categoriaId &&
        !(await tx.categoria.findFirst({
          where: {
            id: dados.categoriaId,
            empresaId: c.empresaId,
            deletadoEm: null,
          },
        }))
      )
        throw new NaoEncontrado("Categoria não encontrada.");
      const data = {
        nome: dados.nome,
        descricao: dados.descricao,
        unidadeMedida: dados.unidadeMedida,
        altoValor: dados.altoValor,
        ativo: dados.ativo,
        categoriaId: dados.categoriaId || null,
        imagemUrl: dados.imagemUrl || null,
        valorUnitario: dados.valorUnitario
          ? dados.valorUnitario.replace(",", ".")
          : null,
      };
      return id
        ? tx.item.update({ where: { id, empresaId: c.empresaId }, data })
        : tx.item.create({
            data: {
              ...data,
              empresaId: c.empresaId,
              codigoInterno: await gerarCodigoInterno(tx, c.empresaId),
            },
          });
    },
    { maxWait: 60000, timeout: 15000 },
  );
}
export async function excluirItem(c: Contexto, id: string) {
  exigirPapel(c);
  return prisma.$transaction(async (tx) => {
    const bloqueado = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Item" WHERE id = ${id} AND "empresaId" = ${c.empresaId}
        AND "deletadoEm" IS NULL FOR NO KEY UPDATE`;
    if (!bloqueado.length) throw new NaoEncontrado();
    const saldo = await tx.saldo.findFirst({
      where: { empresaId: c.empresaId, itemId: id, quantidade: { gt: 0 } },
      select: {
        unidade: { select: { nome: true } },
        posicao: { select: { codigo: true } },
        quantidade: true,
      },
      orderBy: [{ unidadeId: "asc" }, { posicaoId: "asc" }],
    });
    if (saldo)
      throw new ConflitoDeDados(
        `O item tem saldo de ${saldo.quantidade.toFixed()} em ${saldo.unidade.nome} · ${saldo.posicao?.codigo ?? "Sem posição"}.`,
      );
    const r = await tx.item.updateMany({
      where: { id, empresaId: c.empresaId, deletadoEm: null },
      data: { deletadoEm: new Date(), ativo: false },
    });
    if (!r.count) throw new NaoEncontrado();
    await tx.itemPosicao.deleteMany({
      where: { empresaId: c.empresaId, itemId: id },
    });
  });
}
