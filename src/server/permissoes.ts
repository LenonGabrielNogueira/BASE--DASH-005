import type { Papel } from "@prisma/client";
import type { Contexto } from "@/types";
import { SemPermissao } from "@/lib/erros";
export function exigirPapel(
  contexto: Contexto,
  papeis: Papel[] = ["ADMIN", "GERENTE"],
) {
  if (!papeis.includes(contexto.papel)) throw new SemPermissao();
}
