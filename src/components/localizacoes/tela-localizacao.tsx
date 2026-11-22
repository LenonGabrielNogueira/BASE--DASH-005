import { nomesTipoLocalizacao } from "@/lib/localizacoes";
import Link from "next/link";
import { contextoLocalizacao, carregarOu404 } from "@/server/tela-localizacao";
import {
  obterLocalizacao,
  listarNivel,
  caminhoLocalizacao,
  tipoFilho,
  linkLocalizacao,
  type Tipo,
} from "@/server/services/localizacoes";
import { LocalizacaoForm } from "./localizacao-form";
import { BreadcrumbLocalizacao } from "./breadcrumb-localizacao";
import { CriarEmLoteDialog } from "./criar-em-lote-dialog";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { excluir } from "@/app/(app)/localizacoes/actions";
import { ConteudoLocalizacao } from "./conteudo-localizacao";
import { AtalhosMovimentacao } from "@/components/movimentacoes/atalhos-movimentacao";
import { QrPainel } from "@/components/qrcodes/qr-painel";
export async function TelaLocalizacao({
  tipo,
  id,
  editar = false,
}: {
  tipo: Tipo;
  id: string;
  editar?: boolean;
}) {
  const c = await contextoLocalizacao();
  const local = await carregarOu404(() => obterLocalizacao(c, tipo, id));
  const caminho = await caminhoLocalizacao(c, tipo, id);
  const podeEditar = c.papel !== "ESTOQUISTA";
  if (editar) {
    if (!podeEditar)
      return <p role="alert">Você não tem permissão para editar.</p>;
    return (
      <>
        <BreadcrumbLocalizacao caminho={caminho} />
        <h1 className="mb-6">Editar {local.codigo}</h1>
        <LocalizacaoForm tipo={tipo} localizacao={local} />
      </>
    );
  }
  const filho = tipoFilho[tipo];
  const filhos = filho ? await listarNivel(c, filho, id) : [];
  return (
    <>
      <BreadcrumbLocalizacao caminho={caminho} />
      <div className="titulo">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">
            {nomesTipoLocalizacao[tipo]}
          </p>
          <h1>
            {local.codigo}
            {local.nome ? ` · ${local.nome}` : ""}
          </h1>
          <p className="subtitulo">{local.descricao || "Sem descrição"}</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`${linkLocalizacao(local)}/editar`}>Editar</Link>
            </Button>
            <ConfirmarExclusao
              nome={local.codigo}
              destino={
                caminho.length > 1
                  ? linkLocalizacao(caminho[caminho.length - 2])
                  : "/localizacoes"
              }
              acao={excluir.bind(null, { tipo, id })}
            />
          </div>
        )}
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/qrcodes">QR Codes e etiquetas</Link>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`/api/pdf/ficha/${tipo}/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Imprimir ficha
          </a>
        </Button>
      </div>
      {filho && (
        <>
          <h2 className="mb-4 text-lg font-bold">
            {filho === "MODULO"
              ? "Módulos"
              : filho === "PRATELEIRA"
                ? "Prateleiras"
                : "Posições"}
          </h2>
          {!filhos.length ? (
            <EstadoVazio texto="Nenhuma localização filha cadastrada." />
          ) : (
            <div className="lista">
              {filhos.map((f) => (
                <Link className="linha" key={f.id} href={linkLocalizacao(f)}>
                  <span className="font-semibold">
                    {f.codigo} {f.nome}
                  </span>
                  <span>Abrir →</span>
                </Link>
              ))}
            </div>
          )}
          {podeEditar && (
            <details className="mt-5">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold text-emerald-800">
                + Adicionar{" "}
                {nomesTipoLocalizacao[filho].toLocaleLowerCase("pt-BR")}
              </summary>
              <LocalizacaoForm tipo={filho} paiId={id} />
            </details>
          )}
        </>
      )}
      {tipo === "MODULO" && podeEditar && <CriarEmLoteDialog moduloId={id} />}
      <QrPainel contexto={c} tipo={tipo} id={id} codigo={local.codigo} />
      {tipo === "POSICAO" && (
        <AtalhosMovimentacao papel={c.papel} posicaoId={id} />
      )}
      <ConteudoLocalizacao contexto={c} tipo={tipo} id={id} />
    </>
  );
}
