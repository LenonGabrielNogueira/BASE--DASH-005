import "dotenv/config";
import { randomUUID } from "node:crypto";
import type { Contexto } from "@/types";
import type { ContextoUnidade } from "@/types";
export async function criarContextoUnidade(
  c?: Contexto,
): Promise<ContextoUnidade> {
  const base = c ?? (await criarContexto());
  const { prisma } = await import("@/server/db");
  const unidade = await prisma.unidade.create({
    data: { empresaId: base.empresaId, nome: "Unidade de teste" },
  });
  return { ...base, unidadeId: unidade.id };
}
// Importações dos serviços devem ocorrer após esta configuração.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
}
export const temBanco = !!process.env.TEST_DATABASE_URL;
export async function criarContexto(): Promise<Contexto> {
  const { prisma } = await import("@/server/db");
  const empresa = await prisma.empresa.create({
    data: { clerkOrgId: `teste-${randomUUID()}`, nome: "Empresa de teste" },
  });
  const usuario = await prisma.usuario.create({
    data: {
      clerkId: `teste-${randomUUID()}`,
      empresaId: empresa.id,
      papel: "ADMIN",
    },
  });
  return { empresaId: empresa.id, usuarioId: usuario.id, papel: "ADMIN" };
}
export async function limpar(c: Contexto) {
  const { prisma } = await import("@/server/db");
  const e = await prisma.empresa.findUnique({ where: { id: c.empresaId } });
  if (!e?.clerkOrgId.startsWith("teste-"))
    throw new Error("Limpeza permitida apenas para empresa de teste.");
  await prisma.movimentacao.deleteMany({
    where: { empresaId: c.empresaId, tipo: "ESTORNO" },
  });
  await prisma.movimentacao.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.saldo.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.motivoQuebra.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.qRCode.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.itemPosicao.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.posicao.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.prateleira.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.modulo.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.secao.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.codigoBarras.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.item.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.categoria.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.unidade.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.usuario.deleteMany({ where: { empresaId: c.empresaId } });
  await prisma.empresa.delete({ where: { id: c.empresaId } });
}
export const dadosItem = (nome: string) => ({
  nome,
  unidadeMedida: "UN",
  altoValor: false,
  ativo: true,
});
