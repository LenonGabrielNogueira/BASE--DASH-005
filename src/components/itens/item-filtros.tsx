import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function ItemFiltros({
  categorias,
  q,
  categoriaId,
  ordem,
}: {
  categorias: { id: string; nome: string }[];
  q: string;
  categoriaId?: string;
  ordem: string;
}) {
  return (
    <form className="mb-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="text-xs font-semibold text-slate-500">
        Nome
        <Input name="q" defaultValue={q} placeholder="Filtrar itens…" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Categoria
        <select name="categoriaId" defaultValue={categoriaId}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Ordenar
        <select name="ordem" defaultValue={ordem}>
          <option value="nome">Nome</option>
          <option value="data">Mais recentes</option>
        </select>
      </label>
      <Button className="self-end">Filtrar</Button>
    </form>
  );
}
