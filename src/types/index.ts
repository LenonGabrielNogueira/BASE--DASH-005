import type { Papel } from "@prisma/client";
export type Contexto = { empresaId: string; usuarioId: string; papel: Papel };
export type ContextoUnidade = Contexto & { unidadeId: string };
export type Resultado<T> = { ok: true; data: T } | { ok: false; erro: string };
