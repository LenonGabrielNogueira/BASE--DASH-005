import { prisma } from "@/server/db";
import type { Contexto } from "@/types";
import { exigirPapel } from "@/server/permissoes";
export const obterEmpresa = (c: Contexto) =>
  prisma.empresa.findUniqueOrThrow({ where: { id: c.empresaId } });
export async function salvarEmpresa(
  c: Contexto,
  dados: { nome: string; cnpj?: string; ativa: boolean },
) {
  exigirPapel(c);
  return prisma.empresa.update({ where: { id: c.empresaId }, data: dados });
}
