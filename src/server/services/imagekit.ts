import { createHmac } from "node:crypto";
import { z } from "zod";
import { AppError, NaoEncontrado } from "@/lib/erros";
import { tamanhoMaximoFotoAvaria, tiposFotoAvaria } from "@/lib/fotos-avaria";
import type { fotoAvariaSchema } from "@/lib/validacao/movimentacao";
import type { ContextoUnidade } from "@/types";
import { prisma } from "@/server/db";

export function configuracaoImageKit() {
  const {
    IMAGEKIT_PUBLIC_KEY: publicKey,
    IMAGEKIT_PRIVATE_KEY: privateKey,
    IMAGEKIT_URL_ENDPOINT: endpoint,
    NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: publicKeyBrowser,
    NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: endpointBrowser,
  } = process.env;
  if (
    !publicKey ||
    !privateKey ||
    !endpoint ||
    publicKey !== publicKeyBrowser ||
    !endpointBrowser
  )
    return null;
  const seguro = z.url({ protocol: /^https$/ }).safeParse(endpoint);
  if (
    !seguro.success ||
    endpoint.replace(/\/+$/, "") !== endpointBrowser.replace(/\/+$/, "")
  )
    return null;
  const url = new URL(seguro.data);
  if (url.username || url.password || url.search || url.hash) return null;
  return { publicKey, privateKey, urlEndpoint: endpoint.replace(/\/+$/, "") };
}

export function pastaAvarias(empresaId: string) {
  return `/avarias/${empresaId}`;
}

export function prefixoFoto(
  privateKey: string,
  c: ContextoUnidade,
  chave: string,
) {
  return createHmac("sha256", privateKey)
    .update(JSON.stringify([c.empresaId, c.unidadeId, c.usuarioId, chave]))
    .digest("hex")
    .slice(0, 32);
}

const metadadosFoto = z.object({
  fileId: z.string(),
  filePath: z.string(),
  mime: z.string().optional(),
  size: z.number().positive().max(tamanhoMaximoFotoAvaria),
  fileType: z.literal("image"),
  isPrivateFile: z.literal(true),
});

export async function validarFotosAvaria(
  c: ContextoUnidade,
  chave: string,
  fotos: z.infer<typeof fotoAvariaSchema>[],
) {
  if (!fotos.length) return fotos;
  const config = configuracaoImageKit();
  if (!config) throw new AppError("O envio de fotos está indisponível.");
  if (new Set(fotos.map((f) => f.fileId)).size !== fotos.length)
    throw new AppError("Remova as fotos duplicadas.");
  const inicio = `${pastaAvarias(c.empresaId)}/${prefixoFoto(config.privateKey, c, chave)}-`;
  const headers = {
    Authorization: `Basic ${Buffer.from(config.privateKey + ":").toString("base64")}`,
  };
  return Promise.all(
    fotos.map(async ({ fileId }) => {
      if (!/^[a-f0-9]{24}$/i.test(fileId))
        throw new AppError("Identificador de foto inválido.");
      const recurso = `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`;
      const opcoes = {
        headers,
        cache: "no-store" as const,
        redirect: "error" as const,
        signal: AbortSignal.timeout(8000),
      };
      try {
        const resposta = await fetch(recurso + "/details", opcoes);
        if (!resposta.ok)
          throw new AppError("Não foi possível confirmar a foto enviada.");
        const info = metadadosFoto.safeParse(await resposta.json());
        if (
          !info.success ||
          info.data.fileId !== fileId ||
          !info.data.filePath.startsWith(inicio) ||
          !/^[a-z0-9_.-]+$/i.test(info.data.filePath.slice(inicio.length))
        ) {
          throw new AppError("Foto inválida para este lançamento.");
        }
        let mime = info.data.mime;
        if (!mime) {
          const metadados = await fetch(recurso + "/metadata", opcoes);
          if (!metadados.ok)
            throw new AppError("Não foi possível verificar o formato da foto.");
          const { format } = z
            .object({ format: z.string() })
            .parse(await metadados.json());
          mime = "image/" + format.toLowerCase().replace(/^jpg$/, "jpeg");
        }
        if (!tiposFotoAvaria.includes(mime))
          throw new AppError("Envie JPEG, PNG ou WebP com até 5 MB.");
        return { fileId, url: config.urlEndpoint + info.data.filePath };
      } catch (erro) {
        if (erro instanceof AppError) throw erro;
        throw new AppError(
          "Não foi possível verificar a foto no ImageKit. Tente novamente.",
          502,
        );
      }
    }),
  );
}

export async function obterFotoAvaria(c: ContextoUnidade, id: string) {
  const foto = await prisma.avariaFoto.findFirst({
    where: {
      id,
      empresaId: c.empresaId,
      movimentacao: { empresaId: c.empresaId, unidadeId: c.unidadeId },
    },
    select: { url: true, fileId: true },
  });
  if (!foto) throw new NaoEncontrado("Foto de avaria não encontrada.");
  return foto;
}

export async function carregarFotoAvaria(c: ContextoUnidade, id: string) {
  const foto = await obterFotoAvaria(c, id);
  const config = configuracaoImageKit();
  if (!config) throw new NaoEncontrado("Armazenamento de fotos indisponível.");
  const endpoint = config.urlEndpoint + "/";
  const pasta = config.urlEndpoint + pastaAvarias(c.empresaId) + "/";
  if (!foto.url.startsWith(pasta))
    throw new NaoEncontrado("Foto de avaria não encontrada.");
  const caminho = foto.url.slice(endpoint.length);
  if (!/^[a-z0-9/_.-]+$/i.test(caminho) || caminho.split("/").includes(".."))
    throw new NaoEncontrado("Foto de avaria não encontrada.");
  const expira = Math.floor(Date.now() / 1000) + 60;
  const assinatura = createHmac("sha1", config.privateKey)
    .update(caminho + expira)
    .digest("hex");
  const resposta = await fetch(
    `${foto.url}?ik-t=${expira}&ik-s=${assinatura}`,
    {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    },
  );
  const tipo = resposta.headers.get("Content-Type")?.split(";")[0]?.trim();
  if (
    !resposta.ok ||
    !resposta.body ||
    !tipo ||
    !tiposFotoAvaria.includes(tipo)
  )
    throw new NaoEncontrado("Foto de avaria indisponível.");
  return { corpo: resposta.body, tipo };
}
