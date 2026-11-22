import type { ContextoUnidade } from "@/types";
import type { z } from "zod";
import type { localizacaoSchema } from "@/lib/validacao/localizacao";
import {
  salvarLocalizacao,
  excluirLocalizacao,
  listarNivel,
  obterLocalizacao,
} from "./localizacoes";
export const salvarPosicao = (
  c: ContextoUnidade,
  dados: Omit<z.input<typeof localizacaoSchema>, "tipo">,
) => salvarLocalizacao(c, { ...dados, tipo: "POSICAO" });
export const excluirPosicao = (c: ContextoUnidade, id: string) =>
  excluirLocalizacao(c, "POSICAO", id);
export const listarPosicoes = (c: ContextoUnidade, paiId?: string) =>
  listarNivel(c, "POSICAO", paiId);
export const obterPosicao = (c: ContextoUnidade, id: string) =>
  obterLocalizacao(c, "POSICAO", id);
