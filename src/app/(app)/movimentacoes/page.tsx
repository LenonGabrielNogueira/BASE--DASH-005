import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Paginacao } from "@/components/comum/paginacao";
import { FiltrosMovimentacao } from "@/components/movimentacoes/filtros-movimentacao";
import { HistoricoTabela } from "@/components/movimentacoes/historico-tabela";
import { tiposMovimentacao } from "@/lib/movimentacao-regras";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import {
  listarMovimentacoes,
  opcoesHistorico,
} from "@/server/services/movimentacoes";

function dia(valor?: string) {
  const d = z.iso.date().safeParse(valor);
  return d.success ? new Date(d.data + "T00:00:00-03:00") : undefined;
}
export default async function Movimentacoes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [c, query] = await Promise.all([getContexto(), searchParams]);
  const u = await getUnidadeAtual(c);
  if (!u)
    return (
      <EstadoVazio texto="Cadastre e selecione uma unidade ativa para consultar movimentações." />
    );
  const p = Object.fromEntries(
    Object.entries(query).filter(
      (v): v is [string, string] => typeof v[1] === "string" && !!v[1],
    ),
  );
  const tipo = z.enum(tiposMovimentacao).safeParse(p.tipo).data;
  const pagina =
    z.coerce.number().int().min(1).max(1000000).safeParse(p.pagina).data ?? 1;
  const inicio = dia(p.inicio);
  const fim = dia(p.fim);
  fim?.setUTCDate(fim.getUTCDate() + 1);
  const [historico, opcoes] = await Promise.all([
    listarMovimentacoes(u, {
      tipo,
      itemId: p.itemId,
      usuarioId: p.usuarioId,
      posicaoId: p.posicaoId === "sem-posicao" ? null : p.posicaoId,
      inicio,
      fim,
      pagina,
    }),
    opcoesHistorico(u),
  ]);
  return (
    <>
      <div className="titulo">
        <h1>Movimentações</h1>
        <div className="flex flex-wrap gap-2">
          {c.papel !== "ESTOQUISTA" && (
            <Button asChild variant="outline">
              <Link href="/configuracoes/motivos-quebra">
                Motivos de quebra
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/movimentacoes/nova">Nova movimentação</Link>
          </Button>
        </div>
      </div>
      <FiltrosMovimentacao parametros={p} {...opcoes} />
      <HistoricoTabela movimentos={historico.movimentacoes} />
      <Paginacao pagina={pagina} total={historico.total} parametros={p} />
    </>
  );
}
