import { getContexto } from "@/server/contexto";
import { obterEmpresa } from "@/server/services/empresas";
import { CadastroForm } from "@/components/comum/cadastro-form";
import { salvar } from "./actions";
import Link from "next/link";
export default async function Empresas() {
  const c = await getContexto();
  const empresa = await obterEmpresa(c);
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Empresa</h1>
          <p className="subtitulo">
            Dados da empresa selecionada. Crie ou selecione outras empresas pelo
            seletor no cabeçalho.
          </p>
        </div>
      </div>
      {c.papel !== "ESTOQUISTA" ? (
        <CadastroForm
          acao={salvar}
          registro={empresa}
          titulo="Dados da empresa"
        />
      ) : (
        <article className="linha">
          <div>
            <h2>{empresa.nome}</h2>
            <p>{empresa.cnpj || "CNPJ não informado"}</p>
          </div>
        </article>
      )}
      <Link
        className="mt-5 inline-flex min-h-11 items-center text-emerald-700 underline"
        href="/selecionar-empresa"
      >
        Listar e criar empresas
      </Link>
    </>
  );
}
