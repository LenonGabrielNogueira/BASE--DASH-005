import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/erros";

export const MAX_QUANTIDADE = new Prisma.Decimal("999999999.999");

export function validarQuantidade(
  valor: string | Prisma.Decimal,
  unidadeMedida: string,
) {
  const texto =
    typeof valor === "string"
      ? valor.trim().replace(",", ".")
      : valor.toFixed();
  if (!/^\d+(\.\d{1,3})?$/.test(texto))
    throw new AppError(
      "Informe uma quantidade positiva com até 3 casas decimais.",
    );
  const quantidade = new Prisma.Decimal(texto);
  if (quantidade.lte(0) || quantidade.gt(MAX_QUANTIDADE))
    throw new AppError(
      "A quantidade deve ser maior que zero e até 999.999.999,999.",
    );
  if (unidadeMedida === "UN" && !quantidade.isInteger())
    throw new AppError("Itens em UN exigem quantidade inteira.");
  return quantidade;
}
