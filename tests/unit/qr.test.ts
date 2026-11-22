import { expect, it } from "vitest";
import { gerarTokenQr, urlQr } from "@/lib/qr";
it("gera tokens aleatórios de 128 bits com alfabeto base64url", () => {
  const tokens = Array.from({ length: 100 }, gerarTokenQr);
  expect(new Set(tokens).size).toBe(100);
  for (const token of tokens) {
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(16);
  }
});
it("monta URL do QR sem duplicar barras e rejeita protocolo inválido", () => {
  expect(urlQr("abc", "https://inventario.example/")).toBe(
    "https://inventario.example/q/abc",
  );
  expect(() => urlQr("abc", "javascript:alert(1)")).toThrow();
});
