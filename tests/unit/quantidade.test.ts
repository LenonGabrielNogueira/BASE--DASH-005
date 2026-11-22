import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { validarQuantidade } from "@/lib/quantidade";

describe("quantidade", () => {
  it("mantém precisão decimal e aceita vírgula", () => {
    expect(validarQuantidade("999999999,999", "KG")).toBeInstanceOf(
      Prisma.Decimal,
    );
    expect(validarQuantidade("0,123", "KG").toFixed()).toBe("0.123");
    expect(validarQuantidade("12.000", "UN").toFixed()).toBe("12");
    expect(() => validarQuantidade("1.001", "UN")).toThrow("inteira");
  });
  it.each(["0", "-1", "NaN", "1e3", "0.0001", "1000000000"])(
    "rejeita %s",
    (valor) => {
      expect(() => validarQuantidade(valor, "KG")).toThrow();
    },
  );
});
