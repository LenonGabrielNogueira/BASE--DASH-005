"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Building2,
  Store,
  Layers3,
  MapPin,
  ScanLine,
  QrCode,
  Boxes,
  ArrowLeftRight,
} from "lucide-react";
import { navegacao } from "./navegacao";
const icones = {
  painel: LayoutDashboard,
  itens: Package,
  categorias: Tags,
  unidades: Store,
  empresa: Building2,
  locais: MapPin,
  escanear: ScanLine,
  qr: QrCode,
  estoque: Boxes,
  movimentacoes: ArrowLeftRight,
};
export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col overflow-y-auto border-r bg-white px-5 py-7 md:flex">
      <Link
        href="/dashboard"
        className="mb-10 flex min-h-11 items-center gap-3 text-xl font-bold tracking-tight"
      >
        <span className="rounded-xl bg-emerald-700 p-2 text-white">
          <Layers3 />
        </span>
        Inventário<span className="sr-only">Início</span>
      </Link>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Área de trabalho
      </p>
      <nav className="space-y-2">
        {navegacao.map((n) => {
          const Icon = icones[n.icone as keyof typeof icones];
          const ativo = path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={ativo ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${ativo ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Icon size={19} />
              {n.nome}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl bg-slate-50 p-4">
        <span className="text-xs font-bold text-emerald-800">
          Catálogo da empresa
        </span>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Seus itens e cadastros organizados em um só lugar.
        </p>
      </div>
    </aside>
  );
}
