import type { ContextoUnidade } from "@/types";
import type { z } from "zod";
import type { localizacaoSchema } from "@/lib/validacao/localizacao";
import {
  salvarLocalizacao,
  excluirLocalizacao,
  listarNivel,
  obterLocalizacao,
} from "./localizacoes";
export const salvarModulo = (
  c: ContextoUnidade,
  dados: Omit<z.input<typeof localizacaoSchema>, "tipo">,
) => salvarLocalizacao(c, { ...dados, tipo: "MODULO" });
export const excluirModulo = (c: ContextoUnidade, id: string) =>
  excluirLocalizacao(c, "MODULO", id);
export const listarModulos = (c: ContextoUnidade, paiId?: string) =>
  listarNivel(c, "MODULO", paiId);
export const obterModulo = (c: ContextoUnidade, id: string) =>
  obterLocalizacao(c, "MODULO", id);
