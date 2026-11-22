import Link from "next/link";
import { Package, Tags, Store, ArrowUpRight, Plus } from "lucide-react";
import { getContexto } from "@/server/contexto";
import { listarItens } from "@/server/services/itens";
import { listarCategorias } from "@/server/services/categorias";
import { listarUnidades } from "@/server/services/unidades";
import { obterEmpresa } from "@/server/services/empresas";
import { ItemTabela } from "@/components/itens/item-tabela";
import { Button } from "@/components/ui/button";
export default async function Dashboard() {
  const c = await getContexto();
  const [lista, categorias, unidades, empresa] = await Promise.all([
    listarItens(c, { pagina: 1, ordem: "data", q: "" }),
    listarCategorias(c),
    listarUnidades(c),
    obterEmpresa(c),
  ]);
  return (
    <>
      <div className="titulo">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            {empresa.nome}
          </p>
          <h1>Visão geral</h1>
          <p className="subtitulo">
            Tudo pronto para organizar o catálogo da sua empresa.
          </p>
        </div>
        {c.papel !== "ESTOQUISTA" && (
          <Button asChild>
            <Link href="/itens/novo">
              <Plus size={17} />
              Novo item
            </Link>
          </Button>
        )}
      </div>
      <div className="mb-9 grid gap-4 sm:grid-cols-3">
        {[
          {
            nome: "Itens cadastrados",
            valor: lista.total,
            href: "/itens",
            Icon: Package,
          },
          {
            nome: "Categorias",
            valor: categorias.length,
            href: "/categorias",
            Icon: Tags,
          },
          {
            nome: "Unidades ativas",
            valor: unidades.filter((u) => u.ativa).length,
            href: "/unidades",
            Icon: Store,
          },
        ].map(({ nome, valor, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border bg-white p-5"
          >
            <div className="mb-5 flex justify-between">
              <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                <Icon size={21} />
              </span>
              <ArrowUpRight size={16} className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold">{valor}</p>
            <p className="mt-1 text-sm text-slate-500">{nome}</p>
          </Link>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Itens recentes</h2>
        <Link
          href="/itens"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700"
        >
          Ver todos <ArrowUpRight size={15} />
        </Link>
      </div>
      <ItemTabela itens={lista.itens.slice(0, 5)} />
    </>
  );
}
