import Link from "next/link";
import type { Localizacao } from "@/server/services/localizacoes";
import { linkLocalizacao } from "@/server/services/localizacoes";
export function BreadcrumbLocalizacao({
  caminho,
  navegavel = true,
}: {
  caminho: Localizacao[];
  navegavel?: boolean;
}) {
  if (!navegavel)
    return (
      <nav
        aria-label="Caminho da localização"
        className="my-5 text-sm text-slate-500"
      >
        {caminho.map((l) => l.codigo).join(" > ")}
      </nav>
    );
  return (
    <nav
      aria-label="Caminho da localização"
      className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
    >
      <Link
        className="inline-flex min-h-11 items-center text-emerald-800"
        href="/localizacoes"
      >
        Localizações
      </Link>
      {caminho.map((l) => (
        <span className="flex items-center gap-2" key={l.id}>
          <span aria-hidden>›</span>
          <Link
            className="inline-flex min-h-11 items-center"
            href={linkLocalizacao(l)}
          >
            {l.codigo}
            {l.nome ? ` · ${l.nome}` : ""}
          </Link>
        </span>
      ))}
    </nav>
  );
}
