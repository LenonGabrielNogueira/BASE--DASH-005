import { cookies } from "next/headers";
import type { Contexto } from "@/types";
import { listarUnidades, validarUnidade } from "@/server/services/unidades";
export const COOKIE_UNIDADE = "inventario-unidade";
export async function getUnidadeAtual(c: Contexto) {
  const valor = (await cookies()).get(COOKIE_UNIDADE)?.value;
  if (valor) return validarUnidade(c, valor);
  const unidades = await listarUnidades(c);
  const primeira = unidades.find((u) => u.ativa);
  if (!primeira) return null;
  return validarUnidade(c, primeira.id);
}
