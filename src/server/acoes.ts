import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { Contexto, Resultado } from "@/types";
import { getContexto } from "@/server/contexto";
import { mensagemErro } from "@/lib/erros";
export async function executarAcao<S extends z.ZodTypeAny>(
  schema: S,
  entrada: unknown,
  servico: (c: Contexto, dados: z.output<S>) => Promise<unknown>,
): Promise<Resultado<null>> {
  const validado = schema.safeParse(entrada);
  if (!validado.success)
    return {
      ok: false,
      erro: validado.error.issues[0]?.message ?? "Dados inválidos.",
    };
  try {
    await servico(await getContexto(), validado.data);
    revalidatePath("/", "layout");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, erro: mensagemErro(e) };
  }
}
