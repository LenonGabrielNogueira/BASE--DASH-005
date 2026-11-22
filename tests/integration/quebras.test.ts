import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { pastaAvarias, prefixoFoto } from "@/server/services/imagekit";
import { criarContexto, limpar, temBanco } from "./apoio";
import { prepararEstoque } from "./apoio-estoque";
import {
  excluirMotivoQuebra,
  garantirMotivosPadrao,
  listarMotivosQuebra,
  salvarMotivoQuebra,
} from "@/server/services/motivos-quebra";
import { obterMovimentacao } from "@/server/services/movimentacoes";

describe.skipIf(!temBanco)("motivos e quebras", () => {
  let f: Awaited<ReturnType<typeof prepararEstoque>>;
  beforeEach(async () => {
    f = await prepararEstoque();
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    if (f) await limpar(f.c);
  });

  it("exige motivo ativo da empresa e preserva o motivo excluído no histórico", async () => {
    const { c, lancar } = f;
    await lancar({ tipo: "ENTRADA", quantidade: "10" });
    const quebra = (motivoQuebraId?: string) =>
      lancar({ tipo: "QUEBRA", quantidade: "1", motivoQuebraId });
    await expect(quebra()).rejects.toThrow("Selecione o motivo");
    const b = await criarContexto();
    try {
      const estrangeiro = (await listarMotivosQuebra(b))[0];
      await expect(quebra(estrangeiro.id)).rejects.toMatchObject({
        status: 404,
      });
    } finally {
      await limpar(b);
    }
    const [motivo] = await listarMotivosQuebra(c);
    const movimento = await quebra(motivo.id);
    await salvarMotivoQuebra(c, {
      id: motivo.id,
      nome: motivo.nome,
      ativo: false,
    });
    expect(
      (await listarMotivosQuebra(c, true)).some((m) => m.id === motivo.id),
    ).toBe(false);
    await expect(quebra(motivo.id)).rejects.toMatchObject({ status: 404 });
    await excluirMotivoQuebra(c, motivo.id);
    await expect(quebra(motivo.id)).rejects.toMatchObject({ status: 404 });
    expect((await obterMovimentacao(c, movimento.id)).motivoQuebra?.nome).toBe(
      motivo.nome,
    );
    expect(await listarMotivosQuebra(c)).toHaveLength(6);
    await salvarMotivoQuebra(c, { nome: motivo.nome, ativo: true });
    expect(await listarMotivosQuebra(c)).toHaveLength(7);
  });

  it("confere os arquivos no provedor e persiste fotos válidas apenas na quebra", async () => {
    const { c, lancar } = f;
    const chaveIdempotencia = randomUUID();
    const [motivo] = await listarMotivosQuebra(c);
    await lancar({ tipo: "ENTRADA", quantidade: "6" });
    const endpoint = "https://ik.imagekit.io/teste";
    const fileId = "61643b3d5a3c2d6093521234";
    const fotos = [{ fileId, url: endpoint + "/foto.jpg" }];
    const quebra = () =>
      lancar({
        tipo: "QUEBRA",
        quantidade: "1",
        motivoQuebraId: motivo.id,
        chaveIdempotencia,
        fotos,
      });
    vi.stubEnv("IMAGEKIT_PUBLIC_KEY", "");
    await expect(quebra()).rejects.toThrow("indisponível");
    for (const [chave, valor] of Object.entries({
      IMAGEKIT_PUBLIC_KEY: "publica",
      NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: "publica",
      IMAGEKIT_PRIVATE_KEY: "privada-teste",
      IMAGEKIT_URL_ENDPOINT: endpoint,
      NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: endpoint,
    }))
      vi.stubEnv(chave, valor);
    const caminho =
      pastaAvarias(c.empresaId) +
      "/" +
      prefixoFoto("privada-teste", c, chaveIdempotencia) +
      "-foto.jpg";
    const metadados = {
      fileId,
      filePath: caminho,
      mime: "image/jpeg",
      size: 50,
      fileType: "image",
      isPrivateFile: true,
    };
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          ...metadados,
          filePath: "/avarias/outra-empresa/foto.jpg",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ ...metadados, size: 6 * 1024 * 1024 }),
      )
      .mockResolvedValueOnce(
        Response.json({ ...metadados, mime: "image/svg+xml" }),
      )
      .mockResolvedValueOnce(Response.json(metadados));
    vi.stubGlobal("fetch", buscar);
    for (let i = 0; i < 3; i++) await expect(quebra()).rejects.toThrow();
    await expect(
      lancar({
        tipo: "QUEBRA",
        quantidade: "1",
        motivoQuebraId: motivo.id,
        fotos: Array(4).fill(fotos[0]),
      }),
    ).rejects.toThrow("três");
    const movimento = await quebra();
    expect((await obterMovimentacao(c, movimento.id)).fotos).toEqual([
      expect.objectContaining({ fileId, url: endpoint + caminho }),
    ]);
    expect((await quebra()).id).toBe(movimento.id);
    expect(buscar).toHaveBeenCalledTimes(4);
  });

  it("cria padrões uma única vez mesmo em concorrência", async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => garantirMotivosPadrao(f.c.empresaId)),
    );
    expect((await listarMotivosQuebra(f.c)).map((m) => m.nome)).toEqual(
      expect.arrayContaining([
        "Vencimento",
        "Dano no transporte",
        "Queda/manuseio",
        "Defeito de fabricação",
        "Umidade/infiltração",
        "Furto/extravio",
        "Outros",
      ]),
    );
    expect(await listarMotivosQuebra(f.c)).toHaveLength(7);
  });
});
