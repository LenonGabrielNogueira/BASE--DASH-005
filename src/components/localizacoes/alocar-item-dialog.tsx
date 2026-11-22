"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { alocar } from "@/app/(app)/localizacoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function AlocarItemDialog({
  itens,
  posicoes,
  itemId,
  posicaoId,
}: {
  itens: { id: string; nome: string; codigoInterno: string }[];
  posicoes: { id: string; codigo: string }[];
  itemId?: string;
  posicaoId?: string;
}) {
  const [pendente, setPendente] = useState(false);
  const router = useRouter();
  return (
    <details className="my-5 rounded-xl border bg-white p-5">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-emerald-800">
        + Alocar item em posição
      </summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const d = new FormData(e.currentTarget);
          setPendente(true);
          try {
            const r = await alocar({
              itemId: itemId ?? d.get("itemId"),
              posicaoId: posicaoId ?? d.get("posicaoId"),
              observacao: d.get("observacao") ?? "",
            });
            if (r.ok) {
              toast.success("Item alocado.");
              router.refresh();
            } else toast.error(r.erro);
          } catch {
            toast.error("Não foi possível alocar.");
          } finally {
            setPendente(false);
          }
        }}
      >
        {!itemId && (
          <label className="block">
            Item
            <select name="itemId" required defaultValue="">
              <option value="" disabled>
                Selecione o item
              </option>
              {itens.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.codigoInterno} · {i.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        {!posicaoId && (
          <label className="block">
            Posição na unidade atual
            <select name="posicaoId" required defaultValue="">
              <option value="" disabled>
                Selecione a posição
              </option>
              {posicoes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          Observação
          <Input name="observacao" maxLength={500} />
        </label>
        <Button
          disabled={
            pendente ||
            (!itemId && !itens.length) ||
            (!posicaoId && !posicoes.length)
          }
        >
          {pendente ? "Alocando…" : "Alocar item"}
        </Button>
        <p className="text-xs text-slate-500">
          Alocação sem quantidade. Uma posição pode conter vários itens.
        </p>
      </form>
    </details>
  );
}
