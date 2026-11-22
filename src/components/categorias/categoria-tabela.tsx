import Link from "next/link";
import type { Categoria } from "@prisma/client";
import { excluir } from "@/app/(app)/categorias/actions";
import { ConfirmarExclusao } from "@/components/comum/confirmar-exclusao";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
export function CategoriaTabela({
  categorias,
  editar,
}: {
  categorias: Categoria[];
  editar: boolean;
}) {
  if (!categorias.length)
    return (
      <EstadoVazio texto="Nenhuma categoria cadastrada. Crie a primeira categoria para organizar seus itens." />
    );
  return (
    <div className="lista">
      {categorias.map((c) => (
        <article key={c.id} className="linha">
          <div>
            <h2 className="font-semibold">{c.nome}</h2>
            <p className="text-sm text-slate-500">
              {c.descricao || "Sem descrição"}
            </p>
          </div>
          {editar && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/categorias/${c.id}/editar`}>Editar</Link>
              </Button>
              <ConfirmarExclusao
                nome={c.nome}
                acao={excluir.bind(null, c.id)}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
