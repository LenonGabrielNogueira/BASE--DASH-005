import type { ContextoUnidade } from "@/types";
import type { z } from "zod";
import type { localizacaoSchema } from "@/lib/validacao/localizacao";
import {
  salvarLocalizacao,
  excluirLocalizacao,
  listarNivel,
  obterLocalizacao,
} from "./localizacoes";
export const salvarSecao = (
  c: ContextoUnidade,
  dados: Omit<z.input<typeof localizacaoSchema>, "tipo">,
) => salvarLocalizacao(c, { ...dados, tipo: "SECAO" });
export const excluirSecao = (c: ContextoUnidade, id: string) =>
  excluirLocalizacao(c, "SECAO", id);
export const listarSecoes = (c: ContextoUnidade, paiId?: string) =>
  listarNivel(c, "SECAO", paiId);
export const obterSecao = (c: ContextoUnidade, id: string) =>
  obterLocalizacao(c, "SECAO", id);
