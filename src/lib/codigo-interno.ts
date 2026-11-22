import type { Prisma } from "@prisma/client";
export async function gerarCodigoInterno(
  tx: Pick<Prisma.TransactionClient, "empresa">,
  empresaId: string,
) {
  const empresa = await tx.empresa.update({
    where: { id: empresaId },
    data: { proxCodigo: { increment: 1 } },
    select: { proxCodigo: true },
  });
  return String(empresa.proxCodigo - 1).padStart(6, "0");
}
