import type { TipoLocalizacao } from "@prisma/client";
import { AppError } from "./erros";
export function validarCodigoSecao(codigo: string) {
  return /^[A-Z0-9]{1,10}$/.test(codigo);
}
export function gerarCodigoLocalizacao(
  pai: string,
  tipo: Exclude<TipoLocalizacao, "SECAO">,
  ordem: number,
) {
  if (!pai || !Number.isSafeInteger(ordem) || ordem < 1)
    throw new AppError("Código pai ou número inválido.");
  return `${pai}-${tipo === "PRATELEIRA" ? `P${ordem}` : String(ordem).padStart(2, "0")}`;
}
