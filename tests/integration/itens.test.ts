import { criarContexto, limpar, temBanco, dadosItem } from "./apoio";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  salvarItem,
  obterItem,
  listarItens,
  excluirItem,
} from "@/server/services/itens";
import {
  salvarCategoria,
  excluirCategoria,
  listarCategorias,
} from "@/server/services/categorias";
import { prisma } from "@/server/db";
import {
  salvarCodigoBarras,
  excluirCodigoBarras,
} from "@/server/services/codigos-barras";
import type { Contexto } from "@/types";
describe.skipIf(!temBanco)("Itens no PostgreSQL real", () => {
  let c: Contexto;
  beforeAll(async () => {
    c = await criarContexto();
  });
  afterAll(async () => {
    if (c) await limpar(c);
  });
  it("CRUD, código imutável, soft delete e categoria com itens ativos", async () => {
    const categoria = await salvarCategoria(c, { nome: "Ferramentas" });
    const item = await salvarItem(c, {
      ...dadosItem("Martelo"),
      categoriaId: categoria.id,
    });
    expect(item.codigoInterno).toMatch(/^\d{6}$/);
    expect((await obterItem(c, item.id)).nome).toBe("Martelo");
    await expect(excluirCategoria(c, categoria.id)).rejects.toThrow(
      "1 item(ns)",
    );
    const atualizado = await salvarItem(
      c,
      { ...dadosItem("Martelo novo"), categoriaId: categoria.id },
      item.id,
    );
    expect(atualizado.codigoInterno).toBe(item.codigoInterno);
    await excluirItem(c, item.id);
    await expect(obterItem(c, item.id)).rejects.toThrow();
    expect(
      (await listarItens(c, { pagina: 1, ordem: "nome", q: "Martelo" })).total,
    ).toBe(0);
    expect(
      (
        await prisma.item.findFirst({
          where: { id: item.id, empresaId: c.empresaId },
        })
      )?.deletadoEm,
    ).not.toBeNull();
    await excluirCategoria(c, categoria.id);
    expect(await listarCategorias(c)).toHaveLength(0);
    expect((await salvarCategoria(c, { nome: "Ferramentas" })).id).toBe(
      categoria.id,
    );
  });
  it("1.000 criações simultâneas sem repetir códigos", async () => {
    const itens = await Promise.all(
      Array.from({ length: 1000 }, (_, n) =>
        salvarItem(c, dadosItem(`Paralelo ${n}`)),
      ),
    );
    expect(new Set(itens.map((i) => i.codigoInterno)).size).toBe(1000);
    const codigos = itens
      .map((i) => Number(i.codigoInterno))
      .sort((a, b) => a - b);
    expect(codigos.at(-1)! - codigos[0]).toBe(999);
  }, 180000);
  it("estorno da transação não consome código e leitura é permitida ao estoquista", async () => {
    const antes = await prisma.empresa.findUniqueOrThrow({
      where: { id: c.empresaId },
    });
    await expect(
      salvarItem(c, { ...dadosItem("Inválido"), categoriaId: "inexistente" }),
    ).rejects.toThrow();
    const depois = await prisma.empresa.findUniqueOrThrow({
      where: { id: c.empresaId },
    });
    expect(depois.proxCodigo).toBe(antes.proxCodigo);
    await expect(
      listarItens(
        { ...c, papel: "ESTOQUISTA" },
        { pagina: 1, ordem: "nome", q: "" },
      ),
    ).resolves.toHaveProperty("total");
  });
  it("vários códigos por item, unicidade por empresa, edição e exclusão física", async () => {
    const item = await salvarItem(c, dadosItem("Leitor"));
    const codigo = await salvarCodigoBarras(c, item.id, {
      codigo: "7894900011517",
      tipo: "EAN13",
    });
    await salvarCodigoBarras(c, item.id, {
      codigo: "INTERNO-LIVRE",
      tipo: "CODE128",
    });
    await expect(
      salvarCodigoBarras(c, item.id, {
        codigo: "7894900011517",
        tipo: "EAN13",
      }),
    ).rejects.toThrow();
    await expect(
      salvarCodigoBarras(c, item.id, {
        codigo: "7894900011518",
        tipo: "EAN13",
      }),
    ).rejects.toThrow();
    await salvarCodigoBarras(
      c,
      item.id,
      { codigo: "ALTERADO", tipo: "OUTRO" },
      codigo!.id,
    );
    expect((await obterItem(c, item.id)).codigosBarras).toHaveLength(2);
    await expect(
      excluirCodigoBarras({ ...c, papel: "ESTOQUISTA" }, codigo!.id),
    ).rejects.toThrow();
    await excluirCodigoBarras(c, codigo!.id);
    expect(
      await prisma.codigoBarras.findFirst({
        where: { id: codigo!.id, empresaId: c.empresaId },
      }),
    ).toBeNull();
  });
});
