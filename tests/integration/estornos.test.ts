import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { limpar, temBanco } from "./apoio";
import { prepararEstoque } from "./apoio-estoque";
import { estornarMovimentacao } from "@/server/services/estornos";
import { obterMovimentacao } from "@/server/services/movimentacoes";
import { listarMotivosQuebra } from "@/server/services/motivos-quebra";
import { tiposLancamento } from "@/lib/movimentacao-regras";

const dados = (id: string) => ({
  estornoDeId: id,
  chaveIdempotencia: randomUUID(),
  justificativa: "Correção autorizada",
});

describe.skipIf(!temBanco)("estornos", () => {
  let f: Awaited<ReturnType<typeof prepararEstoque>>;
  beforeEach(async () => {
    f = await prepararEstoque();
  });
  afterEach(async () => {
    if (f) await limpar(f.c);
  });

  it.each(tiposLancamento)("inverte %s e vincula o histórico", async (tipo) => {
    const { a, b, c, lancar, saldos } = f;
    await lancar({ tipo: "ENTRADA", quantidade: "10", posicaoDestinoId: a.id });
    const motivo = (await listarMotivosQuebra(c))[0];
    const original = await lancar({
      tipo,
      quantidade: "2",
      posicaoOrigemId: a.id,
      posicaoDestinoId: b.id,
      motivoQuebraId: motivo.id,
      justificativa: "Ajuste autorizado",
    });
    const estorno = await estornarMovimentacao(c, dados(original.id));
    expect((await obterMovimentacao(c, original.id)).estornadaPor?.id).toBe(
      estorno.id,
    );
    expect(
      (await saldos())
        .filter((s) => s.quantidade.gt(0))
        .map((s) => [s.posicaoId, s.quantidade.toFixed()]),
    ).toEqual([[a.id, "10"]]);
    await expect(estornarMovimentacao(c, dados(original.id))).rejects.toThrow(
      "já foi estornada",
    );
    await expect(estornarMovimentacao(c, dados(estorno.id))).rejects.toThrow(
      "não pode ser estornado",
    );
  });

  it("explica posição e déficit e recusa estoquista", async () => {
    const { a, c, lancar } = f;
    const original = await lancar({
      tipo: "ENTRADA",
      quantidade: "5",
      posicaoDestinoId: a.id,
    });
    await lancar({ tipo: "SAIDA", quantidade: "4", posicaoOrigemId: a.id });
    await expect(estornarMovimentacao(c, dados(original.id))).rejects.toThrow(
      `${a.codigo}. Saldo atual: 1. Faltam 4.`,
    );
    await expect(
      estornarMovimentacao({ ...c, papel: "ESTOQUISTA" }, dados(original.id)),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("permite um único estorno mesmo com chaves distintas em paralelo", async () => {
    const original = await f.lancar({ tipo: "ENTRADA", quantidade: "2" });
    const resultados = await Promise.allSettled([
      estornarMovimentacao(f.c, dados(original.id)),
      estornarMovimentacao(f.c, dados(original.id)),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      resultados.find((r) => r.status === "rejected")?.reason,
    ).toMatchObject({ status: 409 });
  });
});
