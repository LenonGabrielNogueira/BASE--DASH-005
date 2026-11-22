import { expect, it } from "vitest";
import { ladosMovimentacao, tiposLancamento } from "@/lib/movimentacao-regras";

it("aplica os lados de cada tipo e inverte no estorno", () => {
  const esperados = [
    [false, true],
    [true, false],
    [true, false],
    [true, true],
    [false, true],
    [true, false],
  ];
  tiposLancamento.forEach((tipo, indice) => {
    const [origem, destino] = esperados[indice];
    expect(ladosMovimentacao(tipo)).toEqual({ origem, destino });
    expect(ladosMovimentacao("ESTORNO", tipo)).toEqual({
      origem: destino,
      destino: origem,
    });
  });
});
