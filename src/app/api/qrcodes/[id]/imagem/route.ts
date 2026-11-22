import { z } from "zod";
import { contextoLocalizacao } from "@/server/tela-localizacao";
import { gerarImagemQr } from "@/server/services/qrcodes";
import { AppError, mensagemErro } from "@/lib/erros";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const entrada = z
    .object({
      id: z.string().min(1),
      formato: z.enum(["png", "svg"]).default("png"),
    })
    .safeParse({
      ...(await params),
      formato: new URL(req.url).searchParams.get("formato") ?? "png",
    });
  if (!entrada.success)
    return Response.json({ erro: "Formato inválido." }, { status: 400 });
  try {
    const resultado = await gerarImagemQr(
      await contextoLocalizacao(),
      entrada.data.id,
      entrada.data.formato,
    );
    return new Response(
      typeof resultado.dados === "string"
        ? resultado.dados
        : new Uint8Array(resultado.dados),
      {
        headers: {
          "Content-Type": resultado.tipo,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (e) {
    return Response.json(
      { erro: mensagemErro(e) },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
