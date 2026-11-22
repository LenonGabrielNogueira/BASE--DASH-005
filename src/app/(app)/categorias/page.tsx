import Link from "next/link";
import { getContexto } from "@/server/contexto";
import { listarCategorias } from "@/server/services/categorias";
import { CategoriaTabela } from "@/components/categorias/categoria-tabela";
import { Button } from "@/components/ui/button";
export default async function Categorias() {
  const c = await getContexto();
  const categorias = await listarCategorias(c);
  const editar = c.papel !== "ESTOQUISTA";
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Categorias</h1>
          <p className="subtitulo">
            Organize os itens em grupos que fazem sentido para sua empresa.
          </p>
        </div>
        {editar && (
          <Button asChild>
            <Link href="/categorias/nova">+ Nova categoria</Link>
          </Button>
        )}
      </div>
      <CategoriaTabela categorias={categorias} editar={editar} />
    </>
  );
}
