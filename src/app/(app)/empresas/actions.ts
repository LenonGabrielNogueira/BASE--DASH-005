"use server";
import { executarAcao } from "@/server/acoes";
import { cadastroSchema } from "@/lib/validacao/unidade";
import { salvarEmpresa } from "@/server/services/empresas";
export async function salvar(entrada: unknown) {
  return executarAcao(cadastroSchema, entrada, salvarEmpresa);
}
