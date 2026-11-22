import Link from "next/link";
import { getContexto } from "@/server/contexto";
import { listarItens } from "@/server/services/itens";
import { listarCategorias } from "@/server/services/categorias";
import { filtrosSchema } from "@/lib/validacao/item";
import { ItemTabela } from "@/components/itens/item-tabela";
import { ItemFiltros } from "@/components/itens/item-filtros";
import { Paginacao } from "@/components/comum/paginacao";
import { Button } from "@/components/ui/button";
export default async function Itens({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = await getContexto();
  const entrada = await searchParams;
  const validado = filtrosSchema.safeParse(entrada);
  if (!validado.success)
    return (
      <p role="alert">
        Filtros inválidos.{" "}
        <Link className="underline" href="/itens">
          Limpar filtros
        </Link>
      </p>
    );
  const f = validado.data;
  const [lista, categorias] = await Promise.all([
    listarItens(c, f),
    listarCategorias(c),
  ]);
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Itens</h1>
          <p className="subtitulo">
            Catálogo compartilhado entre todas as unidades da empresa.
          </p>
        </div>
        {c.papel !== "ESTOQUISTA" && (
          <Button asChild>
            <Link href="/itens/novo">+ Novo item</Link>
          </Button>
        )}
      </div>
      <ItemFiltros categorias={categorias} {...f} />
      <ItemTabela itens={lista.itens} />
      <Paginacao
        pagina={f.pagina}
        total={lista.total}
        parametros={{
          q: f.q,
          categoriaId: f.categoriaId ?? "",
          ordem: f.ordem,
        }}
      />
    </>
  );
}
