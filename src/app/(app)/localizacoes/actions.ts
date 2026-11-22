"use server";
import { executarAcaoUnidade } from "@/server/acoes-unidade";
import { z } from "zod";
import { alocacaoSchema } from "@/lib/validacao/localizacao";
import { alocarItem, removerAlocacao } from "@/server/services/alocacoes";
export async function alocar(entrada: unknown) {
  return executarAcaoUnidade(alocacaoSchema, entrada, alocarItem);
}
export async function remover(id: string) {
  return executarAcaoUnidade(z.string().min(1), id, removerAlocacao);
}
import {
  alvoSchema,
  localizacaoSchema,
  loteSchema,
} from "@/lib/validacao/localizacao";
import {
  salvarLocalizacao,
  excluirLocalizacao,
  criarEmLote,
} from "@/server/services/localizacoes";
export async function salvar(entrada: unknown) {
  return executarAcaoUnidade(localizacaoSchema, entrada, salvarLocalizacao);
}
export async function excluir(entrada: unknown) {
  return executarAcaoUnidade(alvoSchema, entrada, (c, d) =>
    excluirLocalizacao(c, d.tipo, d.id),
  );
}
export async function criarLote(entrada: unknown) {
  return executarAcaoUnidade(loteSchema, entrada, criarEmLote);
}
