import Link from "next/link";
import { EstadoVazio } from "@/components/comum/estado-vazio";
export type ItemLinha = {
  id: string;
  nome: string;
  codigoInterno: string;
  unidadeMedida: string;
  ativo: boolean;
  categoria: { nome: string } | null;
};
export function ItemTabela({ itens }: { itens: ItemLinha[] }) {
  if (!itens.length)
    return (
      <EstadoVazio texto="Nenhum item encontrado. Cadastre um item ou ajuste os filtros." />
    );
  return (
    <div className="lista">
      <div className="hidden grid-cols-[1fr_2fr_1fr_80px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <span>Código</span>
        <span>Item</span>
        <span>Categoria</span>
        <span>Unidade</span>
      </div>
      {itens.map((i) => (
        <Link
          key={i.id}
          href={`/itens/${i.id}`}
          className="grid gap-2 rounded-xl border bg-white px-5 py-4 transition hover:border-emerald-600 md:grid-cols-[1fr_2fr_1fr_80px] md:items-center"
        >
          <span className="font-mono text-sm text-slate-500">
            #{i.codigoInterno}
          </span>
          <span className="font-semibold">
            {i.nome}
            {!i.ativo && <small className="ml-2 text-slate-500">Inativo</small>}
          </span>
          <span className="text-sm text-slate-500">
            {i.categoria?.nome ?? "Sem categoria"}
          </span>
          <span className="text-xs font-semibold text-emerald-800">
            {i.unidadeMedida}
          </span>
        </Link>
      ))}
    </div>
  );
}
