import { expect, it } from "vitest";
import {
  gerarCodigoLocalizacao,
  validarCodigoSecao,
} from "@/lib/codigo-localizacao";
it("gera códigos da hierarquia e não trunca números maiores", () => {
  expect(gerarCodigoLocalizacao("A", "MODULO", 1)).toBe("A-01");
  expect(gerarCodigoLocalizacao("A-01", "PRATELEIRA", 2)).toBe("A-01-P2");
  expect(gerarCodigoLocalizacao("A-01-P2", "POSICAO", 3)).toBe("A-01-P2-03");
  expect(gerarCodigoLocalizacao("A", "MODULO", 101)).toBe("A-101");
});
it("valida código de seção e sequência positiva", () => {
  for (const s of ["A", "A123", "1234567890"])
    expect(validarCodigoSecao(s)).toBe(true);
  for (const s of ["", "a", "A-B", "ABCDEF12345"])
    expect(validarCodigoSecao(s)).toBe(false);
  expect(() => gerarCodigoLocalizacao("A", "MODULO", 0)).toThrow();
});
