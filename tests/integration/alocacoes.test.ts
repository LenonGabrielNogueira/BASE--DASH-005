import { criarContextoUnidade, limpar, temBanco, dadosItem } from "./apoio";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { ContextoUnidade } from "@/types";
import {
  salvarLocalizacao,
  excluirLocalizacao,
} from "@/server/services/localizacoes";
import { salvarItem, excluirItem } from "@/server/services/itens";
import {
  alocarItem,
  removerAlocacao,
  conteudoLocalizacao,
  listarAlocacoesItem,
} from "@/server/services/alocacoes";
describe.skipIf(!temBanco)("Alocações sem quantidade", () => {
  let c: ContextoUnidade;
  beforeAll(async () => {
    c = await criarContextoUnidade();
  });
  afterAll(async () => {
    if (c) await limpar(c);
  });
  it("vários itens por posição, várias posições por item e seção sem duplicatas", async () => {
    const s = await salvarLocalizacao(c, {
      tipo: "SECAO",
      codigo: "A",
      nome: "Seção",
    });
    const m = await salvarLocalizacao(c, { tipo: "MODULO", paiId: s.id });
    const p = await salvarLocalizacao(c, { tipo: "PRATELEIRA", paiId: m.id });
    const p1 = await salvarLocalizacao(c, { tipo: "POSICAO", paiId: p.id });
    const p2 = await salvarLocalizacao(c, { tipo: "POSICAO", paiId: p.id });
    const i1 = await salvarItem(c, dadosItem("Item 1"));
    const i2 = await salvarItem(c, dadosItem("Item 2"));
    const a = await alocarItem(c, { itemId: i1.id, posicaoId: p1.id });
    expect((await alocarItem(c, { itemId: i1.id, posicaoId: p1.id })).id).toBe(
      a.id,
    );
    await alocarItem(c, { itemId: i1.id, posicaoId: p2.id });
    await alocarItem(c, { itemId: i2.id, posicaoId: p1.id });
    expect(await listarAlocacoesItem(c, i1.id)).toHaveLength(2);
    const conteudo = await conteudoLocalizacao(c, "SECAO", s.id);
    expect(conteudo).toHaveLength(2);
    expect(conteudo.find((g) => g.item.id === i1.id)?.posicoes).toHaveLength(2);
    await expect(excluirLocalizacao(c, "POSICAO", p1.id)).rejects.toThrow(
      "2 item",
    );
    await removerAlocacao(c, a.id);
    await excluirItem(c, i2.id);
    await excluirLocalizacao(c, "POSICAO", p1.id);
  });
});
