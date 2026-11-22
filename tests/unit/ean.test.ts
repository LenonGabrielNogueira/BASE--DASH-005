import { describe, expect, it } from "vitest";
import { validarEan, digitoVerificador } from "@/lib/ean";
import { codigoBarrasSchema } from "@/lib/validacao/codigo-barras";
describe("Dígitos verificadores", () => {
  it.each([
    ["7894900011517", "EAN13"],
    ["96385074", "EAN8"],
    ["036000291452", "UPC"],
  ] as const)("%s é válido", (codigo, tipo) =>
    expect(validarEan(codigo, tipo)).toBe(true),
  );
  it.each([
    ["7894900011518", "EAN13"],
    ["96385075", "EAN8"],
    ["036000291453", "UPC"],
    ["123", "EAN13"],
    ["abcdefgh", "EAN8"],
  ] as const)("rejeita %s", (codigo, tipo) =>
    expect(validarEan(codigo, tipo)).toBe(false),
  );
  it("gera um dígito válido", () =>
    expect(digitoVerificador("789490001151")).toBe("7"));
  it("valida e normaliza códigos livres", () => {
    expect(
      codigoBarrasSchema.parse({ codigo: " ABC ", tipo: "CODE128" }).codigo,
    ).toBe("ABC");
    expect(
      codigoBarrasSchema.safeParse({ codigo: " ", tipo: "OUTRO" }).success,
    ).toBe(false);
    expect(
      codigoBarrasSchema.safeParse({ codigo: "a".repeat(65), tipo: "OUTRO" })
        .success,
    ).toBe(false);
  });
});
