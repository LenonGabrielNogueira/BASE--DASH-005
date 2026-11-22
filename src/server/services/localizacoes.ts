import { prisma } from "@/server/db";
import type { Prisma, TipoLocalizacao } from "@prisma/client";
import type { ContextoUnidade } from "@/types";
import { AppError, ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
import { exigirPapel } from "@/server/permissoes";
import {
  gerarCodigoLocalizacao,
  validarCodigoSecao,
} from "@/lib/codigo-localizacao";
import { validarUnidade } from "./unidades";
import { localizacaoSchema, loteSchema } from "@/lib/validacao/localizacao";
import type { z } from "zod";
export type Tipo = TipoLocalizacao;
export type Localizacao = {
  id: string;
  tipo: Tipo;
  codigo: string;
  nome: string | null;
  descricao: string | null;
  paiId: string | null;
  ordem: number;
  unidadeId: string;
};
export type NoLocalizacao = Localizacao & {
  filhos: NoLocalizacao[];
  quantidade: number;
};
export const tipoFilho: Record<Tipo, Tipo | null> = {
  SECAO: "MODULO",
  MODULO: "PRATELEIRA",
  PRATELEIRA: "POSICAO",
  POSICAO: null,
};
export const tipoPai: Record<Tipo, Tipo | null> = {
  SECAO: null,
  MODULO: "SECAO",
  PRATELEIRA: "MODULO",
  POSICAO: "PRATELEIRA",
};
export const rotasTipo: Record<Tipo, string> = {
  SECAO: "secoes",
  MODULO: "modulos",
  PRATELEIRA: "prateleiras",
  POSICAO: "posicoes",
};
export function linkLocalizacao(l: Pick<Localizacao, "tipo" | "id">) {
  return `/localizacoes/${rotasTipo[l.tipo]}/${l.id}`;
}
type Db = Prisma.TransactionClient;
export const filtroUnidade = (c: ContextoUnidade) => ({
  empresaId: c.empresaId,
  unidadeId: c.unidadeId,
});
export async function bloquearUnidade(tx: Db, c: ContextoUnidade) {
  const linhas = await tx.$queryRaw<
    { id: string }[]
  >`SELECT id FROM "Unidade" WHERE id = ${c.unidadeId} AND "empresaId" = ${c.empresaId} AND ativa = true FOR UPDATE`;
  if (!linhas.length)
    throw new NaoEncontrado("Selecione uma unidade ativa da sua empresa.");
}
export async function obterLocalizacao(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
  db: Db = prisma,
): Promise<Localizacao> {
  const where = { ...filtroUnidade(c), id, deletadoEm: null };
  if (tipo === "SECAO") {
    const r = await db.secao.findFirst({ where });
    if (r) return { ...r, tipo, paiId: null, ordem: 0 };
  }
  if (tipo === "MODULO") {
    const r = await db.modulo.findFirst({ where });
    if (r) return { ...r, tipo, paiId: r.secaoId };
  }
  if (tipo === "PRATELEIRA") {
    const r = await db.prateleira.findFirst({ where });
    if (r) return { ...r, tipo, paiId: r.moduloId, descricao: null };
  }
  if (tipo === "POSICAO") {
    const r = await db.posicao.findFirst({ where });
    if (r) return { ...r, tipo, paiId: r.prateleiraId, nome: null };
  }
  throw new NaoEncontrado("Localização não encontrada.");
}
export async function listarNivel(
  c: ContextoUnidade,
  tipo: Tipo,
  paiId?: string,
  db: Db = prisma,
): Promise<Localizacao[]> {
  const where = { ...filtroUnidade(c), deletadoEm: null };
  if (tipo === "SECAO")
    return (await db.secao.findMany({ where, orderBy: { codigo: "asc" } })).map(
      (r) => ({ ...r, tipo, paiId: null, ordem: 0 }),
    );
  if (tipo === "MODULO")
    return (
      await db.modulo.findMany({
        where: { ...where, ...(paiId ? { secaoId: paiId } : {}) },
        orderBy: { ordem: "asc" },
      })
    ).map((r) => ({ ...r, tipo, paiId: r.secaoId }));
  if (tipo === "PRATELEIRA")
    return (
      await db.prateleira.findMany({
        where: { ...where, ...(paiId ? { moduloId: paiId } : {}) },
        orderBy: { ordem: "asc" },
      })
    ).map((r) => ({ ...r, tipo, paiId: r.moduloId, descricao: null }));
  return (
    await db.posicao.findMany({
      where: { ...where, ...(paiId ? { prateleiraId: paiId } : {}) },
      orderBy: { ordem: "asc" },
    })
  ).map((r) => ({ ...r, tipo, paiId: r.prateleiraId, nome: null }));
}
export async function caminhoLocalizacao(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
): Promise<Localizacao[]> {
  const atual = await obterLocalizacao(c, tipo, id);
  const pai = tipoPai[tipo];
  return pai && atual.paiId
    ? [...(await caminhoLocalizacao(c, pai, atual.paiId)), atual]
    : [atual];
}
export async function criarLocalizacaoTx(
  tx: Db,
  c: ContextoUnidade,
  entrada: z.input<typeof localizacaoSchema>,
): Promise<Localizacao> {
  const d = localizacaoSchema.parse(entrada);
  const base = filtroUnidade(c);
  if (d.tipo === "SECAO") {
    if (!d.codigo || !validarCodigoSecao(d.codigo))
      throw new AppError("Código de seção inválido.");
    const existente = await tx.secao.findFirst({
      where: { ...base, codigo: d.codigo },
    });
    if (existente)
      throw new ConflitoDeDados(
        "Código de seção já utilizado nesta unidade, inclusive em seções excluídas.",
      );
    const r = await tx.secao.create({
      data: { ...base, codigo: d.codigo, nome: d.nome, descricao: d.descricao },
    });
    return { ...r, tipo: "SECAO", paiId: null, ordem: 0 };
  }
  const pai = await obterLocalizacao(c, tipoPai[d.tipo]!, d.paiId!, tx);
  let maior: number | null | undefined;
  if (d.tipo === "MODULO")
    maior = (
      await tx.modulo.aggregate({
        where: { ...base, secaoId: pai.id },
        _max: { ordem: true },
      })
    )._max.ordem;
  else if (d.tipo === "PRATELEIRA")
    maior = (
      await tx.prateleira.aggregate({
        where: { ...base, moduloId: pai.id },
        _max: { ordem: true },
      })
    )._max.ordem;
  else
    maior = (
      await tx.posicao.aggregate({
        where: { ...base, prateleiraId: pai.id },
        _max: { ordem: true },
      })
    )._max.ordem;
  const ordem = (maior ?? 0) + 1;
  const codigo = gerarCodigoLocalizacao(pai.codigo, d.tipo, ordem);
  if (d.tipo === "MODULO") {
    const r = await tx.modulo.create({
      data: {
        ...base,
        secaoId: pai.id,
        nome: d.nome,
        descricao: d.descricao,
        ordem,
        codigo,
      },
    });
    return { ...r, tipo: d.tipo, paiId: pai.id };
  }
  if (d.tipo === "PRATELEIRA") {
    const r = await tx.prateleira.create({
      data: { ...base, moduloId: pai.id, nome: d.nome, ordem, codigo },
    });
    return { ...r, tipo: d.tipo, paiId: pai.id, descricao: null };
  }
  const r = await tx.posicao.create({
    data: {
      ...base,
      prateleiraId: pai.id,
      descricao: d.descricao,
      ordem,
      codigo,
    },
  });
  return { ...r, tipo: d.tipo, paiId: pai.id, nome: null };
}
export async function salvarLocalizacao(
  c: ContextoUnidade,
  entrada: z.input<typeof localizacaoSchema>,
) {
  exigirPapel(c);
  const d = localizacaoSchema.parse(entrada);
  return prisma.$transaction(
    async (tx) => {
      await bloquearUnidade(tx, c);
      if (!d.id) return criarLocalizacaoTx(tx, c, d);
      await obterLocalizacao(c, d.tipo, d.id, tx);
      const where = { id: d.id, ...filtroUnidade(c), deletadoEm: null };
      if (d.tipo === "SECAO")
        await tx.secao.update({
          where,
          data: { nome: d.nome, descricao: d.descricao },
        });
      else if (d.tipo === "MODULO")
        await tx.modulo.update({
          where,
          data: { nome: d.nome, descricao: d.descricao },
        });
      else if (d.tipo === "PRATELEIRA")
        await tx.prateleira.update({ where, data: { nome: d.nome } });
      else await tx.posicao.update({ where, data: { descricao: d.descricao } });
      return obterLocalizacao(c, d.tipo, d.id, tx);
    },
    { maxWait: 60000, timeout: 15000 },
  );
}
export function alvoQr(tipo: Tipo, id: string) {
  return tipo === "SECAO"
    ? { secaoId: id }
    : tipo === "MODULO"
      ? { moduloId: id }
      : tipo === "PRATELEIRA"
        ? { prateleiraId: id }
        : { posicaoId: id };
}
export async function excluirLocalizacao(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
) {
  exigirPapel(c);
  return prisma.$transaction(async (tx) => {
    await bloquearUnidade(tx, c);
    await obterLocalizacao(c, tipo, id, tx);
    const filho = tipoFilho[tipo];
    const quantidade = filho
      ? (await listarNivel(c, filho, id, tx)).length
      : await tx.itemPosicao.count({
          where: { ...filtroUnidade(c), posicaoId: id },
        });
    if (quantidade)
      throw new ConflitoDeDados(
        `Esta localização possui ${quantidade} ${filho ? "localização(ões) filha(s) ativa(s)" : "item(ns) alocado(s)"}. Remova antes de excluir.`,
      );
    const where = { id, ...filtroUnidade(c), deletadoEm: null };
    const data = { deletadoEm: new Date() };
    if (tipo === "SECAO") await tx.secao.update({ where, data });
    else if (tipo === "MODULO") await tx.modulo.update({ where, data });
    else if (tipo === "PRATELEIRA") await tx.prateleira.update({ where, data });
    else await tx.posicao.update({ where, data });
    await tx.qRCode.updateMany({
      where: { empresaId: c.empresaId, tipo, ...alvoQr(tipo, id) },
      data,
    });
  });
}
export async function criarEmLote(
  c: ContextoUnidade,
  entrada: z.input<typeof loteSchema>,
) {
  exigirPapel(c);
  const d = loteSchema.parse(entrada);
  return prisma.$transaction(
    async (tx) => {
      await bloquearUnidade(tx, c);
      await obterLocalizacao(c, "MODULO", d.moduloId, tx);
      const criadas: Localizacao[] = [];
      for (let p = 0; p < d.prateleiras; p++) {
        const prateleira = await criarLocalizacaoTx(tx, c, {
          tipo: "PRATELEIRA",
          paiId: d.moduloId,
        });
        criadas.push(prateleira);
        // createMany reduz a duração da transação no limite de 2.000 posições.
        await tx.posicao.createMany({
          data: Array.from({ length: d.posicoes }, (_, n) => ({
            ...filtroUnidade(c),
            prateleiraId: prateleira.id,
            ordem: n + 1,
            codigo: gerarCodigoLocalizacao(prateleira.codigo, "POSICAO", n + 1),
          })),
        });
      }
      return criadas;
    },
    { maxWait: 60000, timeout: 60000 },
  );
}
export async function arvoreLocalizacoes(
  c: ContextoUnidade,
): Promise<NoLocalizacao[]> {
  await validarUnidade(c, c.unidadeId);
  const [secoes, modulos, prateleiras, posicoes] = await Promise.all(
    (["SECAO", "MODULO", "PRATELEIRA", "POSICAO"] as const).map((tipo) =>
      listarNivel(c, tipo),
    ),
  );
  const construir = (local: Localizacao): NoLocalizacao => {
    const filhos = (
      local.tipo === "SECAO"
        ? modulos
        : local.tipo === "MODULO"
          ? prateleiras
          : local.tipo === "PRATELEIRA"
            ? posicoes
            : []
    )
      .filter((f) => f.paiId === local.id)
      .map(construir);
    return { ...local, filhos, quantidade: filhos.length };
  };
  return secoes.map(construir);
}
