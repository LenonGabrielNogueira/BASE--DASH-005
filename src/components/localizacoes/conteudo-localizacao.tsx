import Link from "next/link";
import type { ContextoUnidade } from "@/types";
import type { Tipo } from "@/server/services/localizacoes";
import {
  conteudoLocalizacao,
  opcoesAlocacao,
} from "@/server/services/alocacoes";
import { AlocarItemDialog } from "./alocar-item-dialog";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
import { remover } from "@/app/(app)/localizacoes/actions";
import { EstadoVazio } from "@/components/comum/estado-vazio";
export async function ConteudoLocalizacao({
  contexto: c,
  tipo,
  id,
  permitirEdicao = true,
}: {
  contexto: ContextoUnidade;
  tipo: Tipo;
  id: string;
  permitirEdicao?: boolean;
}) {
  const conteudo = await conteudoLocalizacao(c, tipo, id);
  const editar = permitirEdicao && c.papel !== "ESTOQUISTA";
  const opcoes = tipo === "POSICAO" && editar ? await opcoesAlocacao(c) : null;
  return (
    <section className="mt-7">
      <h2 className="mb-4 text-lg font-bold">
        Itens alocados{" "}
        <span className="text-slate-500">({conteudo.length})</span>
      </h2>
      {!conteudo.length && (
        <EstadoVazio texto="Nenhum item alocado nesta localização." />
      )}
      <div className="lista">
        {conteudo.map((g) => (
          <article key={g.item.id} className="rounded-xl border bg-white p-5">
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-emerald-800"
              href={`/itens/${g.item.id}`}
            >
              {g.item.codigoInterno} · {g.item.nome}
            </Link>
            <div className="space-y-2">
              {g.posicoes.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <span>
                      {permitirEdicao ? (
                        <Link
                          className="inline-flex min-h-11 items-center text-sm underline"
                          href={`/localizacoes/posicoes/${p.id}`}
                        >
                          {p.codigo}
                        </Link>
                      ) : (
                        p.codigo
                      )}
                    </span>
                    <p className="text-sm tabular-nums">
                      Saldo: {p.quantidade.replace(".", ",")}{" "}
                      {g.item.unidadeMedida}
                    </p>
                    {p.observacao && (
                      <p className="text-xs text-slate-500">{p.observacao}</p>
                    )}
                  </div>
                  {editar && (
                    <ConfirmarExclusao
                      nome={`alocação em ${p.codigo}`}
                      acao={remover.bind(null, p.alocacaoId)}
                    />
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      {opcoes && <AlocarItemDialog {...opcoes} posicaoId={id} />}
    </section>
  );
}
