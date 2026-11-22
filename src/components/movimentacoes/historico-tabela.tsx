import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeftRight,
  CircleMinus,
  CirclePlus,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { nomesMovimentacao } from "@/lib/movimentacao-regras";
import type { LinhaMovimentacao } from "@/server/services/movimentacoes";

type Tipo = LinhaMovimentacao["tipo"];
const estilos = {
  ENTRADA: { Icone: ArrowDown, cor: "text-emerald-800" },
  SAIDA: { Icone: ArrowUp, cor: "text-red-800" },
  QUEBRA: { Icone: TriangleAlert, cor: "text-amber-800" },
  TRANSFERENCIA: { Icone: ArrowLeftRight, cor: "text-blue-800" },
  AJUSTE_POSITIVO: { Icone: CirclePlus, cor: "text-emerald-800" },
  AJUSTE_NEGATIVO: { Icone: CircleMinus, cor: "text-red-800" },
  ESTORNO: { Icone: RotateCcw, cor: "text-violet-800" },
};
export function TipoMovimentacaoBadge({
  tipo,
  nome,
}: {
  tipo: Tipo;
  nome?: string;
}) {
  const { Icone, cor } = estilos[tipo];
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${cor}`}>
      <Icone size={16} aria-hidden />
      {nome ?? nomesMovimentacao[tipo]}
    </span>
  );
}
const dataMov = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
export function camposMovimentacao(m: LinhaMovimentacao) {
  const origem =
    m.saldoOrigemApos === null
      ? "—"
      : (m.posicaoOrigem?.codigo ?? "Sem posição");
  const destino =
    m.saldoDestinoApos === null
      ? "—"
      : (m.posicaoDestino?.codigo ?? "Sem posição");
  const sinal =
    m.saldoOrigemApos === null ? "+" : m.saldoDestinoApos === null ? "−" : "↔ ";
  const quantidade = `${sinal}${m.quantidade.toFixed().replace(".", ",")} ${m.item.unidadeMedida}`;
  const saldo = [
    m.saldoOrigemApos === null
      ? null
      : `Origem ${m.saldoOrigemApos.toFixed().replace(".", ",")}`,
    m.saldoDestinoApos === null
      ? null
      : `Destino ${m.saldoDestinoApos.toFixed().replace(".", ",")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    data: dataMov.format(m.criadoEm),
    origem,
    destino,
    quantidade,
    saldo,
  };
}

export function HistoricoTabela({
  movimentos,
}: {
  movimentos: LinhaMovimentacao[];
}) {
  if (!movimentos.length)
    return <EstadoVazio texto="Nenhuma movimentação encontrada." />;
  return (
    <div className="grid gap-2">
      {movimentos.map((m) => {
        const dados = camposMovimentacao(m);
        return (
          <article key={m.id} className="rounded-lg border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4">
              <Link
                className="inline-flex min-h-11 items-center gap-2 underline"
                href={`/movimentacoes/${m.id}`}
              >
                <TipoMovimentacaoBadge tipo={m.tipo} />
              </Link>
              <span className="tabular-nums">{dados.quantidade}</span>
              <time
                dateTime={m.criadoEm.toISOString()}
                className="text-sm text-slate-600"
              >
                {dados.data}
              </time>
            </div>
            <p className="font-medium">
              {m.item.nome} · #{m.item.codigoInterno}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate-600">Origem</dt>
                <dd>{dados.origem}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Destino</dt>
                <dd>{dados.destino}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Saldo após</dt>
                <dd>{dados.saldo}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Usuário</dt>
                <dd className="break-all">
                  {m.usuario.nome ?? m.usuario.clerkId}
                </dd>
              </div>
            </dl>
            {m.motivoQuebra && (
              <p className="mt-2 text-sm">Motivo: {m.motivoQuebra.nome}</p>
            )}
            {m.estornadaPor && (
              <Link
                className="inline-flex min-h-11 items-center text-violet-800 underline"
                href={`/movimentacoes/${m.estornadaPor.id}`}
              >
                Estornada · Ver estorno
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
