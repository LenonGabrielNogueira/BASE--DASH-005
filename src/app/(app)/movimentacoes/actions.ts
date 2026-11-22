"use server";

import { z } from "zod";
import { executarAcaoUnidade } from "@/server/acoes-unidade";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { mensagemErro, NaoEncontrado } from "@/lib/erros";
import { movimentacaoSchema } from "@/lib/validacao/movimentacao";
import { tokenSchema } from "@/lib/validacao/qrcode";
import { registrarMovimentacao } from "@/server/services/movimentacoes";
import { saldoNaPosicao } from "@/server/services/saldos";
import { resolverToken } from "@/server/services/qrcodes";
import type { Resultado } from "@/types";

const lancamentoSchema = z.object({
  unidadeId: z.string().min(1),
  dados: movimentacaoSchema,
});

export async function registrar(entrada: unknown): Promise<Resultado<string>> {
  let id = "";
  const resultado = await executarAcaoUnidade(
    lancamentoSchema,
    entrada,
    async (c, { unidadeId, dados }) => {
      if (unidadeId !== c.unidadeId)
        throw new NaoEncontrado("A unidade atual mudou. Reabra o formulário.");
      id = (await registrarMovimentacao(c, dados)).id;
    },
  );
  return resultado.ok ? { ok: true, data: id } : resultado;
}

export async function consultarSaldo(
  entrada: unknown,
): Promise<Resultado<string>> {
  const d = z
    .object({
      id: z.string().min(1).max(100),
      unidadeId: z.string(),
      posicaoId: z.string().min(1).max(100).nullable(),
    })
    .safeParse(entrada);
  if (!d.success) return { ok: false, erro: "Selecione o item e a posição." };
  try {
    const c = await getUnidadeAtual(await getContexto());
    if (!c || c.unidadeId !== d.data.unidadeId)
      throw new NaoEncontrado("A unidade atual mudou. Reabra o formulário.");
    const saldo = await saldoNaPosicao(c, d.data.id, d.data.posicaoId);
    return { ok: true, data: saldo };
  } catch (e) {
    return { ok: false, erro: mensagemErro(e) };
  }
}

export async function lerPosicao(entrada: unknown): Promise<Resultado<string>> {
  const d = z
    .object({ token: tokenSchema, unidadeId: z.string() })
    .safeParse(entrada);
  if (!d.success) return { ok: false, erro: "QR da posição inválido." };
  try {
    const c = await getContexto();
    const atual = await getUnidadeAtual(c);
    if (!atual || atual.unidadeId !== d.data.unidadeId)
      throw new NaoEncontrado("A unidade atual mudou. Reabra o formulário.");
    const { contexto, localizacao } = await resolverToken(c, d.data.token);
    if (
      localizacao.tipo !== "POSICAO" ||
      contexto.unidadeId !== atual.unidadeId
    )
      throw new NaoEncontrado(
        "Leia o QR Code de uma posição da unidade atual.",
      );
    return { ok: true, data: localizacao.id };
  } catch (e) {
    return { ok: false, erro: mensagemErro(e) };
  }
}
