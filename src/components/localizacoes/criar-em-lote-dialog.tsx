"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarLote } from "@/app/(app)/localizacoes/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function CriarEmLoteDialog({ moduloId }: { moduloId: string }) {
  const [pendente, setPendente] = useState(false);
  const router = useRouter();
  return (
    <details className="mt-5 rounded-xl border bg-white p-5">
      <summary className="min-h-11 cursor-pointer font-semibold">
        Criar prateleiras e posições em lote
      </summary>
      <form
        className="mt-3 grid gap-4 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          const prateleiras = Number(dados.get("prateleiras"));
          const posicoes = Number(dados.get("posicoes"));
          if (
            !window.confirm(
              `Criar ${prateleiras} prateleira(s), com ${posicoes} posição(ões) em cada uma?`,
            )
          )
            return;
          setPendente(true);
          try {
            const r = await criarLote({ moduloId, prateleiras, posicoes });
            if (r.ok) {
              toast.success("Estrutura criada.");
              router.refresh();
            } else toast.error(r.erro);
          } catch {
            toast.error("Não foi possível criar a estrutura.");
          } finally {
            setPendente(false);
          }
        }}
      >
        <label>
          Prateleiras (1–20)
          <Input
            name="prateleiras"
            type="number"
            min={1}
            max={20}
            defaultValue={4}
            required
          />
        </label>
        <label>
          Posições por prateleira (1–100)
          <Input
            name="posicoes"
            type="number"
            min={1}
            max={100}
            defaultValue={6}
            required
          />
        </label>
        <Button disabled={pendente} className="self-end">
          {pendente ? "Criando…" : "Criar lote"}
        </Button>
      </form>
    </details>
  );
}
