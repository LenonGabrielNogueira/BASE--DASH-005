import { expect, it } from "vitest";
import { gerarCodigoInterno } from "@/lib/codigo-interno";
import type { Prisma } from "@prisma/client";
// Simula apenas o incremento atômico; concorrência real é verificada em itens.test.ts.
function contador() {
  let proximo = 1;
  return {
    empresa: { update: async () => ({ proxCodigo: ++proximo }) },
  } as unknown as Pick<Prisma.TransactionClient, "empresa">;
}
it("gera sequência com seis dígitos", async () => {
  const tx = contador();
  expect(await gerarCodigoInterno(tx, "empresa")).toBe("000001");
  expect(await gerarCodigoInterno(tx, "empresa")).toBe("000002");
});
it("50 chamadas paralelas sem duplicata", async () => {
  const tx = contador();
  const codigos = await Promise.all(
    Array.from({ length: 50 }, () => gerarCodigoInterno(tx, "empresa")),
  );
  expect(new Set(codigos).size).toBe(50);
  expect(codigos.at(-1)).toBe("000050");
});
