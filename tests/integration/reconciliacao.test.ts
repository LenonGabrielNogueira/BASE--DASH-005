import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { limpar, temBanco } from "./apoio";
import { prepararEstoque } from "./apoio-estoque";
import { estornarMovimentacao } from "@/server/services/estornos";
import { listarMotivosQuebra } from "@/server/services/motivos-quebra";
import { _reconciliar } from "@/server/services/saldos";

it.skipIf(!temBanco)(
  "reconcilia a sequência mista com falhas e estornos",
  async () => {
    const { a, b, c, lancar } = await prepararEstoque();
    try {
      await lancar({ tipo: "ENTRADA", quantidade: "10" });
      const t = await lancar({
        tipo: "TRANSFERENCIA",
        quantidade: "5",
        posicaoDestinoId: a.id,
      });
      const [motivo] = await listarMotivosQuebra(c);
      const q = await lancar({
        tipo: "QUEBRA",
        quantidade: "2",
        posicaoOrigemId: a.id,
        motivoQuebraId: motivo.id,
      });
      await expect(
        lancar({
          tipo: "TRANSFERENCIA",
          quantidade: "10",
          posicaoOrigemId: a.id,
          posicaoDestinoId: b.id,
        }),
      ).rejects.toThrow();
      for (const m of [q, t])
        await estornarMovimentacao(c, {
          estornoDeId: m.id,
          chaveIdempotencia: randomUUID(),
          justificativa: "Correção autorizada",
        });
      await lancar({
        tipo: "AJUSTE_NEGATIVO",
        quantidade: "1",
        justificativa: "Ajuste autorizado",
      });
      await lancar({
        tipo: "AJUSTE_POSITIVO",
        quantidade: "2",
        posicaoDestinoId: b.id,
        justificativa: "Ajuste autorizado",
      });
      expect(await _reconciliar(c.empresaId)).toEqual([]);
    } finally {
      await limpar(c);
    }
  },
);
