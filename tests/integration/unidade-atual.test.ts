import { criarContextoUnidade, limpar, temBanco } from "./apoio";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { ContextoUnidade } from "@/types";
const estado = vi.hoisted(() => ({ cookie: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (estado.cookie ? { value: estado.cookie } : undefined),
  }),
}));
import { getUnidadeAtual } from "@/server/unidade-atual";
describe.skipIf(!temBanco)("Cookie da unidade atual", () => {
  let a: ContextoUnidade;
  let b: ContextoUnidade;
  beforeAll(async () => {
    a = await criarContextoUnidade();
    b = await criarContextoUnidade();
  });
  afterAll(async () => {
    if (a) await limpar(a);
    if (b) await limpar(b);
  });
  it("rejeita unidade de outra empresa no cookie e usa somente unidade da empresa quando ausente", async () => {
    estado.cookie = b.unidadeId;
    await expect(getUnidadeAtual(a)).rejects.toThrow(
      "unidade ativa da sua empresa",
    );
    estado.cookie = a.unidadeId;
    expect((await getUnidadeAtual(a))?.unidadeId).toBe(a.unidadeId);
    estado.cookie = undefined;
    expect((await getUnidadeAtual(a))?.unidadeId).toBe(a.unidadeId);
  });
});
