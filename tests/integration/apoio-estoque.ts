import { randomUUID } from "node:crypto";
import { criarContextoUnidade } from "./apoio";
import { prisma } from "@/server/db";
import { salvarLocalizacao } from "@/server/services/localizacoes";
import { registrarMovimentacao } from "@/server/services/movimentacoes";
import type { EntradaMovimentacao } from "@/lib/validacao/movimentacao";

type Lancamento = Omit<
  Extract<EntradaMovimentacao, { itemId: string }>,
  "itemId" | "chaveIdempotencia"
> & { chaveIdempotencia?: string };

export async function prepararEstoque() {
  const c = await criarContextoUnidade();
  const item = await prisma.item.create({
    data: {
      empresaId: c.empresaId,
      nome: "Mercadoria",
      codigoInterno: "000001",
    },
  });
  const secao = await salvarLocalizacao(c, {
    tipo: "SECAO",
    codigo: "A",
    nome: "Seção",
  });
  const modulo = await salvarLocalizacao(c, {
    tipo: "MODULO",
    paiId: secao.id,
  });
  const prateleira = await salvarLocalizacao(c, {
    tipo: "PRATELEIRA",
    paiId: modulo.id,
  });
  const a = await salvarLocalizacao(c, {
    tipo: "POSICAO",
    paiId: prateleira.id,
  });
  const b = await salvarLocalizacao(c, {
    tipo: "POSICAO",
    paiId: prateleira.id,
  });
  const lancar = (dados: Lancamento) =>
    registrarMovimentacao(c, {
      itemId: item.id,
      chaveIdempotencia: randomUUID(),
      ...dados,
    });
  const saldos = () =>
    prisma.saldo.findMany({ where: { empresaId: c.empresaId } });
  return { c, item, a, b, lancar, saldos };
}
