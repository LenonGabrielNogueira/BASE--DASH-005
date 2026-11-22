"use client";

import { useEffect, useState } from "react";
import { LeitorCamera } from "@/components/escanear/leitor-camera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResultadoBusca } from "@/server/services/busca";

export function SeletorItem({
  item,
  selecionar,
}: {
  item: ResultadoBusca | null;
  selecionar: (item: ResultadoBusca) => void;
}) {
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => {
    setItens([]);
    setErro("");
    setCarregando(!!busca.trim());
    if (!busca.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/busca?exato=0&q=${encodeURIComponent(busca)}`,
          { signal: controller.signal },
        );
        if (!r.ok) throw new Error();
        const dados = await r.json();
        if (!controller.signal.aborted) setItens(dados.itens);
      } catch {
        if (!controller.signal.aborted)
          setErro("Não foi possível pesquisar itens.");
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busca]);
  return (
    <div className="space-y-3">
      {item && (
        <p className="rounded-lg bg-emerald-50 p-3">
          Item selecionado: <strong>{item.nome}</strong> · {item.codigoInterno}
        </p>
      )}
      <label className="grid gap-1">
        Buscar item
        <Input
          value={busca}
          maxLength={100}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, código interno ou código de barras"
        />
      </label>
      {erro && <p role="alert">{erro}</p>}
      {carregando ? (
        <p role="status">Buscando itens…</p>
      ) : (
        busca.trim() && !erro && !itens.length && <p>Nenhum item encontrado.</p>
      )}
      {itens.length > 0 && (
        <ul className="grid gap-1">
          {itens.map((i) => (
            <li key={i.id}>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 w-full justify-start whitespace-normal"
                onClick={() => {
                  selecionar(i);
                  setBusca("");
                }}
              >
                {i.nome} · {i.codigoInterno}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-emerald-800">
          Ler código de barras
        </summary>
        <LeitorCamera
          aoLer={async (l, signal) => {
            if (l.tipo !== "ITEM")
              throw new Error("Leia o código de barras de um item.");
            const r = await fetch(
              `/api/busca?exato=1&q=${encodeURIComponent(l.codigo)}`,
              { signal },
            );
            const dados = await r.json();
            if (!r.ok || !dados.itens?.length)
              throw new Error("Item não encontrado pelo código informado.");
            if (!signal.aborted) selecionar(dados.itens[0]);
          }}
        />
      </details>
    </div>
  );
}
