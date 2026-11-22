import Link from "next/link";
import { Button } from "@/components/ui/button";
export function Paginacao({
  pagina,
  total,
  parametros,
}: {
  pagina: number;
  total: number;
  parametros: Record<string, string>;
}) {
  const paginas = Math.max(1, Math.ceil(total / 20));
  const href = (p: number) =>
    `?${new URLSearchParams({ ...parametros, pagina: String(p) })}`;
  return (
    <nav
      aria-label="Paginação"
      className="mt-6 flex items-center justify-between gap-2"
    >
      <span className="text-sm text-slate-500">
        Página {pagina} de {paginas} · {total} itens
      </span>
      <div className="flex gap-2">
        {pagina > 1 && (
          <Button asChild variant="outline">
            <Link href={href(pagina - 1)}>Anterior</Link>
          </Button>
        )}
        {pagina < paginas && (
          <Button asChild variant="outline">
            <Link href={href(pagina + 1)}>Próxima</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
