import Link from "next/link";
import type { ContextoUnidade } from "@/types";
import {
  listarAlocacoesItem,
  opcoesAlocacao,
} from "@/server/services/alocacoes";
import { AlocarItemDialog } from "@/components/localizacoes/alocar-item-dialog";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
import { remover } from "@/app/(app)/localizacoes/actions";
export async function LocalizacoesItem({
  contexto: c,
  itemId,
}: {
  contexto: ContextoUnidade;
  itemId: string;
}) {
  const alocacoes = await listarAlocacoesItem(c, itemId);
  const editar = c.papel !== "ESTOQUISTA";
  const opcoes = editar ? await opcoesAlocacao(c) : null;
  return (
    <section id="localizacoes" className="mt-8">
      <h2 className="mb-3 text-lg font-bold">Localizações na unidade atual</h2>
      {!alocacoes.length && (
        <p className="rounded-xl border bg-white p-5 text-slate-500">
          Este item ainda não foi alocado nesta unidade.
        </p>
      )}
      <div className="lista">
        {alocacoes.map((a) => (
          <div key={a.id} className="linha">
            <div>
              <Link
                className="inline-flex min-h-11 items-center text-emerald-800 underline"
                href={`/localizacoes/posicoes/${a.posicao.id}`}
              >
                {a.posicao.codigo}
              </Link>
              <p className="text-sm text-slate-500">{a.observacao}</p>
            </div>
            {editar && (
              <ConfirmarExclusao
                nome={`alocação em ${a.posicao.codigo}`}
                acao={remover.bind(null, a.id)}
              />
            )}
          </div>
        ))}
      </div>
      {opcoes && <AlocarItemDialog {...opcoes} itemId={itemId} />}
    </section>
  );
}
