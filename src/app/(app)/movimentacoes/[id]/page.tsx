import Link from "next/link";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { EstornarDialog } from "@/components/movimentacoes/estornar-dialog";
import {
  camposMovimentacao,
  TipoMovimentacaoBadge,
} from "@/components/movimentacoes/historico-tabela";
import { getContexto } from "@/server/contexto";
import { carregarOu404 } from "@/server/tela-localizacao";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { obterMovimentacao } from "@/server/services/movimentacoes";

export default async function DetalheMovimentacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [c, { id }] = await Promise.all([getContexto(), params]);
  const u = await getUnidadeAtual(c);
  if (!u) return <EstadoVazio texto="Selecione a unidade da movimentação." />;
  const m = await carregarOu404(() => obterMovimentacao(u, id));
  const dados = camposMovimentacao(m);
  const campos = [
    ["Item", `${m.item.nome} · #${m.item.codigoInterno}`],
    ["Data", dados.data],
    ["Quantidade", dados.quantidade],
    ["Usuário", m.usuario.nome ?? m.usuario.clerkId],
    ["Origem", dados.origem],
    ["Destino", dados.destino],
    ["Saldo após", dados.saldo],
    ["Motivo de quebra", m.motivoQuebra?.nome],
    ["Justificativa", m.justificativa],
    ["Observação", m.observacao],
    ["Referência", m.referencia],
  ];
  return (
    <>
      <Link
        href="/movimentacoes"
        className="inline-flex min-h-11 items-center text-emerald-800"
      >
        ← Movimentações
      </Link>
      <div className="titulo">
        <h1>Movimentação</h1>
        <TipoMovimentacaoBadge tipo={m.tipo} />
      </div>
      <dl className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        {campos
          .filter(([, valor]) => valor)
          .map(([nome, valor]) => (
            <div key={nome}>
              <dt className="text-sm text-slate-600">{nome}</dt>
              <dd className="break-words whitespace-pre-wrap">{valor}</dd>
            </div>
          ))}
      </dl>
      {m.fotos.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-lg font-semibold">Fotos de avaria</h2>
          <div className="flex flex-wrap gap-3">
            {m.fotos.map((f, i) => {
              const url = `/api/imagekit/fotos/${f.id}`;
              return (
                <a key={f.id} href={url} target="_blank" rel="noreferrer">
                  {/* A rota autentica o acesso à imagem em cada requisição. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto de avaria ${i + 1}`}
                    className="h-32 w-32 rounded-lg border object-cover"
                  />
                </a>
              );
            })}
          </div>
        </section>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        {m.estornadaPor && (
          <Link
            className="inline-flex min-h-11 items-center text-violet-800 underline"
            href={`/movimentacoes/${m.estornadaPor.id}`}
          >
            Estornada por {m.estornadaPor.id}
          </Link>
        )}
        {m.estornoDe && (
          <Link
            className="inline-flex min-h-11 items-center text-violet-800 underline"
            href={`/movimentacoes/${m.estornoDe.id}`}
          >
            Ver movimentação original
          </Link>
        )}
        {c.papel !== "ESTOQUISTA" &&
          m.tipo !== "ESTORNO" &&
          !m.estornadaPor && <EstornarDialog id={id} unidadeId={u.unidadeId} />}
      </div>
    </>
  );
}
