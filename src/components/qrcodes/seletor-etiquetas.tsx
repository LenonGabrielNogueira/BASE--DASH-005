"use client";
import { nomesTipoLocalizacao } from "@/lib/localizacoes";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function SeletorEtiquetas({
  qrs,
}: {
  qrs: { id: string; codigo: string; caminho: string; tipo: string }[];
}) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [formato, setFormato] = useState("A4");
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label>
          Formato
          <select value={formato} onChange={(e) => setFormato(e.target.value)}>
            <option value="A4">A4 · 3 colunas × 8 linhas</option>
            <option value="TERMICA">Térmica · 50 × 30 mm</option>
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setSelecionados(
              selecionados.length ? [] : qrs.slice(0, 200).map((q) => q.id),
            )
          }
        >
          {selecionados.length ? "Limpar seleção" : "Selecionar até 200"}
        </Button>
        {selecionados.length > 0 && (
          <Button asChild>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`/api/pdf/etiquetas?${new URLSearchParams({ formato, ids: selecionados.join(",") })}`}
            >
              Imprimir {selecionados.length} etiqueta(s)
            </a>
          </Button>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Máximo de 200 etiquetas por arquivo. Para imprimir uma localização, gere
        seu QR na página de detalhes.
      </p>
      <div className="lista">
        {qrs.map((q) => (
          <label
            key={q.id}
            className="flex min-h-16 cursor-pointer items-center gap-4 rounded-xl border bg-white p-4"
          >
            <input
              type="checkbox"
              checked={selecionados.includes(q.id)}
              disabled={
                selecionados.length >= 200 && !selecionados.includes(q.id)
              }
              onChange={(e) =>
                setSelecionados(
                  e.target.checked
                    ? [...selecionados, q.id]
                    : selecionados.filter((id) => id !== q.id),
                )
              }
            />
            <span>
              <span className="font-semibold">{q.codigo}</span>
              <span className="block text-xs text-slate-500">
                {q.caminho} ·{" "}
                {
                  nomesTipoLocalizacao[
                    q.tipo as keyof typeof nomesTipoLocalizacao
                  ]
                }
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
