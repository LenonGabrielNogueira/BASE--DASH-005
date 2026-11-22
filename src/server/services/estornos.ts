import type { ContextoUnidade } from "@/types";
import { registrarMovimentacao } from "./movimentacoes";

export function estornarMovimentacao(
  c: ContextoUnidade,
  dados: {
    estornoDeId: string;
    justificativa: string;
    chaveIdempotencia: string;
  },
) {
  return registrarMovimentacao(c, { tipo: "ESTORNO", ...dados });
}
