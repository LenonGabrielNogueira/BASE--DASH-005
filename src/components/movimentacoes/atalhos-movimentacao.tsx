import Link from "next/link";
import { Button } from "@/components/ui/button";
import { nomesMovimentacao } from "@/lib/movimentacao-regras";
import type { Papel } from "@prisma/client";
import { TipoMovimentacaoBadge } from "./historico-tabela";

export function AtalhosMovimentacao({
  papel,
  itemId,
  posicaoId,
}: {
  papel: Papel;
  itemId?: string;
  posicaoId?: string;
}) {
  if (!["ADMIN", "GERENTE", "ESTOQUISTA"].includes(papel)) return null;
  return (
    <div className="my-4 flex flex-wrap gap-2">
      {(["ENTRADA", "SAIDA", "QUEBRA", "TRANSFERENCIA"] as const).map(
        (tipo) => {
          const query = new URLSearchParams({ tipo });
          if (itemId) query.set("itemId", itemId);
          if (posicaoId) query.set("posicaoId", posicaoId);
          return (
            <Button key={tipo} variant="outline" asChild>
              <Link href={`/movimentacoes/nova?${query}`}>
                <TipoMovimentacaoBadge
                  tipo={tipo}
                  nome={
                    tipo === "TRANSFERENCIA"
                      ? "Transferir"
                      : nomesMovimentacao[tipo]
                  }
                />
              </Link>
            </Button>
          );
        },
      )}
    </div>
  );
}
