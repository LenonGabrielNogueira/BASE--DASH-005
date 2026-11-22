import { prisma } from "@/server/db";
import type { Contexto, ContextoUnidade } from "@/types";
import { totaisPorItem } from "./saldos";
import { linkLocalizacao, type Tipo } from "./localizacoes";
export type ResultadoBuscaLocalizacao = {
  id: string;
  tipo: Tipo;
  codigo: string;
  nome: string | null;
  href: string;
};
export async function buscarLocalizacoes(
  c: ContextoUnidade,
  termo: string,
): Promise<ResultadoBuscaLocalizacao[]> {
  const q = termo.trim().slice(0, 100);
  if (!q) return [];
  const base = {
    empresaId: c.empresaId,
    unidadeId: c.unidadeId,
    deletadoEm: null,
  };
  const [secoes, modulos, prateleiras, posicoes] = await Promise.all([
    prisma.secao.findMany({
      where: {
        ...base,
        OR: [
          { codigo: q.toUpperCase() },
          { nome: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nome: true, codigo: true },
      orderBy: { codigo: "asc" },
      take: 20,
    }),
    prisma.modulo.findMany({
      where: {
        ...base,
        OR: [
          { codigo: q.toUpperCase() },
          { nome: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nome: true, codigo: true },
      orderBy: { codigo: "asc" },
      take: 20,
    }),
    prisma.prateleira.findMany({
      where: {
        ...base,
        OR: [
          { codigo: q.toUpperCase() },
          { nome: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nome: true, codigo: true },
      orderBy: { codigo: "asc" },
      take: 20,
    }),
    prisma.posicao.findMany({
      where: { ...base, codigo: q.toUpperCase() },
      select: { id: true, codigo: true },
      take: 1,
    }),
  ]);
  const todos: Omit<ResultadoBuscaLocalizacao, "href">[] = [
    ...secoes.map((r) => ({ ...r, tipo: "SECAO" as const })),
    ...modulos.map((r) => ({ ...r, tipo: "MODULO" as const })),
    ...prateleiras.map((r) => ({ ...r, tipo: "PRATELEIRA" as const })),
    ...posicoes.map((r) => ({ ...r, nome: null, tipo: "POSICAO" as const })),
  ];
  const exatos = await Promise.all([
    prisma.secao.findFirst({
      where: { ...base, codigo: q.toUpperCase() },
      select: { id: true, nome: true, codigo: true },
    }),
    prisma.modulo.findFirst({
      where: { ...base, codigo: q.toUpperCase() },
      select: { id: true, nome: true, codigo: true },
    }),
    prisma.prateleira.findFirst({
      where: { ...base, codigo: q.toUpperCase() },
      select: { id: true, nome: true, codigo: true },
    }),
  ]);
  exatos.forEach((r, i) => {
    if (r && !todos.some((t) => t.id === r.id))
      todos.push({
        ...r,
        tipo: (["SECAO", "MODULO", "PRATELEIRA"] as const)[i],
      });
  });
  return todos
    .sort(
      (a, b) =>
        Number(b.codigo === q.toUpperCase()) -
          Number(a.codigo === q.toUpperCase()) ||
        a.codigo.localeCompare(b.codigo, "pt-BR"),
    )
    .slice(0, 20)
    .map((r) => ({ ...r, href: linkLocalizacao(r) }));
}
export type ResultadoBusca = {
  id: string;
  nome: string;
  codigoInterno: string;
  unidadeMedida: string;
  saldo?: string;
};
export async function buscar(
  c: Contexto,
  termo: string,
  somenteExato = false,
  unidade?: ContextoUnidade | null,
): Promise<ResultadoBusca[]> {
  const q = termo.trim().slice(0, 100);
  if (!q) return [];
  // Três consultas indexáveis evitam ordenar toda a empresa e preservam a prioridade.
  const select = {
    id: true,
    nome: true,
    codigoInterno: true,
    unidadeMedida: true,
  };
  const base = { empresaId: c.empresaId, deletadoEm: null };
  const [barras, interno, nomes] = await Promise.all([
    prisma.item.findMany({
      where: {
        ...base,
        codigosBarras: { some: { empresaId: c.empresaId, codigo: q } },
      },
      select,
      take: 1,
    }),
    prisma.item.findMany({
      where: { ...base, codigoInterno: q },
      select,
      take: 1,
    }),
    somenteExato
      ? Promise.resolve([])
      : prisma.item.findMany({
          where: { ...base, nome: { contains: q, mode: "insensitive" } },
          select,
          orderBy: [{ nome: "asc" }, { id: "asc" }],
          take: 20,
        }),
  ]);
  const itens = [
    ...new Map(
      [...barras, ...interno, ...nomes].map((item) => [item.id, item]),
    ).values(),
  ].slice(0, 20);
  if (!unidade || unidade.empresaId !== c.empresaId) return itens;
  const totais = await totaisPorItem(
    unidade,
    itens.map((i) => i.id),
  );
  return itens.map((i) => ({ ...i, saldo: totais.get(i.id) ?? "0" }));
}
