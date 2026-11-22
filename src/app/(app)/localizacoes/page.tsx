import Link from "next/link";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { arvoreLocalizacoes } from "@/server/services/localizacoes";
import { ArvoreLocalizacoes } from "@/components/localizacoes/arvore-localizacoes";
import { Button } from "@/components/ui/button";
export default async function Localizacoes() {
  const base = await getContexto();
  const c = await getUnidadeAtual(base);
  if (!c)
    return (
      <>
        <h1>Localizações</h1>
        <p className="my-4">
          Cadastre uma unidade ativa para organizar suas localizações.
        </p>
        <Button asChild>
          <Link href="/unidades">Cadastrar unidade</Link>
        </Button>
      </>
    );
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Localizações</h1>
          <p className="subtitulo">
            Seções, módulos, prateleiras e posições da unidade atual.
          </p>
        </div>
        {c.papel !== "ESTOQUISTA" && (
          <Button asChild>
            <Link href="/localizacoes/secoes/nova">+ Nova seção</Link>
          </Button>
        )}
      </div>
      <ArvoreLocalizacoes secoes={await arvoreLocalizacoes(c)} />
    </>
  );
}
