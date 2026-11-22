import { auth, clerkClient } from "@clerk/nextjs/server";
import { SemPermissao } from "@/lib/erros";
import { contextoDaIdentidade } from "./services/identidade";
import { cache } from "react";
export const getContexto = cache(async function getContexto() {
  const sessao = await auth();
  if (!sessao.userId || !sessao.orgId)
    throw new SemPermissao("Entre e selecione uma empresa.");
  const client = await clerkClient();
  // Confere a associação atual, inclusive após revogação, sem confiar em papéis enviados pelo cliente.
  const membros = await client.organizations.getOrganizationMembershipList({
    organizationId: sessao.orgId,
    userId: [sessao.userId],
    limit: 1,
  });
  const membro = membros.data[0];
  if (!membro) throw new SemPermissao();
  const org = await client.organizations.getOrganization({
    organizationId: sessao.orgId,
  });
  return contextoDaIdentidade(
    sessao.orgId,
    sessao.userId,
    membro.role,
    org.name,
    [membro.publicUserData?.firstName, membro.publicUserData?.lastName]
      .filter(Boolean)
      .join(" ") || undefined,
  );
});
