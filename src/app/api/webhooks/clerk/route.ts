import { Webhook } from "svix";
import { z } from "zod";
import {
  sincronizarEmpresa,
  sincronizarMembro,
  removerMembro,
} from "@/server/services/identidade";
const eventoSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("organization.created"),
    data: z.object({ id: z.string(), name: z.string() }),
  }),
  z.object({
    type: z.literal("organizationMembership.created"),
    data: z.object({
      organization: z.object({ id: z.string(), name: z.string() }),
      public_user_data: z.object({ user_id: z.string() }),
      role: z.string(),
    }),
  }),
  z.object({
    type: z.literal("organizationMembership.deleted"),
    data: z.object({
      organization: z.object({ id: z.string() }),
      public_user_data: z.object({ user_id: z.string() }),
    }),
  }),
]);
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ erro: "Webhook não configurado." }, { status: 503 });
  let verificado: unknown;
  try {
    verificado = new Webhook(secret).verify(await req.text(), {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    });
  } catch {
    return Response.json({ erro: "Assinatura inválida." }, { status: 400 });
  }
  const evento = eventoSchema.safeParse(verificado);
  if (!evento.success) return Response.json({ recebido: true });
  const e = evento.data;
  if (e.type === "organization.created")
    await sincronizarEmpresa(e.data.id, e.data.name);
  else if (e.type === "organizationMembership.created")
    await sincronizarMembro(
      e.data.organization.id,
      e.data.public_user_data.user_id,
      e.data.role,
      e.data.organization.name,
    );
  else
    await removerMembro(
      e.data.organization.id,
      e.data.public_user_data.user_id,
    );
  return Response.json({ recebido: true });
}
