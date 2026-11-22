import { criarContextoUnidade, criarContexto, limpar, temBanco } from "./apoio";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { ContextoUnidade, Contexto } from "@/types";
import {
  salvarLocalizacao,
  excluirLocalizacao,
} from "@/server/services/localizacoes";
import { alterarQr, resolverToken, obterQr } from "@/server/services/qrcodes";
import { prisma } from "@/server/db";
describe.skipIf(!temBanco)("Ciclo e isolamento de QR Codes", () => {
  let c: ContextoUnidade;
  let b: Contexto;
  beforeAll(async () => {
    c = await criarContextoUnidade();
    b = await criarContexto();
  });
  afterAll(async () => {
    if (c) await limpar(c);
    if (b) await limpar(b);
  });
  it("gera, regenera invalidando token antigo, exclui e restaura com novo token", async () => {
    const secao = await salvarLocalizacao(c, {
      tipo: "SECAO",
      codigo: "A",
      nome: "Seção A",
    });
    const q1 = await alterarQr(c, "SECAO", secao.id, "gerar");
    expect((await alterarQr(c, "SECAO", secao.id, "gerar")).token).toBe(
      q1.token,
    );
    expect((await resolverToken(c, q1.token)).localizacao.id).toBe(secao.id);
    await expect(resolverToken(b, q1.token)).rejects.toThrow(
      "QR Code não encontrado",
    );
    const q2 = await alterarQr(c, "SECAO", secao.id, "regenerar");
    expect(q2.versao).toBe(2);
    expect(q2.token).not.toBe(q1.token);
    await expect(resolverToken(c, q1.token)).rejects.toThrow();
    await alterarQr(c, "SECAO", secao.id, "deletar");
    await expect(obterQr(c, q2.id)).rejects.toThrow();
    await expect(resolverToken(c, q2.token)).rejects.toThrow();
    const q3 = await alterarQr(c, "SECAO", secao.id, "gerar");
    expect(q3.id).toBe(q1.id);
    expect(q3.token).not.toBe(q2.token);
    await excluirLocalizacao(c, "SECAO", secao.id);
    await expect(resolverToken(c, q3.token)).rejects.toThrow();
  });
  it("CHECK impede nenhum alvo, múltiplos alvos e tipo incompatível", async () => {
    const s = await salvarLocalizacao(c, {
      tipo: "SECAO",
      codigo: "B",
      nome: "Seção B",
    });
    const m = await salvarLocalizacao(c, { tipo: "MODULO", paiId: s.id });
    for (const data of [
      { tipo: "SECAO" as const },
      { tipo: "POSICAO" as const, secaoId: s.id },
      { tipo: "SECAO" as const, secaoId: s.id, moduloId: m.id },
    ])
      await expect(
        prisma.qRCode.create({
          data: {
            empresaId: c.empresaId,
            token: `invalido-${Math.random()}`,
            ...data,
          },
        }),
      ).rejects.toThrow();
  });
});
