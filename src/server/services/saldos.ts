import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { NaoEncontrado } from "@/lib/erros";
import type { ContextoUnidade } from "@/types";
import { filtroUnidade } from "./localizacoes";

export async function listarEstoque(
  c: ContextoUnidade,
  filtro: { categoriaId?: string; comSaldo?: boolean; itemId?: string } = {},
) {
  const base = filtroUnidade(c);
  const itens = await prisma.item.findMany({
    where: {
      empresaId: base.empresaId,
      deletadoEm: null,
      id: filtro.itemId,
      categoriaId: filtro.categoriaId,
      ...(filtro.comSaldo && {
        saldos: { some: { ...base, quantidade: { gt: 0 } } },
      }),
    },
    select: {
      id: true,
      nome: true,
      codigoInterno: true,
      unidadeMedida: true,
      posicoes: {
        where: { ...base, posicao: { ...base, deletadoEm: null } },
        select: { posicaoId: true, posicao: { select: { codigo: true } } },
      },
      saldos: {
        where: {
          ...base,
          OR: [{ posicaoId: null }, { posicao: { ...base, deletadoEm: null } }],
        },
        select: {
          quantidade: true,
          posicaoId: true,
          posicao: { select: { codigo: true } },
        },
      },
    },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
  });
  return itens.map(({ saldos, posicoes, ...item }) => {
    const zero = new Prisma.Decimal(0);
    const porPosicao = new Map(saldos.map((saldo) => [saldo.posicaoId, saldo]));
    for (const posicao of posicoes) {
      if (!porPosicao.has(posicao.posicaoId))
        porPosicao.set(posicao.posicaoId, { ...posicao, quantidade: zero });
    }
    const semPosicao = porPosicao.get(null) ?? {
      posicaoId: null,
      posicao: null,
      quantidade: zero,
    };
    porPosicao.delete(null);
    return {
      ...item,
      saldos: [
        semPosicao,
        ...Array.from(porPosicao.values()).sort((a, b) =>
          (a.posicao?.codigo ?? "").localeCompare(
            b.posicao?.codigo ?? "",
            "pt-BR",
          ),
        ),
      ],
      total: saldos.reduce((soma, saldo) => soma.plus(saldo.quantidade), zero),
    };
  });
}

export async function saldosDoItem(c: ContextoUnidade, itemId: string) {
  const [item] = await listarEstoque(c, { itemId });
  if (!item) throw new NaoEncontrado("Item não encontrado.");
  return item;
}

export async function saldoNaPosicao(
  c: ContextoUnidade,
  itemId: string,
  posicaoId: string | null,
) {
  const base = filtroUnidade(c);
  const item = await prisma.item.findFirst({
    where: { id: itemId, empresaId: c.empresaId, deletadoEm: null },
    select: {
      saldos: {
        where: { ...base, posicaoId },
        select: { quantidade: true },
        take: 1,
      },
    },
  });
  if (!item) throw new NaoEncontrado("Item não encontrado.");
  if (
    posicaoId &&
    !(await prisma.posicao.findFirst({
      where: { ...base, id: posicaoId, deletadoEm: null },
      select: { id: true },
    }))
  )
    throw new NaoEncontrado("Posição não encontrada nesta unidade.");
  return item.saldos[0]?.quantidade.toFixed() ?? "0";
}

export async function totaisPorItem(c: ContextoUnidade, ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const saldos = await prisma.saldo.groupBy({
    by: ["itemId"],
    where: { ...filtroUnidade(c), itemId: { in: ids } },
    _sum: { quantidade: true },
  });
  return new Map(
    saldos.map((s) => [s.itemId, s._sum.quantidade?.toFixed() ?? "0"]),
  );
}

type Divergencia = {
  empresaId: string;
  unidadeId: string;
  itemId: string;
  posicaoId: string | null;
  saldo: Prisma.Decimal;
  esperado: Prisma.Decimal;
};

export function _reconciliar(empresaId?: string) {
  // Um único snapshot MVCC cobre tanto o histórico quanto as linhas de saldo.
  return prisma.$queryRaw<Divergencia[]>`
    WITH efeitos AS (
      SELECT m."empresaId", m."unidadeId", m."itemId", m."posicaoOrigemId" AS "posicaoId", -m.quantidade AS q
      FROM "Movimentacao" m LEFT JOIN "Movimentacao" o ON o.id = m."estornoDeId"
      WHERE m.tipo IN ('SAIDA','QUEBRA','AJUSTE_NEGATIVO','TRANSFERENCIA')
         OR (m.tipo = 'ESTORNO' AND o.tipo IN ('ENTRADA','AJUSTE_POSITIVO','TRANSFERENCIA'))
      UNION ALL
      SELECT m."empresaId", m."unidadeId", m."itemId", m."posicaoDestinoId", m.quantidade
      FROM "Movimentacao" m LEFT JOIN "Movimentacao" o ON o.id = m."estornoDeId"
      WHERE m.tipo IN ('ENTRADA','AJUSTE_POSITIVO','TRANSFERENCIA')
         OR (m.tipo = 'ESTORNO' AND o.tipo IN ('SAIDA','QUEBRA','AJUSTE_NEGATIVO','TRANSFERENCIA'))
    ), linhas AS (
      SELECT "empresaId", "unidadeId", "itemId", "posicaoId", q AS esperado, 0::numeric AS saldo FROM efeitos
      UNION ALL
      SELECT "empresaId", "unidadeId", "itemId", "posicaoId", 0, quantidade FROM "Saldo"
    )
    SELECT "empresaId", "unidadeId", "itemId", "posicaoId", sum(saldo) AS saldo, sum(esperado) AS esperado
    FROM linhas
    WHERE ${empresaId === undefined ? Prisma.sql`TRUE` : Prisma.sql`"empresaId" = ${empresaId}`}
    GROUP BY "empresaId", "unidadeId", "itemId", "posicaoId"
    HAVING sum(saldo) <> sum(esperado)
    ORDER BY "empresaId", "unidadeId", "itemId", "posicaoId" NULLS FIRST`;
}
