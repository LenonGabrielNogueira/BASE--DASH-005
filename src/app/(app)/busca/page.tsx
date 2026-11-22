import { getContexto } from "@/server/contexto";
import { BuscaGlobal } from "@/components/busca/busca-global";
export default async function Busca() {
  await getContexto();
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Pesquisa global</h1>
          <p className="subtitulo">
            Encontre itens por nome, código interno ou barras e localizações por
            código ou nome.
          </p>
        </div>
      </div>
      <BuscaGlobal />
    </>
  );
}
