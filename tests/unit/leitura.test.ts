import { expect, it } from "vitest";
import { interpretarLeitura } from "@/lib/leitura";
const token = "a".repeat(22);
it("aceita somente URL de QR da origem configurada", () => {
  expect(
    interpretarLeitura(
      `https://inventario.example/q/${token}`,
      "https://inventario.example",
    ),
  ).toEqual({ tipo: "QR", destino: `/q/${token}` });
  for (const valor of [
    `https://outra.example/q/${token}`,
    "javascript:alert(1)",
    "https://inventario.example/empresas",
    "LOTE:123",
  ])
    expect(interpretarLeitura(valor, "https://inventario.example")?.tipo).toBe(
      "ITEM",
    );
  expect(interpretarLeitura("", "https://inventario.example")).toBeNull();
});
it("preserva códigos internos e barras para consulta exata", () => {
  expect(interpretarLeitura(" 000123 ", "http://localhost:3000")).toEqual({
    tipo: "ITEM",
    codigo: "000123",
  });
  expect(
    interpretarLeitura("7894900011517", "http://localhost:3000")?.tipo,
  ).toBe("ITEM");
});
