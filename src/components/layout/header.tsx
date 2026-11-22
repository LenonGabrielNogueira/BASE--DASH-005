"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Search, Building2 } from "lucide-react";
export function Header({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        router.push("/busca");
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [router]);
  return (
    <header className="sticky top-0 z-10 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
      <Link
        href="/busca"
        className="flex min-h-11 items-center gap-3 text-sm text-slate-500"
      >
        <Search size={19} />
        <span>Pesquisar</span>
        <kbd className="hidden rounded border px-1.5 text-[10px] lg:inline">
          Ctrl K
        </kbd>
      </Link>
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3">
        {children}
        <Link
          href="/empresas"
          aria-label="Cadastro da empresa"
          className="flex min-h-11 min-w-11 items-center justify-center md:hidden"
        >
          <Building2 size={20} />
        </Link>
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
        />
        <UserButton />
      </div>
    </header>
  );
}
