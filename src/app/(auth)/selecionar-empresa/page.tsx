import { OrganizationList } from "@clerk/nextjs";
export default async function SelecionarEmpresa({
  searchParams,
}: {
  searchParams: Promise<{ retorno?: string }>;
}) {
  const { retorno } = await searchParams;
  const destino =
    retorno && /^\/q\/[A-Za-z0-9_-]{22}$/.test(retorno)
      ? retorno
      : "/dashboard";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1>Selecione sua empresa</h1>
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl={destino}
        afterCreateOrganizationUrl={destino}
      />
    </main>
  );
}
