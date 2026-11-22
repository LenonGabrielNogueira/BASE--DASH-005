import type { ContextoUnidade } from "@/types";
import type { z } from "zod";
import type { localizacaoSchema } from "@/lib/validacao/localizacao";
import {
  salvarLocalizacao,
  excluirLocalizacao,
  listarNivel,
  obterLocalizacao,
} from "./localizacoes";
export const salvarPrateleira = (
  c: ContextoUnidade,
  dados: Omit<z.input<typeof localizacaoSchema>, "tipo">,
) => salvarLocalizacao(c, { ...dados, tipo: "PRATELEIRA" });
export const excluirPrateleira = (c: ContextoUnidade, id: string) =>
  excluirLocalizacao(c, "PRATELEIRA", id);
export const listarPrateleiras = (c: ContextoUnidade, paiId?: string) =>
  listarNivel(c, "PRATELEIRA", paiId);
export const obterPrateleira = (c: ContextoUnidade, id: string) =>
  obterLocalizacao(c, "PRATELEIRA", id);
