"use client";
import { useState } from "react";
export function AbasItem({
  children,
  localizacoes,
  estoque,
  abaInicial,
}: {
  children: React.ReactNode;
  localizacoes: React.ReactNode;
  estoque: React.ReactNode;
  abaInicial: string;
}) {
  const [aba, setAba] = useState(abaInicial);
  return (
    <>
      <nav
        aria-label="Informações do item"
        className="mb-5 flex flex-wrap gap-2 border-b"
      >
        {[
          ["dados", "Dados e códigos"],
          ["locais", "Localizações"],
          ["estoque", "Estoque"],
        ].map(([id, nome]) => (
          <button
            key={id}
            type="button"
            aria-pressed={aba === id}
            className={`min-h-11 border-b-2 px-4 py-3 text-sm font-semibold ${aba === id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-500"}`}
            onClick={() => setAba(id)}
          >
            {nome}
          </button>
        ))}
      </nav>
      {aba === "dados" ? children : aba === "locais" ? localizacoes : estoque}
    </>
  );
}
