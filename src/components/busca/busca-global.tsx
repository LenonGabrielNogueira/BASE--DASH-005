"use client";
import { nomesTipoLocalizacao } from "@/lib/localizacoes";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import type {
  ResultadoBusca,
  ResultadoBuscaLocalizacao,
} from "@/server/services/busca";
export function BuscaGlobal() {
  const [q, setQ] = useState("");
  const [itens, setItens] = useState<ResultadoBusca[]>([]);
  const [localizacoes, setLocalizacoes] = useState<ResultadoBuscaLocalizacao[]>(
    [],
  );
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const geracao = useRef(0);
  useEffect(() => {
    const id = ++geracao.current;
    const controller = new AbortController();
    setItens([]);
    setLocalizacoes([]);
    setErro("");
    setCarregando(!!q.trim());
    if (!q.trim()) return () => controller.abort();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/busca?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.erro ?? "Falha na pesquisa.");
        if (id === geracao.current) {
          setItens(d.itens);
          setLocalizacoes(d.localizacoes ?? []);
        }
      } catch (e) {
        if (!controller.signal.aborted && id === geracao.current)
          setErro(e instanceof Error ? e.message : "Falha na pesquisa.");
      } finally {
        if (id === geracao.current) setCarregando(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  return (
    <div className="max-w-3xl">
      <label className="relative block">
        <Search className="absolute left-4 top-4 text-slate-400" size={21} />
        <span className="sr-only">Pesquisar itens e localizações</span>
        <Input
          autoFocus
          className="min-h-14 pl-12"
          value={q}
          maxLength={100}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nome, código interno, barras ou localização"
        />
      </label>
      <div className="mt-5 space-y-6" aria-live="polite" aria-busy={carregando}>
        {carregando ? (
          <p className="p-6 text-slate-500">Pesquisando…</p>
        ) : erro ? (
          <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">
            {erro}
          </p>
        ) : !q.trim() ? (
          <EstadoVazio texto="Pesquise itens da empresa e localizações da unidade atual." />
        ) : !itens.length && !localizacoes.length ? (
          <EstadoVazio texto="Nenhum resultado para essa pesquisa." />
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold">Itens ({itens.length})</h2>
              {!itens.length ? (
                <p className="text-sm text-slate-500">
                  Nenhum item encontrado.
                </p>
              ) : (
                <div className="lista">
                  {itens.map((i) => (
                    <Link className="linha" key={i.id} href={`/itens/${i.id}`}>
                      <div>
                        <p className="font-semibold">{i.nome}</p>
                        <p className="font-mono text-xs text-slate-500">
                          #{i.codigoInterno}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-800">
                        {i.saldo === undefined
                          ? i.unidadeMedida
                          : `Saldo: ${i.saldo.replace(".", ",")} ${i.unidadeMedida}`}{" "}
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="mb-3 text-lg font-bold">
                Localizações ({localizacoes.length})
              </h2>
              {!localizacoes.length ? (
                <p className="text-sm text-slate-500">
                  Nenhuma localização encontrada na unidade atual.
                </p>
              ) : (
                <div className="lista">
                  {localizacoes.map((l) => (
                    <Link className="linha" key={l.id} href={l.href}>
                      <div>
                        <p className="font-semibold">
                          {l.codigo} {l.nome}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nomesTipoLocalizacao[l.tipo]}
                        </p>
                      </div>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
