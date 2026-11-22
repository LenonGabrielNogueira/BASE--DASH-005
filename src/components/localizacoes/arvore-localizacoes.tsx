import Link from "next/link";
import type { NoLocalizacao } from "@/server/services/localizacoes";
import { linkLocalizacao } from "@/server/services/localizacoes";
import { EstadoVazio } from "@/components/comum/estado-vazio";
function No({ no }: { no: NoLocalizacao }) {
  return (
    <details className="my-2 rounded-lg border bg-white p-3">
      <summary className="min-h-11 cursor-pointer py-2 font-medium">
        <span className="font-mono">{no.codigo}</span> {no.nome}{" "}
        <span className="text-xs text-slate-500">
          ({no.quantidade} {no.tipo === "POSICAO" ? "subníveis" : "filhos"})
        </span>
      </summary>
      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline"
          href={linkLocalizacao(no)}
        >
          Abrir e gerenciar QR
        </Link>
        {no.tipo !== "POSICAO" && (
          <a
            className="inline-flex min-h-11 items-center text-sm text-emerald-800 underline"
            href={`/api/pdf/ficha/${no.tipo}/${no.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Imprimir ficha
          </a>
        )}
      </div>
      <div className="ml-4 border-l pl-3">
        {no.filhos.map((f) => (
          <No key={f.id} no={f} />
        ))}
      </div>
    </details>
  );
}
export function ArvoreLocalizacoes({ secoes }: { secoes: NoLocalizacao[] }) {
  if (!secoes.length)
    return (
      <EstadoVazio texto="Nenhuma seção nesta unidade. Crie a primeira seção." />
    );
  return (
    <>
      <div className="hidden md:block">
        {secoes.map((s) => (
          <No key={s.id} no={s} />
        ))}
      </div>
      <div className="lista md:hidden">
        {secoes.map((s) => (
          <Link key={s.id} className="linha" href={linkLocalizacao(s)}>
            <div>
              <p className="font-semibold">
                {s.codigo} · {s.nome}
              </p>
              <p className="text-sm text-slate-500">{s.quantidade} módulo(s)</p>
            </div>
            <span>Abrir →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
