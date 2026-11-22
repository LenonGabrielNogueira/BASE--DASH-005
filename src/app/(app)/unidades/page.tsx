import { getContexto } from "@/server/contexto";
import { listarUnidades } from "@/server/services/unidades";
import { salvar } from "./actions";
import { CadastroForm } from "@/components/comum/cadastro-form";
import { EstadoVazio } from "@/components/comum/estado-vazio";
export default async function Unidades() {
  const c = await getContexto();
  const unidades = await listarUnidades(c);
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Unidades</h1>
          <p className="subtitulo">
            Cadastre as filiais. Os itens pertencem à empresa e são
            compartilhados.
          </p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {c.papel !== "ESTOQUISTA" && (
          <CadastroForm acao={salvar} titulo="Nova unidade" />
        )}
        {unidades.map((u) =>
          c.papel !== "ESTOQUISTA" ? (
            <CadastroForm
              key={u.id}
              acao={salvar}
              registro={u}
              titulo={`Editar ${u.nome}`}
            />
          ) : (
            <article key={u.id} className="linha">
              <div>
                <h2>{u.nome}</h2>
                <p className="text-sm text-slate-500">
                  {u.cnpj || "CNPJ não informado"} ·{" "}
                  {u.ativa ? "Ativa" : "Desativada"}
                </p>
              </div>
            </article>
          ),
        )}
      </div>
      {!unidades.length && (
        <div className="mt-5">
          <EstadoVazio texto="Nenhuma unidade cadastrada." />
        </div>
      )}
    </>
  );
}
