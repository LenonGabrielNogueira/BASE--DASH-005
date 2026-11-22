import Link from "next/link";
import { z } from "zod";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { MovimentacaoForm } from "@/components/movimentacoes/movimentacao-form";
import { requerGestao, tiposLancamento } from "@/lib/movimentacao-regras";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { obterItem } from "@/server/services/itens";
import { NaoEncontrado } from "@/lib/erros";
import { listarNivel } from "@/server/services/localizacoes";
import { listarMotivosQuebra } from "@/server/services/motivos-quebra";
import { configuracaoImageKit } from "@/server/services/imagekit";

export default async function NovaMovimentacao({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [c, query] = await Promise.all([getContexto(), searchParams]);
  const unidade = await getUnidadeAtual(c);
  if (!unidade)
    return (
      <EstadoVazio texto="Cadastre e selecione uma unidade ativa para movimentar estoque." />
    );
  const tipos = tiposLancamento.filter(
    (t) => c.papel !== "ESTOQUISTA" || !requerGestao(t),
  );
  const parsed = z.enum(tiposLancamento).safeParse(query.tipo);
  const tipo =
    parsed.success && tipos.includes(parsed.data) ? parsed.data : "ENTRADA";
  const [item, posicoes, motivos] = await Promise.all([
    typeof query.itemId === "string"
      ? obterItem(c, query.itemId).catch((e) => {
          if (e instanceof NaoEncontrado) return null;
          throw e;
        })
      : null,
    listarNivel(unidade, "POSICAO"),
    listarMotivosQuebra(c, true),
  ]);
  const posicao = posicoes.find((p) => p.id === query.posicaoId)?.id ?? null;
  if (query.posicaoId && !posicao)
    return (
      <EstadoVazio texto="A posição do atalho não está disponível na unidade atual." />
    );
  if (query.itemId && !item)
    return <EstadoVazio texto="O item do atalho não está disponível." />;
  return (
    <>
      <Link
        href="/movimentacoes"
        className="inline-flex min-h-11 items-center text-emerald-800"
      >
        ← Movimentações
      </Link>
      <div className="titulo">
        <h1>Nova movimentação</h1>
      </div>
      <MovimentacaoForm
        key={JSON.stringify([
          c.empresaId,
          unidade.unidadeId,
          tipo,
          item?.id,
          posicao,
        ])}
        unidadeId={unidade.unidadeId}
        tipoInicial={tipo}
        tipos={tipos}
        posicaoInicial={posicao}
        itemInicial={
          item && {
            id: item.id,
            nome: item.nome,
            codigoInterno: item.codigoInterno,
            unidadeMedida: item.unidadeMedida,
          }
        }
        posicoes={posicoes.map(({ id, codigo }) => ({ id, codigo }))}
        motivos={motivos.map(({ id, nome }) => ({ id, nome }))}
        habilitarFotos={!!configuracaoImageKit()}
      />
    </>
  );
}
