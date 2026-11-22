import type { TipoLocalizacao } from "@prisma/client";
export const nomesTipoLocalizacao: Record<TipoLocalizacao, string> = {
  SECAO: "Seção",
  MODULO: "Módulo",
  PRATELEIRA: "Prateleira",
  POSICAO: "Posição",
};
