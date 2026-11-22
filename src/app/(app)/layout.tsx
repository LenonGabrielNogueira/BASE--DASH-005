import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { getContexto } from "@/server/contexto";
import { listarUnidades } from "@/server/services/unidades";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { NaoEncontrado } from "@/lib/erros";
import { SeletorUnidade } from "@/components/layout/seletor-unidade";
export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId } = await auth();
  if (!orgId) redirect("/selecionar-empresa");
  const c = await getContexto();
  const unidades = (await listarUnidades(c)).filter((u) => u.ativa);
  let atual: string | undefined;
  try {
    atual = (await getUnidadeAtual(c))?.unidadeId;
  } catch (e) {
    if (!(e instanceof NaoEncontrado)) throw e;
  }
  return (
    <>
      <Sidebar />
      <div className="md:ml-60">
        <Header>
          <SeletorUnidade unidades={unidades} atual={atual} />
        </Header>
        <main
          id="conteudo"
          className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-8 md:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
