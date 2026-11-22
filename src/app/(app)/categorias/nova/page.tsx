import { getContexto } from "@/server/contexto";
import { exigirPapel } from "@/server/permissoes";
import { CategoriaForm } from "@/components/categorias/categoria-form";
export default async function NovaCategoria() {
  exigirPapel(await getContexto());
  return (
    <>
      <div className="titulo">
        <h1>Nova categoria</h1>
      </div>
      <CategoriaForm />
    </>
  );
}
