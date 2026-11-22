import { garantirMotivosPadrao } from "./motivos-quebra";
import { prisma } from "@/server/db";
import { SemPermissao } from "@/lib/erros";
import type { Papel } from "@prisma/client";
export function papelClerk(papel: string): Papel {
  return papel === "org:admin"
    ? "ADMIN"
    : papel === "org:gerente"
      ? "GERENTE"
      : "ESTOQUISTA";
}
export async function sincronizarEmpresa(orgId: string, nome: string) {
  const empresa = await prisma.empresa.upsert({
    where: { clerkOrgId: orgId },
    create: { clerkOrgId: orgId, nome },
    update: {},
  });
  await garantirMotivosPadrao(empresa.id);
  return empresa;
}
export async function sincronizarMembro(
  orgId: string,
  clerkId: string,
  papel: string,
  nome = "Minha empresa",
  nomeUsuario?: string,
) {
  const empresa =
    (await prisma.empresa.findUnique({ where: { clerkOrgId: orgId } })) ??
    (await sincronizarEmpresa(orgId, nome));
  const usuario = await prisma.usuario.upsert({
    where: { clerkId_empresaId: { clerkId, empresaId: empresa.id } },
    create: {
      clerkId,
      empresaId: empresa.id,
      papel: papelClerk(papel),
      nome: nomeUsuario,
    },
    update: { papel: papelClerk(papel), removidoEm: null, nome: nomeUsuario },
  });
  return { empresa, usuario };
}
export async function removerMembro(orgId: string, clerkId: string) {
  const empresa = await prisma.empresa.findUnique({
    where: { clerkOrgId: orgId },
  });
  if (empresa)
    await prisma.usuario.updateMany({
      where: { empresaId: empresa.id, clerkId, removidoEm: null },
      data: { removidoEm: new Date() },
    });
}
export async function contextoDaIdentidade(
  orgId: string,
  clerkId: string,
  papel: string,
  nome: string,
  nomeUsuario?: string,
) {
  const { empresa, usuario } = await sincronizarMembro(
    orgId,
    clerkId,
    papel,
    nome,
    nomeUsuario,
  );
  if (!empresa.ativa) throw new SemPermissao("Esta empresa está desativada.");
  return { empresaId: empresa.id, usuarioId: usuario.id, papel: usuario.papel };
}
