import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { SaldoTabela } from "@/components/estoque/saldo-tabela";
import { getContexto } from "@/server/contexto";
import { getUnidadeAtual } from "@/server/unidade-atual";
import { listarCategorias } from "@/server/services/categorias";
import { listarEstoque } from "@/server/services/saldos";

export default async function Estoque({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [c, query] = await Promise.all([getContexto(), searchParams]);
  const unidade = await getUnidadeAtual(c);
  if (!unidade)
    return (
      <EstadoVazio texto="Cadastre e selecione uma unidade ativa para consultar o estoque." />
    );
  const categoriaId =
    typeof query.categoriaId === "string" ? query.categoriaId : undefined;
  const comSaldo = query.comSaldo === "1";
  const [categorias, itens] = await Promise.all([
    listarCategorias(c),
    listarEstoque(unidade, { categoriaId: categoriaId || undefined, comSaldo }),
  ]);
  return (
    <>
      <div className="titulo">
        <h1>Estoque</h1>
        <Button asChild>
          <Link href="/movimentacoes">Movimentações</Link>
        </Button>
      </div>
      <form className="mb-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          Categoria
          <select
            name="categoriaId"
            className="min-h-11 rounded-md border bg-background px-3"
            defaultValue={categoriaId ?? ""}
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="comSaldo"
            value="1"
            defaultChecked={comSaldo}
          />{" "}
          Apenas com saldo
        </label>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>
      <SaldoTabela itens={itens} />
    </>
  );
}
