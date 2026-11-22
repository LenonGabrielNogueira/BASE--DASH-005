import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Webhook } from "svix";
const sincronizarEmpresa = vi.hoisted(() => vi.fn());
const sincronizarMembro = vi.hoisted(() => vi.fn());
const removerMembro = vi.hoisted(() => vi.fn());
vi.mock("@/server/services/identidade", () => ({
  sincronizarEmpresa,
  sincronizarMembro,
  removerMembro,
}));
import { POST } from "@/app/api/webhooks/clerk/route";
const secret = `whsec_${Buffer.from("segredo-exclusivo-de-teste-12345678").toString("base64")}`;
beforeEach(() => {
  vi.stubEnv("CLERK_WEBHOOK_SECRET", secret);
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllEnvs());
function requisicao(evento: unknown, adulterar = false, antiga = false) {
  const corpo = JSON.stringify(evento);
  const instante = new Date(Date.now() - (antiga ? 3600000 : 0));
  const id = "msg_teste";
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    body: adulterar ? corpo + " " : corpo,
    headers: {
      "svix-id": id,
      "svix-timestamp": String(Math.floor(instante.getTime() / 1000)),
      "svix-signature": new Webhook(secret).sign(id, instante, corpo),
    },
  });
}
it("aceita organização assinada", async () => {
  const r = await POST(
    requisicao({
      type: "organization.created",
      data: { id: "org_teste", name: "Empresa" },
    }),
  );
  expect(r.status).toBe(200);
  expect(sincronizarEmpresa).toHaveBeenCalledWith("org_teste", "Empresa");
});
it("rejeita corpo adulterado e assinatura antiga antes de chamar serviço", async () => {
  for (const [adulterar, antiga] of [
    [true, false],
    [false, true],
  ]) {
    const r = await POST(
      requisicao(
        {
          type: "organization.created",
          data: { id: "org_teste", name: "Empresa" },
        },
        adulterar,
        antiga,
      ),
    );
    expect(r.status).toBe(400);
  }
  expect(sincronizarEmpresa).not.toHaveBeenCalled();
});
it("sincroniza criação e remoção de associação", async () => {
  const data = {
    organization: { id: "org_teste", name: "Empresa" },
    public_user_data: { user_id: "user_teste" },
    role: "org:gerente",
  };
  expect(
    (await POST(requisicao({ type: "organizationMembership.created", data })))
      .status,
  ).toBe(200);
  expect(sincronizarMembro).toHaveBeenCalledWith(
    "org_teste",
    "user_teste",
    "org:gerente",
    "Empresa",
  );
  expect(
    (await POST(requisicao({ type: "organizationMembership.deleted", data })))
      .status,
  ).toBe(200);
  expect(removerMembro).toHaveBeenCalledWith("org_teste", "user_teste");
});
