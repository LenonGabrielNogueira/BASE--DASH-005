import { prisma } from "@/server/db";
import type { Contexto } from "@/types";
import { exigirPapel } from "@/server/permissoes";
import { NaoEncontrado } from "@/lib/erros";
import type { ContextoUnidade } from "@/types";
export async function validarUnidade(
  c: Contexto,
  unidadeId: string,
): Promise<ContextoUnidade> {
  const unidade = await prisma.unidade.findFirst({
    where: { id: unidadeId, empresaId: c.empresaId, ativa: true },
  });
  if (!unidade)
    throw new NaoEncontrado("Selecione uma unidade ativa da sua empresa.");
  return { ...c, unidadeId: unidade.id };
}
export const listarUnidades = (c: Contexto) =>
  prisma.unidade.findMany({
    where: { empresaId: c.empresaId },
    orderBy: { nome: "asc" },
  });
export async function salvarUnidade(
  c: Contexto,
  dados: { nome: string; cnpj?: string; ativa: boolean },
  id?: string,
) {
  exigirPapel(c);
  if (!id)
    return prisma.unidade.create({
      data: { ...dados, empresaId: c.empresaId },
    });
  const r = await prisma.unidade.updateMany({
    where: { id, empresaId: c.empresaId },
    data: dados,
  });
  if (!r.count) throw new NaoEncontrado();
}
