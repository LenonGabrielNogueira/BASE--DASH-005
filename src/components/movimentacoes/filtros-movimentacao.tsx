import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  nomesMovimentacao,
  tiposMovimentacao,
} from "@/lib/movimentacao-regras";

type Opcao = { id: string; nome: string };
export function FiltrosMovimentacao({
  parametros,
  itens,
  posicoes,
  usuarios,
}: {
  parametros: Record<string, string>;
  itens: Opcao[];
  posicoes: Opcao[];
  usuarios: Opcao[];
}) {
  const filtros = [
    {
      campo: "tipo",
      rotulo: "Tipo",
      opcoes: tiposMovimentacao.map((t) => ({
        id: t,
        nome: nomesMovimentacao[t],
      })),
    },
    { campo: "itemId", rotulo: "Item", opcoes: itens },
    {
      campo: "posicaoId",
      rotulo: "Posição",
      opcoes: [{ id: "sem-posicao", nome: "Sem posição" }, ...posicoes],
    },
    { campo: "usuarioId", rotulo: "Usuário", opcoes: usuarios },
  ];
  return (
    <form className="mb-5 grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
      {filtros.map(({ campo, rotulo, opcoes }) => (
        <label className="grid min-w-0 gap-1" key={campo}>
          {rotulo}
          <select
            name={campo}
            defaultValue={parametros[campo] ?? ""}
            className="min-h-11 w-full rounded-md border bg-background px-3"
          >
            <option value="">Todos</option>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label className="grid gap-1">
        Início
        <Input type="date" name="inicio" defaultValue={parametros.inicio} />
      </label>
      <label className="grid gap-1">
        Fim
        <Input type="date" name="fim" defaultValue={parametros.fim} />
      </label>
      <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        <Button variant="outline" asChild>
          <Link href="/movimentacoes">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
