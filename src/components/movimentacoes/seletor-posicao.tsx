"use client";

import { useState } from "react";
import { LeitorCamera } from "@/components/escanear/leitor-camera";
import { Input } from "@/components/ui/input";
import { lerPosicao } from "@/app/(app)/movimentacoes/actions";

export type OpcaoPosicao = { id: string; codigo: string };
export function SeletorPosicao({
  titulo,
  valor,
  selecionar,
  posicoes,
  unidadeId,
}: {
  titulo: string;
  valor: string | null;
  selecionar: (id: string | null) => void;
  posicoes: OpcaoPosicao[];
  unidadeId: string;
}) {
  const [busca, setBusca] = useState("");
  const opcoes = posicoes.filter(
    (p) =>
      p.id === valor ||
      p.codigo.toLowerCase().includes(busca.trim().toLowerCase()),
  );
  return (
    <fieldset className="space-y-2 rounded-lg border p-3">
      <legend className="px-1 font-semibold">{titulo}</legend>
      <label className="grid gap-1">
        Buscar por código
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} />
      </label>
      <label className="grid gap-1">
        Posição
        <select
          className="min-h-11 rounded-md border bg-background px-3"
          value={valor ?? ""}
          onChange={(e) => selecionar(e.target.value || null)}
        >
          <option value="">Sem posição</option>
          {opcoes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo}
            </option>
          ))}
        </select>
      </label>
      {busca && !opcoes.length && <p>Nenhuma posição encontrada.</p>}
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-emerald-800">
          Ler QR da posição
        </summary>
        <LeitorCamera
          aoLer={async (l, signal) => {
            if (l.tipo !== "QR")
              throw new Error("Leia o QR Code de uma posição.");
            const resp = await lerPosicao({
              token: l.destino.slice(3),
              unidadeId,
            });
            if (!resp.ok) throw new Error(resp.erro);
            if (!signal.aborted) {
              selecionar(resp.data);
              setBusca("");
            }
          }}
        />
      </details>
    </fieldset>
  );
}
