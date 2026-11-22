"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import * as D from "@/components/ui/dialog";
import type { Resultado } from "@/types";
export function ConfirmarExclusao({
  acao,
  nome,
  destino,
}: {
  acao: () => Promise<Resultado<null>>;
  nome: string;
  destino?: string;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  async function confirmar() {
    setOcupado(true);
    try {
      const r = await acao();
      if (r.ok) {
        toast.success("Cadastro excluído.");
        setAberto(false);
        if (destino) router.push(destino);
        router.refresh();
      } else toast.error(r.erro);
    } catch {
      toast.error("Não foi possível excluir.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <D.Dialog open={aberto} onOpenChange={setAberto}>
      <D.DialogTrigger asChild>
        <Button variant="outline" aria-label={`Excluir ${nome}`}>
          Excluir
        </Button>
      </D.DialogTrigger>
      <D.DialogPortal>
        <D.DialogOverlay className="fixed inset-0 z-50 bg-slate-950/50" />
        <D.DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <D.DialogTitle className="text-lg font-bold">
            Excluir {nome}?
          </D.DialogTitle>
          <D.DialogDescription className="my-4 text-slate-600">
            Confirme a exclusão deste cadastro.
          </D.DialogDescription>
          <div className="flex justify-end gap-2">
            <D.DialogCancel asChild>
              <Button variant="outline" disabled={ocupado}>
                Cancelar
              </Button>
            </D.DialogCancel>
            <Button
              variant="destructive"
              disabled={ocupado}
              onClick={confirmar}
            >
              {ocupado ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          </div>
        </D.DialogContent>
      </D.DialogPortal>
    </D.Dialog>
  );
}
