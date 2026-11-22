"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import type { CodigoBarras } from "@prisma/client";
import { codigoBarrasSchema } from "@/lib/validacao/codigo-barras";
import { salvarCodigo, excluirCodigo } from "@/app/(app)/itens/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
type Dados = z.infer<typeof codigoBarrasSchema>;
export function CodigosBarrasEditor({
  itemId,
  codigos,
  editar,
}: {
  itemId: string;
  codigos: Pick<CodigoBarras, "id" | "codigo" | "tipo">[];
  editar: boolean;
}) {
  const [id, setId] = useState<string>();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(codigoBarrasSchema),
    defaultValues: { codigo: "", tipo: "EAN13" },
  });
  return (
    <section className="mt-8 rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-bold">Códigos de barras</h2>
      {!codigos.length && (
        <p className="mb-4 text-sm text-slate-500">Nenhum código cadastrado.</p>
      )}
      {codigos.map((c) => (
        <div
          key={c.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b py-3"
        >
          <div>
            <span className="font-mono">{c.codigo}</span>
            <span className="ml-3 text-xs text-slate-500">{c.tipo}</span>
          </div>
          {editar && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setId(c.id);
                  reset({ codigo: c.codigo, tipo: c.tipo });
                }}
              >
                Editar
              </Button>
              <ConfirmarExclusao
                nome={c.codigo}
                acao={excluirCodigo.bind(null, c.id)}
              />
            </div>
          )}
        </div>
      ))}
      {editar && (
        <form
          className="mt-5 space-y-3"
          onSubmit={handleSubmit(async (dados) => {
            try {
              const r = await salvarCodigo({ itemId, id, dados });
              if (r.ok) {
                toast.success("Código salvo.");
                setId(undefined);
                reset({ codigo: "", tipo: "EAN13" });
                router.refresh();
              } else toast.error(r.erro);
            } catch {
              toast.error("Não foi possível salvar o código.");
            }
          })}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <label>
              Código
              <Input {...register("codigo")} />
            </label>
            <label>
              Tipo
              <select {...register("tipo")}>
                {["EAN13", "EAN8", "UPC", "CODE128", "OUTRO"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {errors.codigo && (
            <p role="alert" className="text-sm text-red-700">
              {errors.codigo.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando…"
                : id
                  ? "Atualizar código"
                  : "Adicionar código"}
            </Button>
            {id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setId(undefined);
                  reset({ codigo: "", tipo: "EAN13" });
                }}
              >
                Cancelar edição
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
