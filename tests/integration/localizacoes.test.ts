import { criarContextoUnidade, limpar, temBanco } from "./apoio";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { ContextoUnidade } from "@/types";
import {
  salvarLocalizacao,
  obterLocalizacao,
  excluirLocalizacao,
  listarNivel,
  criarEmLote,
} from "@/server/services/localizacoes";
import { prisma } from "@/server/db";
export async function estrutura(c: ContextoUnidade, codigo = "A") {
  const secao = await salvarLocalizacao(c, {
    tipo: "SECAO",
    codigo,
    nome: "Seção",
  });
  const modulo = await salvarLocalizacao(c, {
    tipo: "MODULO",
    paiId: secao.id,
  });
  const prateleira = await salvarLocalizacao(c, {
    tipo: "PRATELEIRA",
    paiId: modulo.id,
  });
  const posicao = await salvarLocalizacao(c, {
    tipo: "POSICAO",
    paiId: prateleira.id,
  });
  return { secao, modulo, prateleira, posicao };
}
describe.skipIf(!temBanco)("Localizações no PostgreSQL", () => {
  let c: ContextoUnidade;
  beforeAll(async () => {
    c = await criarContextoUnidade();
  });
  afterAll(async () => {
    if (c) await limpar(c);
  });
  it("CRUD dos quatro níveis, imutabilidade e bloqueio por filhos", async () => {
    const e = await estrutura(c);
    expect([e.modulo.codigo, e.prateleira.codigo, e.posicao.codigo]).toEqual([
      "A-01",
      "A-01-P1",
      "A-01-P1-01",
    ]);
    for (const l of Object.values(e)) {
      const r = await salvarLocalizacao(c, {
        tipo: l.tipo,
        id: l.id,
        nome: "Alterado",
        descricao: "Descrição",
      });
      expect(r.codigo).toBe(l.codigo);
      expect((await obterLocalizacao(c, l.tipo, l.id)).id).toBe(l.id);
    }
    for (const l of [e.secao, e.modulo, e.prateleira])
      await expect(excluirLocalizacao(c, l.tipo, l.id)).rejects.toThrow(
        "1 localização",
      );
    for (const l of [e.posicao, e.prateleira, e.modulo, e.secao]) {
      await excluirLocalizacao(c, l.tipo, l.id);
      await expect(obterLocalizacao(c, l.tipo, l.id)).rejects.toThrow();
    }
    await expect(
      salvarLocalizacao(c, { tipo: "SECAO", codigo: "A", nome: "Reusar" }),
    ).rejects.toThrow("já utilizado");
  });
  it("não reutiliza ordens excluídas e cria 50 posições em paralelo", async () => {
    const e = await estrutura(c, "B");
    await excluirLocalizacao(c, "POSICAO", e.posicao.id);
    const proxima = await salvarLocalizacao(c, {
      tipo: "POSICAO",
      paiId: e.prateleira.id,
    });
    expect(proxima.codigo).toBe("B-01-P1-02");
    const criadas = await Promise.all(
      Array.from({ length: 50 }, () =>
        salvarLocalizacao(c, { tipo: "POSICAO", paiId: e.prateleira.id }),
      ),
    );
    expect(new Set(criadas.map((p) => p.codigo)).size).toBe(50);
  });
  it("lote respeita limite, é atômico em falha no meio e cria a estrutura completa", async () => {
    const e = await estrutura(c, "C");
    const where = { empresaId: c.empresaId, unidadeId: c.unidadeId };
    const antes = await prisma.prateleira.count({ where });
    await expect(
      criarEmLote(c, { moduloId: e.modulo.id, prateleiras: 21, posicoes: 1 }),
    ).rejects.toThrow();
    // Uma posição órfã de código legado provoca violação única após criar a primeira prateleira do lote.
    await prisma.posicao.create({
      data: {
        ...where,
        prateleiraId: e.prateleira.id,
        codigo: "C-01-P2-01",
        ordem: 99,
      },
    });
    await expect(
      criarEmLote(c, { moduloId: e.modulo.id, prateleiras: 2, posicoes: 2 }),
    ).rejects.toThrow();
    expect(await prisma.prateleira.count({ where })).toBe(antes);
    await prisma.posicao.deleteMany({
      where: { ...where, codigo: "C-01-P2-01" },
    });
    const lote = await criarEmLote(c, {
      moduloId: e.modulo.id,
      prateleiras: 2,
      posicoes: 3,
    });
    expect(lote).toHaveLength(2);
    expect(await listarNivel(c, "POSICAO", lote[0].id)).toHaveLength(3);
  });
});
