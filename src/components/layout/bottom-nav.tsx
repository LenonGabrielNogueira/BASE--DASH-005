"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  MapPin,
  ScanLine,
  Search,
  Tags,
  Store,
  Boxes,
  ArrowLeftRight,
} from "lucide-react";
const links = [
  { href: "/dashboard", nome: "Início", Icon: Home },
  { href: "/itens", nome: "Itens", Icon: Package },
  { href: "/estoque", nome: "Estoque", Icon: Boxes },
  { href: "/movimentacoes", nome: "Movimentações", Icon: ArrowLeftRight },
  { href: "/escanear", nome: "Escanear", Icon: ScanLine },
  { href: "/localizacoes", nome: "Locais", Icon: MapPin },
  { href: "/busca", nome: "Busca", Icon: Search },
  { href: "/categorias", nome: "Categorias", Icon: Tags },
  { href: "/unidades", nome: "Unidades", Icon: Store },
];
export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {links.map(({ href, nome, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex min-h-16 min-w-[52px] flex-1 px-2 flex-col items-center justify-center gap-1 text-[10px] ${path.startsWith(href) ? "font-bold text-emerald-700" : "text-slate-500"}`}
        >
          <span
            className={
              href === "/escanear"
                ? "rounded-xl bg-emerald-700 p-2 text-white"
                : ""
            }
          >
            <Icon size={21} />
          </span>
          {nome}
        </Link>
      ))}
    </nav>
  );
}
