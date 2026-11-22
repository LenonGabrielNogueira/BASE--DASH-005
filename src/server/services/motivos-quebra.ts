import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { exigirPapel } from "@/server/permissoes";
import { ConflitoDeDados, NaoEncontrado } from "@/lib/erros";
import { motivoQuebraSchema } from "@/lib/validacao/motivo-quebra";
import type { Contexto } from "@/types";

const padroes = [
  "Vencimento",
  "Dano no transporte",
  "Queda/manuseio",
  "Defeito de fabricação",
  "Umidade/infiltração",
  "Furto/extravio",
  "Outros",
];

export async function garantirMotivosPadrao(empresaId: string) {
  if (await prisma.motivosQuebraPadrao.findUnique({ where: { empresaId } }))
    return;
  await prisma.$transaction(async (tx) => {
    const marcador = await tx.motivosQuebraPadrao.createMany({
      data: { empresaId },
      skipDuplicates: true,
    });
    if (marcador.count)
      await tx.motivoQuebra.createMany({
        data: padroes.map((nome) => ({ empresaId, nome })),
        skipDuplicates: true,
      });
  });
}

export async function listarMotivosQuebra(c: Contexto, somenteAtivos = false) {
  await garantirMotivosPadrao(c.empresaId);
  return prisma.motivoQuebra.findMany({
    where: {
      empresaId: c.empresaId,
      deletadoEm: null,
      ...(somenteAtivos && { ativo: true }),
    },
    orderBy: { nome: "asc" },
  });
}

export async function salvarMotivoQuebra(c: Contexto, entrada: unknown) {
  exigirPapel(c);
  const { id, nome, descricao, ativo } = motivoQuebraSchema.parse(entrada);
  await garantirMotivosPadrao(c.empresaId);
  const data = { nome, descricao: descricao || null, ativo };
  try {
    if (!id)
      return await prisma.motivoQuebra.create({
        data: { ...data, empresaId: c.empresaId },
      });
    const alteracao = await prisma.motivoQuebra.updateMany({
      where: { id, empresaId: c.empresaId, deletadoEm: null },
      data,
    });
    if (!alteracao.count)
      throw new NaoEncontrado("Motivo de quebra não encontrado.");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      throw new ConflitoDeDados(
        "Já existe um motivo com esse nome nesta empresa.",
      );
    throw e;
  }
}

export async function excluirMotivoQuebra(c: Contexto, id: string) {
  exigirPapel(c);
  const alteracao = await prisma.motivoQuebra.updateMany({
    where: { id, empresaId: c.empresaId, deletadoEm: null },
    data: { deletadoEm: new Date(), ativo: false },
  });
  if (!alteracao.count)
    throw new NaoEncontrado("Motivo de quebra não encontrado.");
}
