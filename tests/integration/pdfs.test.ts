import { criarContextoUnidade, limpar, temBanco } from "./apoio";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { ContextoUnidade } from "@/types";
import { salvarLocalizacao } from "@/server/services/localizacoes";
import { alterarQr, dadosFicha } from "@/server/services/qrcodes";
import { gerarEtiquetas, gerarFicha } from "@/server/services/pdfs";
import { prepararEstoque } from "./apoio-estoque";
describe.skipIf(!temBanco)("PDFs com autorização e dados reais", () => {
  let c: ContextoUnidade;
  let b: ContextoUnidade;
  beforeAll(async () => {
    c = await criarContextoUnidade();
    b = await criarContextoUnidade();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://inventario.example");
  });
  afterAll(async () => {
    if (c) await limpar(c);
    if (b) await limpar(b);
    vi.unstubAllEnvs();
  });
  it("gera A4, térmica e ficha para papel de leitura; recusa outra empresa e limite excedido", async () => {
    const secao = await salvarLocalizacao(c, {
      tipo: "SECAO",
      codigo: "A",
      nome: "Seção de impressão",
    });
    const qr = await alterarQr(c, "SECAO", secao.id, "gerar");
    const leitor = { ...c, papel: "ESTOQUISTA" as const };
    for (const formato of ["A4", "TERMICA"]) {
      const pdf = await gerarEtiquetas(leitor, { ids: [qr.id], formato });
      expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    }
    expect(
      (await gerarFicha(leitor, "SECAO", secao.id)).subarray(0, 4).toString(),
    ).toBe("%PDF");
    await expect(
      gerarEtiquetas(b, { ids: [qr.id], formato: "A4" }),
    ).rejects.toThrow();
    await expect(gerarFicha(b, "SECAO", secao.id)).rejects.toThrow();
    await expect(
      gerarEtiquetas(c, { ids: Array(201).fill(qr.id), formato: "A4" }),
    ).rejects.toThrow();
  }, 30000);

  it("leva a quantidade da posição à ficha", async () => {
    const { a, c: estoque, lancar } = await prepararEstoque();
    try {
      await alterarQr(estoque, "POSICAO", a.id, "gerar");
      await lancar({
        tipo: "ENTRADA",
        quantidade: "8",
        posicaoDestinoId: a.id,
      });
      const dados = await dadosFicha(estoque, "POSICAO", a.id);
      expect(dados.itens[0].posicoes[0].quantidade).toBe("8");
      expect(
        (await gerarFicha(estoque, "POSICAO", a.id)).subarray(0, 4).toString(),
      ).toBe("%PDF");
    } finally {
      await limpar(estoque);
    }
  }, 30000);
});
