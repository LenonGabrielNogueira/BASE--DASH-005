import { etiquetasSchema } from "@/lib/validacao/qrcode";
import { contextoLocalizacao } from "@/server/tela-localizacao";
import { gerarEtiquetas } from "@/server/services/pdfs";
import { AppError, mensagemErro } from "@/lib/erros";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const d = etiquetasSchema.safeParse({
    ids: params.get("ids")?.split(",") ?? [],
    formato: params.get("formato") ?? "A4",
  });
  if (!d.success)
    return Response.json(
      { erro: d.error.issues[0]?.message ?? "Seleção inválida." },
      { status: 400 },
    );
  try {
    const pdf = await gerarEtiquetas(await contextoLocalizacao(), d.data);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="etiquetas.pdf"',
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
