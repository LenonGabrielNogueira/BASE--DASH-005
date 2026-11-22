"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Erro({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border bg-white p-7">
      <h1>Não foi possível carregar</h1>
      <p className="my-4 text-slate-600">
        Confira sua conexão, a unidade e o acesso à empresa selecionada. Empresas
        desativadas não permitem acesso.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/selecionar-empresa">Selecionar empresa</Link>
        </Button>
      </div>
    </div>
  );
}
