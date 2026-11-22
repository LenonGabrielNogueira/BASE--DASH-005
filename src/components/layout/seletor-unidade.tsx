"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { definirUnidadeAtual } from "@/app/(app)/unidades/actions";
export function SeletorUnidade({
  unidades,
  atual,
}: {
  unidades: { id: string; nome: string }[];
  atual?: string;
}) {
  const [pendente, iniciar] = useTransition();
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span>Unidade</span>
      <select
        aria-label="Unidade atual"
        value={atual ?? ""}
        disabled={pendente || !unidades.length}
        className="max-w-44 text-sm"
        onChange={(e) =>
          iniciar(async () => {
            const r = await definirUnidadeAtual(e.target.value);
            if (r.ok) {
              toast.success("Unidade selecionada.");
              router.push("/localizacoes");
              router.refresh();
            } else toast.error(r.erro);
          })
        }
      >
        <option value="" disabled>
          Selecione…
        </option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
