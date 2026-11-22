import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { AppError, ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
import { ladosMovimentacao, requerGestao } from "@/lib/movimentacao-regras";
import { validarQuantidade } from "@/lib/quantidade";
import {
  movimentacaoSchema,
  type EntradaMovimentacao,
} from "@/lib/validacao/movimentacao";
import { prisma } from "@/server/db";
import { exigirPapel } from "@/server/permissoes";
import type { ContextoUnidade } from "@/types";
import { filtroUnidade } from "./localizacoes";
import { validarFotosAvaria } from "./imagekit";

type Tx = Prisma.TransactionClient;
type Balde = {
  posicaoId: string | null;
  codigo: string;
  lado: "origem" | "destino";
};
type ChaveSaldo = ReturnType<typeof filtroUnidade> & { itemId: string };

async function alterarSaldo(
  tx: Tx,
  chave: ChaveSaldo,
  balde: Balde,
  q: Prisma.Decimal,
  estorno: boolean,
) {
  const { empresaId, unidadeId, itemId } = chave;
  const { posicaoId } = balde;
  if (balde.lado === "origem") {
    const filtroPosicao =
      posicaoId === null
        ? Prisma.sql`"posicaoId" IS NULL`
        : Prisma.sql`"posicaoId" = ${posicaoId}`;
    const [linha] = await tx.$queryRaw<{ quantidade: Prisma.Decimal }[]>`
      UPDATE "Saldo" SET quantidade = quantidade - ${q}, "atualizadoEm" = clock_timestamp()
      WHERE "empresaId" = ${empresaId} AND "unidadeId" = ${unidadeId} AND "itemId" = ${itemId}
        AND ${filtroPosicao} AND quantidade >= ${q}
      RETURNING quantidade`;
    if (!linha) {
      const atual =
        (await tx.saldo.findFirst({ where: { ...chave, posicaoId } }))
          ?.quantidade ?? new Prisma.Decimal(0);
      if (atual.gte(q))
        throw new ConflitoDeDados(
          `O saldo em ${balde.codigo} mudou durante o lançamento. Saldo atual: ${atual.toFixed()}. Tente novamente.`,
        );
      const falta = q.minus(atual);
      throw new ConflitoDeDados(
        `${estorno ? "Estorno bloqueado por saldo insuficiente" : "Saldo insuficiente"} em ${balde.codigo}. Saldo atual: ${atual.toFixed()}. Faltam ${falta.toFixed()}.`,
      );
    }
    return linha.quantidade;
  }

  const conflito =
    posicaoId === null
      ? Prisma.sql`("itemId", "unidadeId") WHERE "posicaoId" IS NULL`
      : Prisma.sql`("itemId", "unidadeId", "posicaoId")`;
  const [linha] = await tx.$queryRaw<{ quantidade: Prisma.Decimal }[]>`
    INSERT INTO "Saldo" (id, "empresaId", "unidadeId", "itemId", "posicaoId", quantidade, "atualizadoEm")
    VALUES (${randomUUID()}, ${empresaId}, ${unidadeId}, ${itemId}, ${posicaoId}, ${q}, clock_timestamp())
    ON CONFLICT ${conflito} DO UPDATE
    SET quantidade = "Saldo".quantidade + EXCLUDED.quantidade, "atualizadoEm" = clock_timestamp()
    WHERE "Saldo"."empresaId" = EXCLUDED."empresaId"
      AND "Saldo".quantidade + EXCLUDED.quantidade <= 99999999999.999
    RETURNING quantidade`;
  if (!linha)
    throw new ConflitoDeDados(
      `O saldo em ${balde.codigo} atingiu o limite permitido.`,
    );
  return linha.quantidade;
}

function ordemBalde(a: Balde, b: Balde) {
  if (a.posicaoId === b.posicaoId) return 0;
  if (a.posicaoId === null) return -1;
  if (b.posicaoId === null) return 1;
  return a.posicaoId < b.posicaoId ? -1 : 1;
}

export async function registrarMovimentacao(
  c: ContextoUnidade,
  entrada: EntradaMovimentacao,
) {
  const resultado = movimentacaoSchema.safeParse(entrada);
  if (!resultado.success)
    throw new AppError(
      resultado.error.issues[0]?.message ?? "Movimentação inválida.",
    );
  const d = resultado.data;
  exigirPapel(
    c,
    requerGestao(d.tipo)
      ? ["ADMIN", "GERENTE"]
      : ["ADMIN", "GERENTE", "ESTOQUISTA"],
  );
  const base = filtroUnidade(c);
  const chaveId = {
    empresaId: c.empresaId,
    chaveIdempotencia: d.chaveIdempotencia,
  };
  const whereId = { empresaId_chaveIdempotencia: chaveId };
  const retornarExistente = (m: { unidadeId: string; tipo: typeof d.tipo }) => {
    if (m.unidadeId !== c.unidadeId) throw new NaoEncontrado();
    if (requerGestao(m.tipo)) exigirPapel(c);
  };
  const anexos = d.tipo === "ESTORNO" ? [] : (d.fotos ?? []);
  if (anexos.length && d.tipo !== "QUEBRA")
    throw new AppError("Somente quebras podem ter fotos.");
  const buscarExistente = async () => {
    const existente = await prisma.movimentacao.findUnique({ where: whereId });
    if (existente) retornarExistente(existente);
    return existente;
  };
  const fotos = await (async () => {
    if (!anexos.length) return [];
    const unidade = await prisma.unidade.findFirst({
      where: { id: c.unidadeId, empresaId: c.empresaId, ativa: true },
    });
    if (!unidade)
      throw new NaoEncontrado("Selecione uma unidade ativa da sua empresa.");
    // O retry procura o lançamento antes de acessar o provedor de fotos.
    if (await buscarExistente()) return [];
    try {
      return await validarFotosAvaria(c, d.chaveIdempotencia, anexos);
    } catch (e) {
      if (await buscarExistente()) return [];
      throw e;
    }
  })();
  try {
    return await prisma.$transaction(
      async (tx) => {
        // O lock só serializa repetições da mesma chave na empresa. A unicidade permanece no banco.
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${JSON.stringify(chaveId)}, 0))`;
        const existente = await tx.movimentacao.findUnique({ where: whereId });
        if (existente) {
          retornarExistente(existente);
          return existente;
        }
        // Compatível com lançamentos paralelos, exclusivo contra alterações na hierarquia e alocações.
        const unidade = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Unidade" WHERE id = ${c.unidadeId} AND "empresaId" = ${c.empresaId} AND ativa FOR SHARE`;
        if (!unidade.length)
          throw new NaoEncontrado(
            "Selecione uma unidade ativa da sua empresa.",
          );

        const usuario = await tx.usuario.findFirst({
          where: { id: c.usuarioId, empresaId: c.empresaId, removidoEm: null },
          select: { id: true },
        });
        if (!usuario)
          throw new NaoEncontrado("Usuário não encontrado nesta empresa.");

        if (d.tipo === "ESTORNO" && !d.justificativa)
          throw new AppError("Informe a justificativa do estorno.");
        if (
          (d.tipo === "AJUSTE_POSITIVO" || d.tipo === "AJUSTE_NEGATIVO") &&
          (d.justificativa?.length ?? 0) < 10
        )
          throw new AppError(
            "Informe uma justificativa com pelo menos 10 caracteres.",
          );

        let original = null;
        if (d.tipo === "ESTORNO") {
          const travado = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Movimentacao" WHERE id = ${d.estornoDeId}
            AND "empresaId" = ${c.empresaId} AND "unidadeId" = ${c.unidadeId} FOR UPDATE`;
          if (!travado.length)
            throw new NaoEncontrado("Movimentação não encontrada.");
          original = await tx.movimentacao.findFirstOrThrow({
            where: { ...base, id: d.estornoDeId },
            include: { estornadaPor: { select: { id: true } } },
          });
          if (original.tipo === "ESTORNO")
            throw new ConflitoDeDados("Um estorno não pode ser estornado.");
          if (original.estornadaPor)
            throw new ConflitoDeDados("Esta movimentação já foi estornada.");
        }

        const itemId = d.tipo === "ESTORNO" ? original!.itemId : d.itemId;
        const [item] = await tx.$queryRaw<{ unidadeMedida: string }[]>`
        SELECT "unidadeMedida" FROM "Item"
        WHERE id = ${itemId} AND "empresaId" = ${c.empresaId} AND "deletadoEm" IS NULL FOR SHARE`;
        if (!item) throw new NaoEncontrado("Item não encontrado.");
        const quantidade =
          d.tipo === "ESTORNO"
            ? original!.quantidade
            : validarQuantidade(d.quantidade, item.unidadeMedida);
        const tipoOriginal =
          original?.tipo === "ESTORNO" ? undefined : original?.tipo;
        const lados = ladosMovimentacao(d.tipo, tipoOriginal);
        const posicaoOrigemId = lados.origem
          ? d.tipo === "ESTORNO"
            ? original!.posicaoDestinoId
            : (d.posicaoOrigemId ?? null)
          : null;
        const posicaoDestinoId = lados.destino
          ? d.tipo === "ESTORNO"
            ? original!.posicaoOrigemId
            : (d.posicaoDestinoId ?? null)
          : null;
        if (
          lados.origem &&
          lados.destino &&
          posicaoOrigemId === posicaoDestinoId
        )
          throw new AppError("Origem e destino devem ser diferentes.");

        const fornecidas =
          d.tipo === "ESTORNO" ? [] : [d.posicaoOrigemId, d.posicaoDestinoId];
        const ids = [
          ...new Set(
            [posicaoOrigemId, posicaoDestinoId, ...fornecidas].filter(
              (id): id is string => id !== null && id !== undefined,
            ),
          ),
        ];
        const posicoes = await tx.posicao.findMany({
          where: { ...base, id: { in: ids }, deletadoEm: null },
          select: { id: true, codigo: true },
        });
        if (posicoes.length !== ids.length)
          throw new NaoEncontrado("Posição não encontrada nesta unidade.");

        const motivoQuebraId = d.tipo === "QUEBRA" ? d.motivoQuebraId : null;
        if (d.tipo === "QUEBRA") {
          if (!motivoQuebraId)
            throw new AppError("Selecione o motivo da quebra.");
          const motivos = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM "MotivoQuebra" WHERE id = ${motivoQuebraId} AND "empresaId" = ${c.empresaId}
            AND ativo AND "deletadoEm" IS NULL FOR SHARE`;
          if (!motivos.length)
            throw new NaoEncontrado("Motivo de quebra ativo não encontrado.");
        }

        const baldes: Balde[] = [];
        const codigo = (id: string | null) =>
          posicoes.find((p) => p.id === id)?.codigo ?? "Sem posição";
        if (lados.origem)
          baldes.push({
            lado: "origem",
            posicaoId: posicaoOrigemId,
            codigo: codigo(posicaoOrigemId),
          });
        if (lados.destino)
          baldes.push({
            lado: "destino",
            posicaoId: posicaoDestinoId,
            codigo: codigo(posicaoDestinoId),
          });
        const saldos: Partial<Record<Balde["lado"], Prisma.Decimal>> = {};
        for (const balde of baldes.sort(ordemBalde)) {
          saldos[balde.lado] = await alterarSaldo(
            tx,
            { ...base, itemId },
            balde,
            quantidade,
            d.tipo === "ESTORNO",
          );
        }
        if (posicaoDestinoId !== null) {
          await tx.itemPosicao.createMany({
            data: { ...base, itemId, posicaoId: posicaoDestinoId },
            skipDuplicates: true,
          });
        }
        return tx.movimentacao.create({
          data: {
            ...base,
            itemId,
            tipo: d.tipo,
            quantidade,
            posicaoOrigemId,
            posicaoDestinoId,
            motivoQuebraId,
            justificativa: d.justificativa || null,
            observacao: d.tipo === "ESTORNO" ? null : d.observacao || null,
            referencia: d.tipo === "ESTORNO" ? null : d.referencia || null,
            saldoOrigemApos: saldos.origem,
            saldoDestinoApos: saldos.destino,
            estornoDeId: original?.id,
            chaveIdempotencia: d.chaveIdempotencia,
            usuarioId: c.usuarioId,
            fotos: fotos.length
              ? { create: fotos.map((f) => ({ ...f, empresaId: c.empresaId })) }
              : undefined,
          },
        });
      },
      { maxWait: 60000, timeout: 30000 },
    );
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const existente = await buscarExistente();
      if (existente) return existente;
      if (d.tipo === "ESTORNO")
        throw new ConflitoDeDados("Esta movimentação já foi estornada.");
    }
    throw e;
  }
}

const incluirHistorico = {
  item: {
    select: {
      id: true,
      nome: true,
      codigoInterno: true,
      unidadeMedida: true,
      deletadoEm: true,
    },
  },
  usuario: { select: { id: true, clerkId: true, nome: true } },
  posicaoOrigem: { select: { codigo: true } },
  posicaoDestino: { select: { codigo: true } },
  motivoQuebra: { select: { nome: true } },
  estornoDe: { select: { id: true, tipo: true } },
  estornadaPor: { select: { id: true } },
} satisfies Prisma.MovimentacaoInclude;

export type LinhaMovimentacao = Prisma.MovimentacaoGetPayload<{
  include: typeof incluirHistorico;
}>;
export type FiltroMovimentacao = {
  tipo?: LinhaMovimentacao["tipo"];
  itemId?: string;
  usuarioId?: string;
  posicaoId?: string | null;
  inicio?: Date;
  fim?: Date;
  pagina?: number;
};
export async function listarMovimentacoes(
  c: ContextoUnidade,
  f: FiltroMovimentacao = {},
) {
  const where: Prisma.MovimentacaoWhereInput = {
    ...filtroUnidade(c),
    tipo: f.tipo,
    itemId: f.itemId,
    usuarioId: f.usuarioId,
    criadoEm: { gte: f.inicio, lt: f.fim },
    ...(f.posicaoId === undefined
      ? {}
      : {
          OR: [
            { posicaoOrigemId: f.posicaoId, saldoOrigemApos: { not: null } },
            { posicaoDestinoId: f.posicaoId, saldoDestinoApos: { not: null } },
          ],
        }),
  };
  const [movimentacoes, total] = await prisma.$transaction([
    prisma.movimentacao.findMany({
      where,
      include: incluirHistorico,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      take: 20,
      skip: ((f.pagina ?? 1) - 1) * 20,
    }),
    prisma.movimentacao.count({ where }),
  ]);
  return { movimentacoes, total };
}

export async function obterMovimentacao(c: ContextoUnidade, id: string) {
  const movimentacao = await prisma.movimentacao.findFirst({
    where: { ...filtroUnidade(c), id },
    include: {
      ...incluirHistorico,
      fotos: {
        where: { empresaId: c.empresaId },
        orderBy: { criadoEm: "asc" },
      },
    },
  });
  if (!movimentacao) throw new NaoEncontrado("Movimentação não encontrada.");
  return movimentacao;
}

export async function opcoesHistorico(c: ContextoUnidade) {
  const base = filtroUnidade(c);
  const [itens, posicoes, usuarios] = await Promise.all([
    prisma.item.findMany({
      where: { empresaId: c.empresaId, movimentacoes: { some: base } },
      select: { id: true, nome: true, codigoInterno: true },
      orderBy: { nome: "asc" },
    }),
    prisma.posicao.findMany({
      where: {
        ...base,
        OR: [
          { deletadoEm: null },
          { movimentacoesOrigem: { some: base } },
          { movimentacoesDestino: { some: base } },
        ],
      },
      select: { id: true, codigo: true },
      orderBy: { codigo: "asc" },
    }),
    prisma.usuario.findMany({
      where: { empresaId: c.empresaId, movimentacoes: { some: base } },
      select: { id: true, nome: true, clerkId: true },
      orderBy: [{ nome: "asc" }, { clerkId: "asc" }],
    }),
  ]);
  return {
    itens: itens.map((i) => ({
      id: i.id,
      nome: i.nome + " · #" + i.codigoInterno,
    })),
    posicoes: posicoes.map((p) => ({ id: p.id, nome: p.codigo })),
    usuarios: usuarios.map((u) => ({ id: u.id, nome: u.nome ?? u.clerkId })),
  };
}
