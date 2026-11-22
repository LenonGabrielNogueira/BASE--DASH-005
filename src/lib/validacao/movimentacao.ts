import { z } from "zod";
import { limiteFotosAvaria } from "@/lib/fotos-avaria";
import { tiposLancamento } from "@/lib/movimentacao-regras";

const id = z.string().trim().min(1).max(100);
const posicao = id.nullish();
export const fotoAvariaSchema = z.object({
  fileId: id,
  url: z.url({ protocol: /^https$/ }).max(2048),
});
const dados = z.object({
  chaveIdempotencia: z.uuid("Chave de lançamento inválida."),
  justificativa: z.string().trim().max(1000).optional(),
});
export const movimentacaoSchema = z.discriminatedUnion("tipo", [
  dados.extend({
    tipo: z.enum(tiposLancamento),
    itemId: id,
    quantidade: z.string().trim().min(1, "Informe a quantidade.").max(40),
    posicaoOrigemId: posicao,
    posicaoDestinoId: posicao,
    motivoQuebraId: id.nullish(),
    observacao: z.string().trim().max(2000).optional(),
    referencia: z.string().trim().max(150).optional(),
    fotos: z
      .array(fotoAvariaSchema)
      .max(limiteFotosAvaria, "Anexe no máximo três fotos.")
      .optional(),
  }),
  dados.extend({ tipo: z.literal("ESTORNO"), estornoDeId: id }),
]);
export type EntradaMovimentacao = z.input<typeof movimentacaoSchema>;
