import { getContexto } from "@/server/contexto";
import { exigirPapel } from "@/server/permissoes";
import { obterItem } from "@/server/services/itens";
import { listarCategorias } from "@/server/services/categorias";
import { ItemForm } from "@/components/itens/item-form";
export default async function EditarItem({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const c = await getContexto();
  exigirPapel(c);
  const [item, categorias] = await Promise.all([
    obterItem(c, (await params).id),
    listarCategorias(c),
  ]);
  return (
    <>
      <div className="titulo">
        <h1>Editar item</h1>
      </div>
      <ItemForm
        categorias={categorias}
        item={{
          ...item,
          descricao: item.descricao ?? "",
          categoriaId: item.categoriaId ?? "",
          valorUnitario: item.valorUnitario?.toString() ?? "",
          imagemUrl: item.imagemUrl ?? "",
        }}
      />
    </>
  );
}
