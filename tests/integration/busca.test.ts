import { criarContexto, limpar, temBanco, dadosItem } from "./apoio";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { salvarItem, excluirItem } from "@/server/services/itens";
import { salvarCodigoBarras } from "@/server/services/codigos-barras";
import { buscar } from "@/server/services/busca";
import type { Contexto } from "@/types";
import { criarContextoUnidade } from "./apoio";
import { salvarLocalizacao } from "@/server/services/localizacoes";
import { buscarLocalizacoes } from "@/server/services/busca";
describe.skipIf(!temBanco)("Busca global", () => {
  let c: Contexto;
  it("localizações: código exato primeiro, limite de 20, escopo da unidade e scanner sem busca por nome", async () => {
    const unidade = await criarContextoUnidade(c);
    const exata = await salvarLocalizacao(unidade, {
      tipo: "SECAO",
      codigo: "ZZ",
      nome: "Destino exato",
    });
    for (let n = 0; n < 25; n++)
      await salvarLocalizacao(unidade, {
        tipo: "SECAO",
        codigo: `N${n}`,
        nome: "Nome contém ZZ",
      });
    const resultados = await buscarLocalizacoes(unidade, "zz");
    expect(resultados).toHaveLength(20);
    expect(resultados[0].id).toBe(exata.id);
    const outra = await criarContextoUnidade(c);
    expect(await buscarLocalizacoes(outra, "ZZ")).toHaveLength(0);
    expect(await buscar(c, "Nome contém ZZ", true)).toHaveLength(0);
  });
  beforeAll(async () => {
    c = await criarContexto();
  });
  afterAll(async () => {
    if (c) await limpar(c);
  });
  it("prioriza barras, código interno e nome, sem duplicatas", async () => {
    const interno = await salvarItem(c, dadosItem("Item interno"));
    const barras = await salvarItem(c, dadosItem("Item barras"));
    const nome = await salvarItem(
      c,
      dadosItem(`Nome ${interno.codigoInterno}`),
    );
    await salvarCodigoBarras(c, barras.id, {
      codigo: interno.codigoInterno,
      tipo: "OUTRO",
    });
    expect((await buscar(c, interno.codigoInterno)).map((i) => i.id)).toEqual([
      barras.id,
      interno.id,
      nome.id,
    ]);
    await excluirItem(c, barras.id);
    expect((await buscar(c, interno.codigoInterno))[0].id).toBe(interno.id);
  });
  it("ignora caixa, limita em 20 e consulta aquecida leva menos de 300ms", async () => {
    await Promise.all(
      Array.from({ length: 25 }, (_, n) =>
        salvarItem(c, dadosItem(`Pesquisa ${n}`)),
      ),
    );
    await buscar(c, "PESQUISA");
    const inicio = performance.now();
    const resultado = await buscar(c, "PESQUISA");
    expect(resultado).toHaveLength(20);
    expect(performance.now() - inicio).toBeLessThan(300);
    expect(await buscar(c, "   ")).toHaveLength(0);
  });
});
