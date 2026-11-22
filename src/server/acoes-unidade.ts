import type { z } from "zod";
import type { ContextoUnidade, Resultado } from "@/types";
import { executarAcao } from "./acoes";
import { getUnidadeAtual } from "./unidade-atual";
import { NaoEncontrado } from "@/lib/erros";
export function executarAcaoUnidade<S extends z.ZodTypeAny>(
  schema: S,
  entrada: unknown,
  servico: (c: ContextoUnidade, d: z.output<S>) => Promise<unknown>,
): Promise<Resultado<null>> {
  return executarAcao(schema, entrada, async (c, d) => {
    const unidade = await getUnidadeAtual(c);
    if (!unidade)
      throw new NaoEncontrado("Cadastre e selecione uma unidade ativa.");
    return servico(unidade, d);
  });
}
