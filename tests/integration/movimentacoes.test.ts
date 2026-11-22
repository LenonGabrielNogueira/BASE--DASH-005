import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarContextoUnidade, limpar, temBanco } from "./apoio";
import { prepararEstoque } from "./apoio-estoque";
import { prisma } from "@/server/db";
import { removerAlocacao } from "@/server/services/alocacoes";
import { excluirItem } from "@/server/services/itens";
import { ConflitoDeDados } from "@/lib/erros";
import { registrarMovimentacao } from "@/server/services/movimentacoes";
import { excluirLocalizacao } from "@/server/services/localizacoes";

describe.skipIf(!temBanco)("movimentações", () => {
  let f: Awaited<ReturnType<typeof prepararEstoque>>;
  beforeEach(async () => {
    f = await prepararEstoque();
  });
  afterEach(async () => {
    if (f) await limpar(f.c);
  });

  it("registra as pernas, cria alocação e bloqueia exclusões com saldo", async () => {
    const { c, a, b, item, lancar } = f;
    await lancar({ tipo: "ENTRADA", quantidade: "10", posicaoDestinoId: a.id });
    const alocacao = await prisma.itemPosicao.findFirstOrThrow({
      where: { itemId: item.id, posicaoId: a.id },
    });
    await expect(removerAlocacao(c, alocacao.id)).rejects.toBeInstanceOf(
      ConflitoDeDados,
    );
    await expect(excluirItem(c, item.id)).rejects.toThrow(a.codigo);
    await expect(excluirLocalizacao(c, "POSICAO", a.id)).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      lancar({ tipo: "SAIDA", quantidade: "11", posicaoOrigemId: a.id }),
    ).rejects.toThrow("Saldo atual: 10");
    expect(
      await prisma.movimentacao.count({ where: { empresaId: c.empresaId } }),
    ).toBe(1);
    const t = await lancar({
      tipo: "TRANSFERENCIA",
      quantidade: "4",
      posicaoOrigemId: a.id,
      posicaoDestinoId: b.id,
    });
    expect(t.saldoOrigemApos?.toFixed()).toBe("6");
    expect(t.saldoDestinoApos?.toFixed()).toBe("4");
    await lancar({ tipo: "SAIDA", quantidade: "6", posicaoOrigemId: a.id });
    await lancar({
      tipo: "AJUSTE_POSITIVO",
      quantidade: "1",
      posicaoDestinoId: b.id,
      justificativa: "Acerto autorizado",
    });
    await lancar({
      tipo: "AJUSTE_NEGATIVO",
      quantidade: "5",
      posicaoOrigemId: b.id,
      justificativa: "Acerto autorizado",
    });
    expect(await prisma.itemPosicao.count({ where: { itemId: item.id } })).toBe(
      2,
    );
    await removerAlocacao(c, alocacao.id);
    await excluirItem(c, item.id);
    expect(
      await prisma.movimentacao.count({ where: { itemId: item.id } }),
    ).toBe(5);
  });

  it("confere saldo de todas as unidades antes de excluir o item", async () => {
    const outra = await criarContextoUnidade(f.c);
    await prisma.unidade.update({
      where: { id: outra.unidadeId },
      data: { nome: "Unidade secundária" },
    });
    await registrarMovimentacao(outra, {
      tipo: "ENTRADA",
      quantidade: "1",
      itemId: f.item.id,
      chaveIdempotencia: randomUUID(),
    });
    await expect(excluirItem(f.c, f.item.id)).rejects.toThrow(
      "Unidade secundária · Sem posição",
    );
  });

  it("reverte a primeira perna quando o débito da segunda perna falha", async () => {
    const { b, lancar, saldos } = f;
    await expect(
      lancar({
        tipo: "TRANSFERENCIA",
        quantidade: "1",
        posicaoOrigemId: b.id,
        posicaoDestinoId: null,
      }),
    ).rejects.toThrow(b.codigo);
    expect(await saldos()).toHaveLength(0);
    expect(
      await prisma.movimentacao.count({ where: { empresaId: f.c.empresaId } }),
    ).toBe(0);
  });

  it("o banco rejeita saldo negativo, balde sem posição duplicado e lançamentos inválidos", async () => {
    const { c, item, lancar } = f;
    const base = {
      empresaId: c.empresaId,
      unidadeId: c.unidadeId,
      itemId: item.id,
    };
    await expect(
      prisma.saldo.create({ data: { ...base, quantidade: "-1" } }),
    ).rejects.toThrow("Saldo_quantidade_nao_negativa");
    await lancar({ tipo: "ENTRADA", quantidade: "1" });
    await expect(prisma.saldo.create({ data: base })).rejects.toMatchObject({
      code: "P2002",
    });
    const invalidos = [
      { tipo: "ENTRADA", quantidade: "0" },
      { tipo: "QUEBRA", quantidade: "1" },
      { tipo: "ESTORNO", quantidade: "1", justificativa: "Sem original aqui" },
      { tipo: "AJUSTE_NEGATIVO", quantidade: "1" },
      { tipo: "AJUSTE_POSITIVO", quantidade: "1", justificativa: "  " },
      { tipo: "TRANSFERENCIA", quantidade: "1" },
    ] as const;
    for (const invalido of invalidos)
      await expect(
        prisma.movimentacao.create({
          data: {
            ...base,
            ...invalido,
            usuarioId: c.usuarioId,
            chaveIdempotencia: randomUUID(),
          },
        }),
      ).rejects.toThrow(
        /Movimentacao_(quantidade|quebra|estorno|justificativa|transferencia)/,
      );
  });
});
