import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { AppError, mensagemErro, NaoEncontrado } from "@/lib/erros";
import { carregarFotoAvaria } from "@/server/services/imagekit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const c = await getUnidadeAtual(await getContexto());
    if (!c) throw new NaoEncontrado();
    const foto = await carregarFotoAvaria(c, (await params).id);
    return new Response(foto.corpo, {
      headers: { ...headers, "Content-Type": foto.tipo },
    });
  } catch (e) {
    return Response.json(
      { erro: mensagemErro(e) },
      { status: e instanceof AppError ? e.status : 500, headers },
    );
  }
}
