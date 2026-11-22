import { contextoLocalizacao } from "@/server/tela-localizacao";
import { exigirPapel } from "@/server/permissoes";
import { LocalizacaoForm } from "@/components/localizacoes/localizacao-form";
export default async function NovaSecao() {
  exigirPapel(await contextoLocalizacao());
  return (
    <>
      <h1 className="mb-6">Nova seção</h1>
      <LocalizacaoForm tipo="SECAO" />
    </>
  );
}
