import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { ContextoUnidade } from "@/types";
import { exigirPapel } from "@/server/permissoes";
import { ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
import { alocacaoSchema } from "@/lib/validacao/localizacao";
import type { z } from "zod";
import {
  obterLocalizacao,
  bloquearUnidade,
  filtroUnidade,
  type Tipo,
} from "./localizacoes";
export async function alocarItem(
  c: ContextoUnidade,
  entrada: z.input<typeof alocacaoSchema>,
) {
  exigirPapel(c);
  const d = alocacaoSchema.parse(entrada);
  return prisma.$transaction(async (tx) => {
    await bloquearUnidade(tx, c);
    await obterLocalizacao(c, "POSICAO", d.posicaoId, tx);
    const itens = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Item" WHERE id = ${d.itemId} AND "empresaId" = ${c.empresaId} AND "deletadoEm" IS NULL FOR UPDATE`;
    if (!itens.length) throw new NaoEncontrado("Item não encontrado.");
    const existente = await tx.itemPosicao.findFirst({
      where: { ...filtroUnidade(c), itemId: d.itemId, posicaoId: d.posicaoId },
    });
    if (existente)
      return tx.itemPosicao.update({
        where: { id: existente.id, ...filtroUnidade(c) },
        data: { observacao: d.observacao },
      });
    return tx.itemPosicao.create({ data: { ...d, ...filtroUnidade(c) } });
  });
}
export async function removerAlocacao(c: ContextoUnidade, id: string) {
  exigirPapel(c);
  await prisma.$transaction(async (tx) => {
    await bloquearUnidade(tx, c);
    const base = filtroUnidade(c);
    const alocacao = await tx.itemPosicao.findFirst({ where: { id, ...base } });
    if (!alocacao) throw new NaoEncontrado();
    const saldo = await tx.saldo.findFirst({
      where: {
        ...base,
        itemId: alocacao.itemId,
        posicaoId: alocacao.posicaoId,
        quantidade: { gt: 0 },
      },
    });
    if (saldo)
      throw new ConflitoDeDados(
        "Transfira ou retire o saldo desta posição antes de remover a alocação.",
      );
    const resultado = await tx.itemPosicao.deleteMany({
      where: { id, ...base },
    });
    if (!resultado.count) throw new NaoEncontrado();
  });
}
const select = {
  id: true,
  observacao: true,
  item: {
    select: { id: true, nome: true, codigoInterno: true, unidadeMedida: true },
  },
  posicao: { select: { id: true, codigo: true } },
};
export async function listarAlocacoesItem(c: ContextoUnidade, itemId: string) {
  if (
    !(await prisma.item.findFirst({
      where: { id: itemId, empresaId: c.empresaId, deletadoEm: null },
      select: { id: true },
    }))
  )
    throw new NaoEncontrado();
  return prisma.itemPosicao.findMany({
    where: {
      ...filtroUnidade(c),
      itemId,
      item: { empresaId: c.empresaId, deletadoEm: null },
      posicao: { ...filtroUnidade(c), deletadoEm: null },
    },
    select,
    orderBy: { posicao: { codigo: "asc" } },
  });
}
export async function conteudoLocalizacao(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
) {
  await obterLocalizacao(c, tipo, id);
  const base = { ...filtroUnidade(c), deletadoEm: null };
  const posicao: Prisma.PosicaoWhereInput = {
    ...base,
    ...(tipo === "POSICAO"
      ? { id }
      : tipo === "PRATELEIRA"
        ? { prateleiraId: id }
        : {
            prateleira: {
              ...base,
              ...(tipo === "MODULO"
                ? { moduloId: id }
                : { modulo: { ...base, secaoId: id } }),
            },
          }),
  };
  const alocacoes = await prisma.itemPosicao.findMany({
    where: {
      ...filtroUnidade(c),
      posicao,
      item: { empresaId: c.empresaId, deletadoEm: null },
    },
    select,
    orderBy: [{ item: { nome: "asc" } }, { posicao: { codigo: "asc" } }],
  });
  const saldoPorPar = new Map<string, string>();
  if (alocacoes.length) {
    const saldos = await prisma.saldo.findMany({
      where: {
        ...filtroUnidade(c),
        posicaoId: { in: [...new Set(alocacoes.map((a) => a.posicao.id))] },
      },
      select: { itemId: true, posicaoId: true, quantidade: true },
    });
    for (const s of saldos)
      saldoPorPar.set(`${s.itemId}/${s.posicaoId}`, s.quantidade.toFixed());
  }
  const grupos = new Map<
    string,
    {
      item: {
        id: string;
        nome: string;
        codigoInterno: string;
        unidadeMedida: string;
      };
      posicoes: {
        id: string;
        codigo: string;
        alocacaoId: string;
        quantidade: string;
        observacao: string | null;
      }[];
    }
  >();
  for (const a of alocacoes) {
    const grupo = grupos.get(a.item.id) ?? { item: a.item, posicoes: [] };
    grupo.posicoes.push({
      ...a.posicao,
      alocacaoId: a.id,
      quantidade: saldoPorPar.get(`${a.item.id}/${a.posicao.id}`) ?? "0",
      observacao: a.observacao,
    });
    grupos.set(a.item.id, grupo);
  }
  return [...grupos.values()];
}
export async function opcoesAlocacao(c: ContextoUnidade) {
  const [itens, posicoes] = await Promise.all([
    prisma.item.findMany({
      where: { empresaId: c.empresaId, deletadoEm: null },
      select: { id: true, nome: true, codigoInterno: true },
      orderBy: { nome: "asc" },
    }),
    prisma.posicao.findMany({
      where: { ...filtroUnidade(c), deletadoEm: null },
      select: { id: true, codigo: true },
      orderBy: { codigo: "asc" },
    }),
  ]);
  return { itens, posicoes };
}
