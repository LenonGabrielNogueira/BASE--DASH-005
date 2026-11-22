import Link from "next/link";
import type { saldosDoItem } from "@/server/services/saldos";

export function SaldoPorPosicao({
  item,
}: {
  item: Awaited<ReturnType<typeof saldosDoItem>>;
}) {
  return (
    <ul className="divide-y">
      {item.saldos.map((saldo) => (
        <li
          key={saldo.posicaoId ?? ""}
          className="flex min-h-11 items-center justify-between gap-4 px-3"
        >
          {saldo.posicao ? (
            <Link
              href={`/localizacoes/posicoes/${saldo.posicaoId}`}
              className="inline-flex min-h-11 items-center text-emerald-800 underline"
            >
              {saldo.posicao.codigo}
            </Link>
          ) : (
            <span>Sem posição</span>
          )}
          <span className="tabular-nums">
            {saldo.quantidade.toFixed().replace(".", ",")} {item.unidadeMedida}
          </span>
        </li>
      ))}
    </ul>
  );
}
