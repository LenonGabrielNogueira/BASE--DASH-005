import { auth } from "@clerk/nextjs/server";
import ImageKit from "imagekit";
import { z } from "zod";
import { AppError, mensagemErro, NaoEncontrado } from "@/lib/erros";
import { getContexto } from "@/server/contexto";
import { exigirPapel } from "@/server/permissoes";
import { getUnidadeAtual } from "@/server/unidade-atual";
import {
  configuracaoImageKit,
  pastaAvarias,
  prefixoFoto,
} from "@/server/services/imagekit";

const schema = z.object({
  chave: z.uuid(),
  unidadeId: z.string().min(1).max(100),
});
const headers = { "Cache-Control": "private, no-store" };

export async function POST(req: Request) {
  if (!(await auth()).userId)
    return Response.json(
      { erro: "Entre para enviar fotos." },
      { status: 401, headers },
    );
  try {
    const c = await getContexto();
    exigirPapel(c, ["ADMIN", "GERENTE", "ESTOQUISTA"]);
    const d = schema.safeParse(await req.json().catch(() => null));
    if (!d.success) throw new AppError("Lançamento inválido.");
    const unidade = await getUnidadeAtual(c);
    if (!unidade || unidade.unidadeId !== d.data.unidadeId)
      throw new NaoEncontrado("A unidade atual mudou. Reabra o formulário.");
    const config = configuracaoImageKit();
    if (!config) throw new NaoEncontrado("O envio de fotos está indisponível.");
    const kit = new ImageKit(config);
    const parametros = kit.getAuthenticationParameters(
      undefined,
      Math.floor(Date.now() / 1000) + 180,
    );
    return Response.json(
      {
        ...parametros,
        publicKey: config.publicKey,
        pasta: pastaAvarias(c.empresaId),
        prefixo: prefixoFoto(config.privateKey, unidade, d.data.chave),
      },
      { headers },
    );
  } catch (e) {
    return Response.json(
      { erro: mensagemErro(e) },
      { status: e instanceof AppError ? e.status : 500, headers },
    );
  }
}
