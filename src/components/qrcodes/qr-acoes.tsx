"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TipoLocalizacao } from "@prisma/client";
import { alterar } from "@/app/(app)/qrcodes/actions";
import { Button } from "@/components/ui/button";
export function QrAcoes({
  tipo,
  id,
  qrId,
  editar,
  versao,
}: {
  tipo: TipoLocalizacao;
  id: string;
  qrId?: string;
  editar: boolean;
  versao?: number;
}) {
  const [pendente, setPendente] = useState(false);
  const router = useRouter();
  async function executar(operacao: "gerar" | "regenerar" | "deletar") {
    if (
      operacao !== "gerar" &&
      !window.confirm(
        operacao === "regenerar"
          ? "Regenerar o QR Code? O código anterior deixará de funcionar imediatamente."
          : "Excluir este QR Code? As etiquetas atuais deixarão de funcionar.",
      )
    )
      return;
    setPendente(true);
    try {
      const r = await alterar({ tipo, id, operacao });
      if (r.ok) {
        toast.success("QR Code atualizado.");
        router.refresh();
      } else toast.error(r.erro);
    } catch {
      toast.error("Não foi possível atualizar o QR Code.");
    } finally {
      setPendente(false);
    }
  }
  return (
    <div className="space-y-3">
      {qrId && (
        <p className="text-xs text-slate-500">QR ativo · versão {versao}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {editar &&
          (!qrId ? (
            <Button disabled={pendente} onClick={() => executar("gerar")}>
              Gerar QR Code
            </Button>
          ) : (
            <>
              <Button
                disabled={pendente}
                variant="outline"
                onClick={() => executar("regenerar")}
              >
                Regenerar QR
              </Button>
              <Button
                disabled={pendente}
                variant="outline"
                onClick={() => executar("deletar")}
              >
                Excluir QR
              </Button>
            </>
          ))}
        {qrId && (
          <Button asChild variant="outline">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`/api/pdf/etiquetas?ids=${qrId}&formato=TERMICA`}
            >
              Imprimir etiqueta
            </a>
          </Button>
        )}
        {pendente && (
          <span role="status" className="text-sm">
            Atualizando…
          </span>
        )}
      </div>
    </div>
  );
}
