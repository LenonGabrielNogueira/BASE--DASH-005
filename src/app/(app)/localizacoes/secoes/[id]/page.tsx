import { TelaLocalizacao } from "@/components/localizacoes/tela-localizacao";
export default async function Pagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TelaLocalizacao tipo="SECAO" id={(await params).id} editar={false} />;
}
