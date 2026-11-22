"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registrar } from "@/app/(app)/movimentacoes/actions";

export function EstornarDialog({
  id,
  unidadeId,
}: {
  id: string;
  unidadeId: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const chave = useRef("");
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => {
    chave.current ||= crypto.randomUUID();
  }, []);
  return (
    <>
      <Button variant="outline" onClick={() => dialogo.current?.showModal()}>
        Estornar movimentação
      </Button>
      <dialog
        ref={dialogo}
        aria-labelledby="confirmar-estorno"
        className="w-[calc(100%-2rem)] max-w-md rounded-xl border bg-card p-5 backdrop:bg-slate-950/50"
        onCancel={(e) => {
          if (pendente) e.preventDefault();
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErro("");
            chave.current ||= crypto.randomUUID();
            iniciar(async () => {
              try {
                const r = await registrar({
                  unidadeId,
                  dados: {
                    tipo: "ESTORNO",
                    estornoDeId: id,
                    justificativa,
                    chaveIdempotencia: chave.current,
                  },
                });
                if (!r.ok) return setErro(r.erro);
                dialogo.current?.close();
                toast.success("Movimentação estornada.");
                router.push(`/movimentacoes/${r.data}`);
              } catch {
                setErro("Não foi possível concluir. Tente novamente.");
              }
            });
          }}
        >
          <h2 id="confirmar-estorno" className="text-xl font-bold">
            Confirmar estorno
          </h2>
          <p>
            O estorno inverte as quantidades desta movimentação nas mesmas
            posições.
          </p>
          <label className="grid gap-1">
            Justificativa
            <Input
              required
              maxLength={1000}
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              disabled={pendente}
            />
          </label>
          {erro && (
            <p role="alert" className="text-red-700">
              {erro}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pendente}
              onClick={() => dialogo.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Estornando…" : "Confirmar estorno"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
