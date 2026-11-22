import { getContexto } from "@/server/contexto";
import { exigirPapel } from "@/server/permissoes";
import { obterCategoria } from "@/server/services/categorias";
import { CategoriaForm } from "@/components/categorias/categoria-form";
export default async function EditarCategoria({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const c = await getContexto();
  exigirPapel(c);
  const categoria = await obterCategoria(c, (await params).id);
  return (
    <>
      <div className="titulo">
        <h1>Editar categoria</h1>
      </div>
      <CategoriaForm categoria={categoria} />
    </>
  );
}
