import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConflitoDeDados } from "@/lib/erros";
import { prisma } from "@/server/db";
import { limpar, temBanco } from "./apoio";
import { prepararEstoque } from "./apoio-estoque";

describe.skipIf(!temBanco)("concorrência de saldo", () => {
  let f: Awaited<ReturnType<typeof prepararEstoque>>;
  beforeEach(async () => {
    f = await prepararEstoque();
  });
  afterEach(async () => {
    if (f) await limpar(f.c);
  });

  it("faz exatamente 60 débitos ao receber 100 saídas", async () => {
    await f.lancar({ tipo: "ENTRADA", quantidade: "60" });
    const resultados = await Promise.allSettled(
      Array.from({ length: 100 }, () =>
        f.lancar({ tipo: "SAIDA", quantidade: "1" }),
      ),
    );
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(60);
    const falhas = resultados.filter((r) => r.status === "rejected");
    expect(falhas).toHaveLength(40);
    for (const r of falhas) expect(r.reason).toBeInstanceOf(ConflitoDeDados);
    expect((await f.saldos()).map((s) => s.quantidade.toFixed())).toEqual([
      "0",
    ]);
  }, 30000);

  it("mantém exatamente um saldo sem posição após 50 entradas simultâneas", async () => {
    await Promise.all(
      Array.from({ length: 50 }, () =>
        f.lancar({ tipo: "ENTRADA", quantidade: "2" }),
      ),
    );
    expect(
      (await f.saldos()).map((s) => [s.posicaoId, s.quantidade.toFixed()]),
    ).toEqual([[null, "100"]]);
  }, 30000);

  it("processa transferências cruzadas", async () => {
    const { a, b, lancar } = f;
    for (const p of [a, b])
      await lancar({
        tipo: "ENTRADA",
        quantidade: "20",
        posicaoDestinoId: p.id,
      });
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        lancar({
          tipo: "TRANSFERENCIA",
          quantidade: "1",
          posicaoOrigemId: i % 2 ? a.id : b.id,
          posicaoDestinoId: i % 2 ? b.id : a.id,
        }),
      ),
    );
    expect((await f.saldos()).map((s) => s.quantidade.toFixed())).toEqual([
      "20",
      "20",
    ]);
  }, 30000);

  it("devolve o mesmo registro a 10 chamadas com a mesma chave", async () => {
    const chaveIdempotencia = randomUUID();
    const movimentos = await Promise.all(
      Array.from({ length: 10 }, () =>
        f.lancar({ tipo: "ENTRADA", quantidade: "1", chaveIdempotencia }),
      ),
    );
    expect(new Set(movimentos.map((m) => m.id)).size).toBe(1);
    expect(
      await prisma.movimentacao.count({ where: { empresaId: f.c.empresaId } }),
    ).toBe(1);
    expect((await f.saldos())[0].quantidade.toFixed()).toBe("1");
  }, 30000);
});
