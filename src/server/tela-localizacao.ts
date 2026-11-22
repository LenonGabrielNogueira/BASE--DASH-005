import { getContexto } from "./contexto";
import { getUnidadeAtual } from "./unidade-atual";
import { NaoEncontrado } from "@/lib/erros";
import { notFound } from "next/navigation";
export async function contextoLocalizacao() {
  const c = await getUnidadeAtual(await getContexto());
  if (!c) throw new NaoEncontrado("Cadastre e selecione uma unidade ativa.");
  return c;
}
export async function carregarOu404<T>(carregar: () => Promise<T>) {
  try {
    return await carregar();
  } catch (e) {
    if (e instanceof NaoEncontrado) notFound();
    throw e;
  }
}
