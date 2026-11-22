import type { TipoMovimentacao } from "@prisma/client";

export const tiposLancamento = [
  "ENTRADA",
  "SAIDA",
  "QUEBRA",
  "TRANSFERENCIA",
  "AJUSTE_POSITIVO",
  "AJUSTE_NEGATIVO",
] as const;
export const tiposMovimentacao = [...tiposLancamento, "ESTORNO"] as const;

export const nomesMovimentacao: Record<TipoMovimentacao, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  QUEBRA: "Quebra",
  TRANSFERENCIA: "Transferência",
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
  ESTORNO: "Estorno",
};

type Lados = { origem: boolean; destino: boolean };
export function ladosMovimentacao(
  tipo: TipoMovimentacao,
  original?: Exclude<TipoMovimentacao, "ESTORNO">,
): Lados {
  switch (tipo) {
    case "ENTRADA":
    case "AJUSTE_POSITIVO":
      return { origem: false, destino: true };
    case "SAIDA":
    case "QUEBRA":
    case "AJUSTE_NEGATIVO":
      return { origem: true, destino: false };
    case "TRANSFERENCIA":
      return { origem: true, destino: true };
    case "ESTORNO": {
      if (!original) throw new Error("Estorno exige o tipo original.");
      const lados = ladosMovimentacao(original);
      return { origem: lados.destino, destino: lados.origem };
    }
  }
}

export function requerGestao(tipo: TipoMovimentacao) {
  return (
    tipo === "ESTORNO" ||
    tipo === "AJUSTE_POSITIVO" ||
    tipo === "AJUSTE_NEGATIVO"
  );
}
