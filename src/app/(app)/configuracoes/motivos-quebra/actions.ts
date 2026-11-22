"use server";

import { z } from "zod";
import { motivoQuebraSchema } from "@/lib/validacao/motivo-quebra";
import { executarAcao } from "@/server/acoes";
import {
  excluirMotivoQuebra,
  salvarMotivoQuebra,
} from "@/server/services/motivos-quebra";

export async function salvar(entrada: unknown) {
  return executarAcao(motivoQuebraSchema, entrada, salvarMotivoQuebra);
}

export async function excluir(id: string) {
  return executarAcao(z.string().min(1), id, excluirMotivoQuebra);
}
