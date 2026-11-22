import { criarContexto, limpar, temBanco, dadosItem } from "./apoio";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { prepararEstoque } from "./apoio-estoque";
import { listarEstoque, saldosDoItem } from "@/server/services/saldos";
import {
  listarMovimentacoes,
  obterMovimentacao,
  registrarMovimentacao,
} from "@/server/services/movimentacoes";
import {
  listarMotivosQuebra,
  salvarMotivoQuebra,
} from "@/server/services/motivos-quebra";
import { obterFotoAvaria } from "@/server/services/imagekit";
import {
  salvarCategoria,
  listarCategorias,
  obterCategoria,
  excluirCategoria,
} from "@/server/services/categorias";
import {
  salvarItem,
  obterItem,
  listarItens,
  excluirItem,
} from "@/server/services/itens";
import {
  salvarCodigoBarras,
  excluirCodigoBarras,
} from "@/server/services/codigos-barras";
import { salvarUnidade, listarUnidades } from "@/server/services/unidades";
import { buscar } from "@/server/services/busca";
import type { Contexto } from "@/types";
import type { ContextoUnidade } from "@/types";
import { criarContextoUnidade } from "./apoio";
import {
  salvarLocalizacao,
  obterLocalizacao,
  excluirLocalizacao,
  listarNivel,
} from "@/server/services/localizacoes";
import {
  alocarItem,
  removerAlocacao,
  conteudoLocalizacao,
} from "@/server/services/alocacoes";
import {
  alterarQr,
  resolverToken,
  gerarImagemQr,
  obterQr,
} from "@/server/services/qrcodes";
import { buscarLocalizacoes } from "@/server/services/busca";
describe.skipIf(!temBanco)("Isolamento da Fase 2", () => {
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
  it("B não lê, altera, exclui, aloca ou resolve qualquer entidade de A", async () => {
    const s = await salvarLocalizacao(a, {
      tipo: "SECAO",
      codigo: "PRIVADO",
      nome: "SegredoNovaEntidade",
    });
    const m = await salvarLocalizacao(a, { tipo: "MODULO", paiId: s.id });
    const p = await salvarLocalizacao(a, { tipo: "PRATELEIRA", paiId: m.id });
    const pos = await salvarLocalizacao(a, { tipo: "POSICAO", paiId: p.id });
    for (const l of [s, m, p, pos]) {
      await expect(obterLocalizacao(b, l.tipo, l.id)).rejects.toThrow();
      await expect(
        salvarLocalizacao(b, { tipo: l.tipo, id: l.id, nome: "Ataque" }),
      ).rejects.toThrow();
      await expect(excluirLocalizacao(b, l.tipo, l.id)).rejects.toThrow();
      await expect(alterarQr(b, l.tipo, l.id, "gerar")).rejects.toThrow();
    }
    await expect(
      salvarLocalizacao(b, { tipo: "MODULO", paiId: s.id }),
    ).rejects.toThrow();
    expect(await listarNivel(b, "SECAO")).toHaveLength(0);
    expect(await buscarLocalizacoes(b, "SegredoNovaEntidade")).toHaveLength(0);
    const item = await salvarItem(a, dadosItem("Item privado"));
    const alocacao = await alocarItem(a, {
      itemId: item.id,
      posicaoId: pos.id,
    });
    await expect(
      alocarItem(b, { itemId: item.id, posicaoId: pos.id }),
    ).rejects.toThrow();
    await expect(removerAlocacao(b, alocacao.id)).rejects.toThrow();
    await expect(conteudoLocalizacao(b, "POSICAO", pos.id)).rejects.toThrow();
    const qr = await alterarQr(a, "SECAO", s.id, "gerar");
    await expect(resolverToken(b, qr.token)).rejects.toThrow();
    await expect(obterQr(b, qr.id)).rejects.toThrow();
    await expect(gerarImagemQr(b, qr.id, "png")).rejects.toThrow();
    await expect(alterarQr(b, "SECAO", s.id, "regenerar")).rejects.toThrow();
    await expect(alterarQr(b, "SECAO", s.id, "deletar")).rejects.toThrow();
    const outraUnidade = await criarContextoUnidade(a);
    expect(await listarNivel(outraUnidade, "SECAO")).toHaveLength(0);
    await expect(obterQr(outraUnidade, qr.id)).rejects.toThrow();
    expect(
      (await resolverToken(outraUnidade, qr.token)).contexto.unidadeId,
    ).toBe(a.unidadeId);
    const estoquista = { ...a, papel: "ESTOQUISTA" as const };
    await expect(
      salvarLocalizacao(estoquista, {
        tipo: "SECAO",
        codigo: "X",
        nome: "Bloqueada",
      }),
    ).rejects.toThrow();
    await expect(
      alocarItem(estoquista, { itemId: item.id, posicaoId: pos.id }),
    ).rejects.toThrow();
    await expect(
      alterarQr(estoquista, "SECAO", s.id, "regenerar"),
    ).rejects.toThrow();
  });
});
describe.skipIf(!temBanco)("Isolamento por empresa", () => {
  let a: Contexto;
  let b: Contexto;
  beforeAll(async () => {
    a = await criarContexto();
    b = await criarContexto();
  });
  afterAll(async () => {
    if (a) await limpar(a);
    if (b) await limpar(b);
  });
  it("A nunca lê nem altera categorias, itens, códigos e unidades de B", async () => {
    const categoria = await salvarCategoria(b, { nome: "Segredo" });
    const item = await salvarItem(b, {
      ...dadosItem("Segredo"),
      categoriaId: categoria.id,
    });
    const codigo = await salvarCodigoBarras(b, item.id, {
      codigo: "SEGREDO",
      tipo: "OUTRO",
    });
    expect(await listarCategorias(a)).toHaveLength(0);
    await expect(obterCategoria(a, categoria.id)).rejects.toThrow();
    await expect(
      salvarCategoria(a, { nome: "Ataque" }, categoria.id),
    ).rejects.toThrow();
    await expect(excluirCategoria(a, categoria.id)).rejects.toThrow();
    expect(
      (await listarItens(a, { pagina: 1, q: "", ordem: "nome" })).total,
    ).toBe(0);
    await expect(obterItem(a, item.id)).rejects.toThrow();
    await expect(excluirItem(a, item.id)).rejects.toThrow();
    await expect(salvarItem(a, dadosItem("Ataque"), item.id)).rejects.toThrow();
    await expect(
      salvarItem(a, { ...dadosItem("Ataque"), categoriaId: categoria.id }),
    ).rejects.toThrow();
    await expect(
      salvarCodigoBarras(a, item.id, { codigo: "ATAQUE", tipo: "OUTRO" }),
    ).rejects.toThrow();
    await expect(
      salvarCodigoBarras(
        a,
        item.id,
        { codigo: "ATAQUE", tipo: "OUTRO" },
        codigo!.id,
      ),
    ).rejects.toThrow();
    await expect(excluirCodigoBarras(a, codigo!.id)).rejects.toThrow();
    for (const q of ["Segredo", "SEGREDO", item.codigoInterno])
      expect(await buscar(a, q)).toHaveLength(0);
    await salvarUnidade(b, { nome: "Filial B", ativa: true });
    expect(await listarUnidades(a)).toHaveLength(0);
    expect((await obterItem(b, item.id)).codigosBarras[0].codigo).toBe(
      "SEGREDO",
    );
  });
  it("estoquista só lê; gerente pode cadastrar", async () => {
    const c = { ...a, papel: "ESTOQUISTA" as const };
    await expect(salvarCategoria(c, { nome: "Bloqueado" })).rejects.toThrow();
    await expect(salvarItem(c, dadosItem("Bloqueado"))).rejects.toThrow();
    await expect(
      salvarUnidade(c, { nome: "Bloqueada", ativa: true }),
    ).rejects.toThrow();
    await expect(
      salvarCategoria({ ...a, papel: "GERENTE" }, { nome: "Permitido" }),
    ).resolves.toHaveProperty("id");
  });
});

it.skipIf(!temBanco)(
  "isola estoque, histórico, quebra, fotos e idempotência por empresa e unidade",
  async () => {
    const a = await prepararEstoque();
    const b = await prepararEstoque();
    try {
      const chaveIdempotencia = randomUUID();
      const entradaA = await a.lancar({
        tipo: "ENTRADA",
        quantidade: "8",
        posicaoDestinoId: a.a.id,
        chaveIdempotencia,
      });
      const motivo = await salvarMotivoQuebra(a.c, {
        nome: "Motivo exclusivo da empresa A",
        ativo: true,
      });
      if (!motivo)
        throw new Error("O motivo de teste deveria ter sido criado.");
      const quebra = await a.lancar({
        tipo: "QUEBRA",
        quantidade: "1",
        posicaoOrigemId: a.a.id,
        motivoQuebraId: motivo.id,
      });
      const foto = await prisma.avariaFoto.create({
        data: {
          movimentacaoId: quebra.id,
          empresaId: a.c.empresaId,
          fileId: "foto-teste",
          url: "https://example.test/foto.jpg",
        },
      });
      expect(await listarEstoque(b.c, { comSaldo: true })).toEqual([]);
      expect((await listarMovimentacoes(b.c)).total).toBe(0);
      expect(await buscar(a.c, "Mercadoria", false, a.c)).toEqual([
        expect.objectContaining({ saldo: "7" }),
      ]);
      expect(await buscar(b.c, "Mercadoria", false, b.c)).toEqual([
        expect.objectContaining({ saldo: "0" }),
      ]);
      expect(
        (await listarMotivosQuebra(b.c)).some((m) => m.nome === motivo.nome),
      ).toBe(false);
      await expect(saldosDoItem(b.c, a.item.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(obterMovimentacao(b.c, entradaA.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(obterFotoAvaria(b.c, foto.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(obterFotoAvaria(a.c, foto.id)).resolves.toHaveProperty(
        "fileId",
        foto.fileId,
      );
      const movimento = {
        tipo: "ENTRADA" as const,
        quantidade: "1",
        chaveIdempotencia,
        itemId: a.item.id,
      };
      await expect(registrarMovimentacao(b.c, movimento)).rejects.toMatchObject(
        { status: 404 },
      );
      await expect(
        b.lancar({
          tipo: "ENTRADA",
          quantidade: "1",
          posicaoDestinoId: a.a.id,
          chaveIdempotencia,
        }),
      ).rejects.toMatchObject({ status: 404 });
      const entradaB = await b.lancar({
        tipo: "ENTRADA",
        quantidade: "1",
        chaveIdempotencia,
      });
      expect(entradaB.id).not.toBe(entradaA.id);
      const outra = await criarContextoUnidade(a.c);
      await expect(obterFotoAvaria(outra, foto.id)).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        registrarMovimentacao(outra, {
          ...movimento,
          chaveIdempotencia: randomUUID(),
          posicaoDestinoId: a.a.id,
        }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        registrarMovimentacao(outra, movimento),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        registrarMovimentacao(outra, {
          tipo: "ESTORNO",
          estornoDeId: entradaA.id,
          chaveIdempotencia: randomUUID(),
          justificativa: "Correção autorizada",
        }),
      ).rejects.toMatchObject({ status: 404 });
    } finally {
      await limpar(a.c);
      await limpar(b.c);
    }
  },
);
