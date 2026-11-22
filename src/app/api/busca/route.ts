import { z } from "zod";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { buscar, buscarLocalizacoes } from "@/server/services/busca";
import { AppError, mensagemErro, NaoEncontrado } from "@/lib/erros";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const parametros = new URL(req.url).searchParams;
  const d = z
    .object({ q: z.string().trim().max(100), exato: z.enum(["0", "1"]) })
    .safeParse({
      q: parametros.get("q") ?? "",
      exato: parametros.get("exato") ?? "0",
    });
  if (!d.success)
    return Response.json(
      { erro: "Pesquisa inválida: máximo de 100 caracteres." },
      { status: 400 },
    );
  try {
    const c = await getContexto();
    const unidade = await getUnidadeAtual(c).catch((e) => {
      if (d.data.exato === "1" && e instanceof NaoEncontrado) return null;
      throw e;
    });
    const [itens, localizacoes] = await Promise.all([
      buscar(c, d.data.q, d.data.exato === "1", unidade),
      unidade && d.data.exato === "0"
        ? buscarLocalizacoes(unidade, d.data.q)
        : Promise.resolve([]),
    ]);
    return Response.json(
      { itens, localizacoes },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return Response.json(
      { erro: mensagemErro(e) },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
