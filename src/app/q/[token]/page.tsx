import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { carregarOu404 } from "@/server/tela-localizacao";
import { resolverToken } from "@/server/services/qrcodes";
import { listarUnidades } from "@/server/services/unidades";
import { tokenSchema } from "@/lib/validacao/qrcode";
import { NaoEncontrado } from "@/lib/erros";
import { BreadcrumbLocalizacao } from "@/components/localizacoes/breadcrumb-localizacao";
import {
  caminhoLocalizacao,
  linkLocalizacao,
  listarNivel,
  tipoFilho,
} from "@/server/services/localizacoes";
import { ConteudoLocalizacao } from "@/components/localizacoes/conteudo-localizacao";
import { AtalhosMovimentacao } from "@/components/movimentacoes/atalhos-movimentacao";
import { TrocarUnidadeQr } from "@/components/qrcodes/trocar-unidade-qr";
export const dynamic = "force-dynamic";
export default async function LerQr({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const sessao = await auth();
  const token = tokenSchema.safeParse((await params).token);
  if (!token.success) notFound();
  if (!sessao.orgId)
    redirect(
      `/selecionar-empresa?retorno=${encodeURIComponent(`/q/${token.data}`)}`,
    );
  const c = await getContexto();
  const { qr, localizacao, contexto } = await carregarOu404(() =>
    resolverToken(c, token.data),
  );
  let atual = null;
  try {
    atual = await getUnidadeAtual(c);
  } catch (e) {
    if (!(e instanceof NaoEncontrado)) throw e;
  }
  const outraUnidade = atual?.unidadeId !== contexto.unidadeId;
  const unidade = (await listarUnidades(c)).find(
    (u) => u.id === contexto.unidadeId,
  )!;
  const tipo = tipoFilho[qr.tipo];
  const filhos = tipo ? await listarNivel(contexto, tipo, localizacao.id) : [];
  return (
    <main className="mx-auto max-w-5xl px-4 py-7">
      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center text-emerald-800"
      >
        ← Inventário
      </Link>
      {outraUnidade && (
        <section className="my-4 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="mb-3">
            Esta localização está na unidade <strong>{unidade.nome}</strong>,
            diferente da unidade atual. Troque a unidade para navegar pela
            estrutura e alterar alocações.
          </p>
          <TrocarUnidadeQr unidadeId={contexto.unidadeId} />
        </section>
      )}
      <BreadcrumbLocalizacao
        caminho={await caminhoLocalizacao(contexto, qr.tipo, localizacao.id)}
        navegavel={!outraUnidade}
      />
      <h1>
        {localizacao.codigo} {localizacao.nome}
      </h1>
      <p className="subtitulo">
        Unidade: {unidade.nome} · {localizacao.descricao || "Sem descrição"}
      </p>
      <section className="lista mt-6">
        {filhos.map((f) =>
          outraUnidade ? (
            <article key={f.id} className="linha">
              <span>
                {f.codigo} {f.nome}
              </span>
            </article>
          ) : (
            <Link key={f.id} className="linha" href={linkLocalizacao(f)}>
              <span>
                {f.codigo} {f.nome}
              </span>
              <span>Abrir →</span>
            </Link>
          ),
        )}
      </section>
      {qr.tipo === "POSICAO" && !outraUnidade && (
        <AtalhosMovimentacao papel={c.papel} posicaoId={localizacao.id} />
      )}
      <ConteudoLocalizacao
        contexto={contexto}
        tipo={qr.tipo}
        id={localizacao.id}
        permitirEdicao={!outraUnidade}
      />
    </main>
  );
}
