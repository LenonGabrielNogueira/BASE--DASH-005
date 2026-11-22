"use server";
import { z } from "zod";
import { executarAcao } from "@/server/acoes";
import { cadastroSchema } from "@/lib/validacao/unidade";
import { salvarUnidade } from "@/server/services/unidades";
import { validarUnidade } from "@/server/services/unidades";
import { getContexto } from "@/server/contexto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_UNIDADE } from "@/server/unidade-atual";
import { mensagemErro } from "@/lib/erros";
import type { Resultado } from "@/types";
export async function definirUnidadeAtual(
  entrada: unknown,
): Promise<Resultado<null>> {
  const id = z.string().min(1).safeParse(entrada);
  if (!id.success) return { ok: false, erro: "Selecione uma unidade." };
  try {
    const c = await validarUnidade(await getContexto(), id.data);
    (await cookies()).set(COOKIE_UNIDADE, c.unidadeId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, erro: mensagemErro(e) };
  }
}
export async function salvar(entrada: unknown) {
  return executarAcao(
    cadastroSchema.extend({ id: z.string().min(1).optional() }),
    entrada,
    (c, { id, ...d }) => salvarUnidade(c, d, id),
  );
}
