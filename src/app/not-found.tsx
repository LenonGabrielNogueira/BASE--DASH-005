import Link from "next/link";
export default function NaoEncontrado() {
  return (
    <main className="p-8">
      <h1>Cadastro não encontrado</h1>
      <p className="my-4">O cadastro não está disponível nesta empresa.</p>
      <Link
        className="inline-flex min-h-11 items-center text-emerald-700 underline"
        href="/dashboard"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
