import Link from "next/link";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { SaldoPorPosicao } from "./saldo-por-posicao";
import type { listarEstoque } from "@/server/services/saldos";

export function SaldoTabela({
  itens,
}: {
  itens: Awaited<ReturnType<typeof listarEstoque>>;
}) {
  if (!itens.length)
    return <EstadoVazio texto="Nenhum item encontrado com esses filtros." />;
  return (
    <div className="grid gap-2">
      {itens.map((item) => (
        <details key={item.id} className="rounded-lg border bg-card">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 p-3">
            <span>
              <strong>{item.nome}</strong>{" "}
              <span className="text-sm text-slate-600">
                #{item.codigoInterno}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              {item.total.toFixed().replace(".", ",")} {item.unidadeMedida}{" "}
              <span aria-hidden>▾</span>
            </span>
          </summary>
          <div className="border-t p-2">
            <SaldoPorPosicao item={item} />
            <Link
              href={`/itens/${item.id}?aba=estoque`}
              className="inline-flex min-h-11 items-center px-3 text-emerald-800 underline"
            >
              Abrir estoque do item
            </Link>
          </div>
        </details>
      ))}
    </div>
  );
}
