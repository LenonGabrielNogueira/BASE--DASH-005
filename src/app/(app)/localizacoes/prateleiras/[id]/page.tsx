import { TelaLocalizacao } from "@/components/localizacoes/tela-localizacao";
export default async function Pagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <TelaLocalizacao tipo="PRATELEIRA" id={(await params).id} editar={false} />
  );
}
