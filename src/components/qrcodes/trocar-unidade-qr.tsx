"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { definirUnidadeAtual } from "@/app/(app)/unidades/actions";
import { Button } from "@/components/ui/button";
export function TrocarUnidadeQr({ unidadeId }: { unidadeId: string }) {
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          const r = await definirUnidadeAtual(unidadeId);
          if (r.ok) {
            toast.success("Unidade atualizada.");
            router.refresh();
          } else toast.error(r.erro);
        })
      }
    >
      {pendente ? "Trocando…" : "Trabalhar nesta unidade"}
    </Button>
  );
}
