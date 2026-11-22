import { prisma } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { Contexto, ContextoUnidade } from "@/types";
import { exigirPapel } from "@/server/permissoes";
import { NaoEncontrado } from "@/lib/erros";
import { gerarTokenQr, imagemQr, svgQr } from "@/lib/qr";
import {
  alvoQr,
  bloquearUnidade,
  obterLocalizacao,
  caminhoLocalizacao,
  tipoFilho,
  listarNivel,
  type Tipo,
} from "./localizacoes";
import { validarUnidade } from "./unidades";
import { conteudoLocalizacao } from "./alocacoes";
export function filtroQrUnidade(c: ContextoUnidade): Prisma.QRCodeWhereInput {
  const base = {
    empresaId: c.empresaId,
    unidadeId: c.unidadeId,
    deletadoEm: null,
  };
  return {
    empresaId: c.empresaId,
    OR: [
      { secao: base },
      { modulo: base },
      { prateleira: base },
      { posicao: base },
    ],
  };
}
export async function alterarQr(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
  operacao: "gerar" | "regenerar" | "deletar",
) {
  exigirPapel(c);
  return prisma.$transaction(async (tx) => {
    await bloquearUnidade(tx, c);
    await obterLocalizacao(c, tipo, id, tx);
    const existente = await tx.qRCode.findFirst({
      where: { ...filtroQrUnidade(c), tipo, ...alvoQr(tipo, id) },
    });
    if (operacao === "deletar") {
      if (!existente || existente.deletadoEm) throw new NaoEncontrado();
      return tx.qRCode.update({
        where: { id: existente.id, empresaId: c.empresaId },
        data: { deletadoEm: new Date() },
      });
    }
    if (operacao === "gerar" && existente && !existente.deletadoEm)
      return existente;
    if (operacao === "regenerar" && (!existente || existente.deletadoEm))
      throw new NaoEncontrado();
    const token = gerarTokenQr();
    if (existente)
      return tx.qRCode.update({
        where: { id: existente.id, empresaId: c.empresaId },
        data: { token, versao: { increment: 1 }, deletadoEm: null },
      });
    return tx.qRCode.create({
      data: { empresaId: c.empresaId, tipo, token, ...alvoQr(tipo, id) },
    });
  });
}
export async function obterQr(c: ContextoUnidade, id: string) {
  exigirPapel(c, ["ADMIN", "GERENTE", "ESTOQUISTA"]);
  const qr = await prisma.qRCode.findFirst({
    where: { ...filtroQrUnidade(c), id, deletadoEm: null },
  });
  if (!qr) throw new NaoEncontrado("QR Code não encontrado.");
  return qr;
}
export async function qrDaLocalizacao(
  c: ContextoUnidade,
  tipo: Tipo,
  id: string,
) {
  await obterLocalizacao(c, tipo, id);
  return prisma.qRCode.findFirst({
    where: {
      ...filtroQrUnidade(c),
      tipo,
      ...alvoQr(tipo, id),
      deletadoEm: null,
    },
  });
}
export async function listarQrs(c: ContextoUnidade) {
  return prisma.qRCode.findMany({
    where: { ...filtroQrUnidade(c), deletadoEm: null },
    orderBy: { criadoEm: "desc" },
  });
}
export function idAlvo(q: {
  tipo: Tipo;
  secaoId: string | null;
  moduloId: string | null;
  prateleiraId: string | null;
  posicaoId: string | null;
}) {
  return (
    q.tipo === "SECAO"
      ? q.secaoId
      : q.tipo === "MODULO"
        ? q.moduloId
        : q.tipo === "PRATELEIRA"
          ? q.prateleiraId
          : q.posicaoId
  )!;
}
export async function resolverToken(c: Contexto, token: string) {
  // O token descobre a unidade somente dentro da empresa autenticada. Não é uma unidade recebida do navegador.
  const escopo = { empresaId: c.empresaId, deletadoEm: null };
  const qr = await prisma.qRCode.findFirst({
    where: { empresaId: c.empresaId, token, deletadoEm: null },
    include: {
      secao: { where: escopo, select: { unidadeId: true } },
      modulo: { where: escopo, select: { unidadeId: true } },
      prateleira: { where: escopo, select: { unidadeId: true } },
      posicao: { where: escopo, select: { unidadeId: true } },
    },
  });
  const unidadeId =
    qr?.secao?.unidadeId ??
    qr?.modulo?.unidadeId ??
    qr?.prateleira?.unidadeId ??
    qr?.posicao?.unidadeId;
  if (!qr || !unidadeId) throw new NaoEncontrado("QR Code não encontrado.");
  const contexto = await validarUnidade(c, unidadeId);
  const localizacao = await obterLocalizacao(contexto, qr.tipo, idAlvo(qr));
  return { qr, localizacao, contexto };
}
export async function gerarImagemQr(
  c: ContextoUnidade,
  id: string,
  formato: "png" | "svg",
) {
  const qr = await obterQr(c, id);
  if (formato === "svg")
    return { dados: await svgQr(qr.token), tipo: "image/svg+xml" };
  return {
    dados: Buffer.from((await imagemQr(qr.token)).split(",")[1], "base64"),
    tipo: "image/png",
  };
}
export async function dadosFicha(c: ContextoUnidade, tipo: Tipo, id: string) {
  exigirPapel(c, ["ADMIN", "GERENTE", "ESTOQUISTA"]);
  const localizacao = await obterLocalizacao(c, tipo, id);
  const [caminho, unidade, qr, itens, filhos] = await Promise.all([
    caminhoLocalizacao(c, tipo, id),
    prisma.unidade.findFirstOrThrow({
      where: { id: c.unidadeId, empresaId: c.empresaId, ativa: true },
    }),
    qrDaLocalizacao(c, tipo, id),
    conteudoLocalizacao(c, tipo, id),
    tipoFilho[tipo]
      ? listarNivel(c, tipoFilho[tipo]!, id)
      : Promise.resolve([]),
  ]);
  return {
    localizacao,
    caminho: caminho.map((l) => l.codigo).join(" > "),
    unidade: unidade.nome,
    data: new Date().toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
    qr: qr ? await imagemQr(qr.token) : null,
    filhos,
    itens,
  };
}
