import { getContexto } from "@/server/contexto";
import { exigirPapel } from "@/server/permissoes";
import { listarCategorias } from "@/server/services/categorias";
import { ItemForm } from "@/components/itens/item-form";
export default async function NovoItem() {
  const c = await getContexto();
  exigirPapel(c);
  return (
    <>
      <div className="titulo">
        <h1>Novo item</h1>
      </div>
      <ItemForm categorias={await listarCategorias(c)} />
    </>
  );
}
