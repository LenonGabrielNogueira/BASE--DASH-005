import { z } from "zod";
import { contextoLocalizacao } from "@/server/tela-localizacao";
import { gerarFicha } from "@/server/services/pdfs";
import { AppError, mensagemErro } from "@/lib/erros";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> },
) {
  const d = z
    .object({
      tipo: z.enum(["SECAO", "MODULO", "PRATELEIRA", "POSICAO"]),
      id: z.string().min(1),
    })
    .safeParse(await params);
  if (!d.success)
    return Response.json({ erro: "Tipo de ficha inválido." }, { status: 400 });
  try {
    const pdf = await gerarFicha(
      await contextoLocalizacao(),
      d.data.tipo,
      d.data.id,
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="ficha-localizacao.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { erro: mensagemErro(e) },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
