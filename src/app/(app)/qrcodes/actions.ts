"use server";
import { executarAcaoUnidade } from "@/server/acoes-unidade";
import { operacaoQrSchema } from "@/lib/validacao/qrcode";
import { alterarQr } from "@/server/services/qrcodes";
export async function alterar(entrada: unknown) {
  return executarAcaoUnidade(operacaoQrSchema, entrada, (c, d) =>
    alterarQr(c, d.tipo, d.id, d.operacao),
  );
}
