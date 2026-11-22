import Link from "next/link";
import { getContexto } from "@/server/contexto";
import { obterItem } from "@/server/services/itens";
import { excluir } from "@/app/(app)/itens/actions";
import { Button } from "@/components/ui/button";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
import { CodigosBarrasEditor } from "@/components/itens/codigos-barras-editor";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { LocalizacoesItem } from "@/components/itens/localizacoes-item";
import { AtalhosMovimentacao } from "@/components/movimentacoes/atalhos-movimentacao";
import { HistoricoTabela } from "@/components/movimentacoes/historico-tabela";
import { SaldoPorPosicao } from "@/components/estoque/saldo-por-posicao";
import { saldosDoItem } from "@/server/services/saldos";
import { listarMovimentacoes } from "@/server/services/movimentacoes";
import { AbasItem } from "@/components/itens/abas-item";
export default async function DetalheItem({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const c = await getContexto();
  const item = await obterItem(c, (await params).id);
  const editar = c.papel !== "ESTOQUISTA";
  const unidade = await getUnidadeAtual(c);
  const aba = (await searchParams).aba === "estoque" ? "estoque" : "dados";
  const estoque = unidade
    ? await Promise.all([
        saldosDoItem(unidade, item.id),
        listarMovimentacoes(unidade, { itemId: item.id }),
      ])
    : null;
  return (
    <>
      <Link
        href="/itens"
        className="mb-4 inline-flex min-h-11 items-center text-sm text-emerald-800"
      >
        ← Voltar aos itens
      </Link>
      <div className="titulo">
        <div>
          <p className="mb-2 font-mono text-sm text-slate-500">
            #{item.codigoInterno}
          </p>
          <h1>{item.nome}</h1>
        </div>
        {editar && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/itens/${item.id}/editar`}>Editar item</Link>
            </Button>
            <ConfirmarExclusao
              destino="/itens"
              nome={item.nome}
              acao={excluir.bind(null, item.id)}
            />
          </div>
        )}
      </div>
      <AbasItem
        abaInicial={aba}
        estoque={
          estoque && unidade ? (
            <section className="space-y-4">
              <div className="rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-lg font-bold">
                  Saldo total · {estoque[0].total.toFixed().replace(".", ",")}{" "}
                  {item.unidadeMedida}
                </h2>
                <SaldoPorPosicao item={estoque[0]} />
              </div>
              <AtalhosMovimentacao papel={unidade.papel} itemId={item.id} />
              <h2 className="text-lg font-bold">Movimentações recentes</h2>
              <HistoricoTabela movimentos={estoque[1].movimentacoes} />
              <Link
                className="inline-flex min-h-11 items-center text-emerald-800 underline"
                href={`/movimentacoes?itemId=${item.id}`}
              >
                Ver histórico do item
              </Link>
            </section>
          ) : (
            <p>
              Cadastre e selecione uma unidade ativa para consultar o estoque.
            </p>
          )
        }
        localizacoes={
          unidade ? (
            <LocalizacoesItem contexto={unidade} itemId={item.id} />
          ) : (
            <p>Cadastre e selecione uma unidade ativa para alocar itens.</p>
          )
        }
      >
        <dl className="grid gap-5 rounded-xl border bg-white p-6 sm:grid-cols-2">
          {[
            ["Categoria", item.categoria?.nome ?? "Sem categoria"],
            ["Unidade de medida", item.unidadeMedida],
            [
              "Valor unitário",
              item.valorUnitario === null
                ? "Não informado"
                : Number(item.valorUnitario).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }),
            ],
            ["Situação", item.ativo ? "Ativo" : "Inativo"],
            ["Alto valor", item.altoValor ? "Sim" : "Não"],
            ["Descrição", item.descricao || "Sem descrição"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {k}
              </dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
          {item.imagemUrl && (
            <div>
              <dt className="text-xs text-slate-500">Imagem</dt>
              <dd>
                <a
                  className="inline-flex min-h-11 items-center text-emerald-700 underline"
                  href={item.imagemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir imagem do item
                </a>
              </dd>
            </div>
          )}
        </dl>
        <CodigosBarrasEditor
          itemId={item.id}
          editar={editar}
          codigos={item.codigosBarras.map(({ id, codigo, tipo }) => ({
            id,
            codigo,
            tipo,
          }))}
        />
      </AbasItem>
    </>
  );
}
