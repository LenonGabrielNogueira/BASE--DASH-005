"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ladosMovimentacao,
  nomesMovimentacao,
  requerGestao,
  tiposLancamento,
} from "@/lib/movimentacao-regras";
import { validarQuantidade } from "@/lib/quantidade";
import { consultarSaldo, registrar } from "@/app/(app)/movimentacoes/actions";
import type { ResultadoBusca } from "@/server/services/busca";
import type { Resultado } from "@/types";
import { SeletorItem } from "./seletor-item";
import { SeletorPosicao, type OpcaoPosicao } from "./seletor-posicao";
import { FotosAvariaUpload, type FotoAvaria } from "./fotos-avaria-upload";

type Tipo = (typeof tiposLancamento)[number];
const passos = ["Item", "Posição", "Quantidade", "Detalhes"];

export function MovimentacaoForm({
  tipoInicial,
  tipos,
  unidadeId,
  itemInicial,
  posicaoInicial,
  posicoes,
  motivos,
  habilitarFotos,
}: {
  tipoInicial: Tipo;
  tipos: readonly Tipo[];
  unidadeId: string;
  itemInicial: ResultadoBusca | null;
  posicaoInicial: string | null;
  posicoes: OpcaoPosicao[];
  motivos: { id: string; nome: string }[];
  habilitarFotos: boolean;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const lados = ladosMovimentacao(tipo);
  const [passo, setPasso] = useState(itemInicial ? 1 : 0);
  const [item, setItem] = useState(itemInicial);
  const [origem, setOrigem] = useState(posicaoInicial);
  const [destino, setDestino] = useState(lados.origem ? null : posicaoInicial);
  const [quantidade, setQuantidade] = useState("");
  const [motivoQuebraId, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [observacao, setObservacao] = useState("");
  const [referencia, setReferencia] = useState("");
  const [fotos, setFotos] = useState<FotoAvaria[]>([]);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState("");
  const [pendente, iniciar] = useTransition();
  const chave = useRef("");
  const id = item?.id;
  type Leitura = {
    chave: string;
    origem?: Resultado<string>;
    destino?: Resultado<string>;
  };
  const [leitura, setLeitura] = useState<Leitura>();
  const chaveSaldo = JSON.stringify([id, tipo, origem, destino, unidadeId]);
  useEffect(() => {
    chave.current ||= crypto.randomUUID();
  }, []);
  useEffect(() => {
    if (!id || passo < 2) return;
    let atual = true;
    const saldoDe = (posicaoId: string | null): Promise<Resultado<string>> =>
      consultarSaldo({ id, posicaoId, unidadeId }).catch(() => ({
        ok: false,
        erro: "Não foi possível consultar o saldo.",
      }));
    Promise.all([
      lados.origem ? saldoDe(origem) : undefined,
      lados.destino ? saldoDe(destino) : undefined,
    ]).then(([saldoOrigem, saldoDestino]) => {
      if (atual)
        setLeitura({
          chave: chaveSaldo,
          origem: saldoOrigem,
          destino: saldoDestino,
        });
    });
    return () => {
      atual = false;
    };
  }, [
    id,
    origem,
    destino,
    unidadeId,
    lados.origem,
    lados.destino,
    chaveSaldo,
    passo,
  ]);
  const saldos = leitura?.chave === chaveSaldo ? leitura : undefined;
  let q: Prisma.Decimal | null = null;
  let erroQuantidade = "";
  if (item) {
    try {
      q = validarQuantidade(quantidade, item.unidadeMedida);
    } catch (e) {
      erroQuantidade = e instanceof Error ? e.message : "Quantidade inválida.";
    }
  }
  const resultanteOrigem =
    saldos?.origem?.ok && q
      ? new Prisma.Decimal(saldos.origem.data).minus(q)
      : null;
  const resultanteDestino =
    saldos?.destino?.ok && q
      ? new Prisma.Decimal(saldos.destino.data).plus(q)
      : null;
  function avancar() {
    if (!item) return setErro("Selecione um item.");
    if (passo === 1 && lados.origem && lados.destino && origem === destino)
      return setErro("Origem e destino devem ser diferentes.");
    if (passo === 2 && !q) return setErro(erroQuantidade);
    setErro("");
    setPasso(passo + 1);
  }
  function salvar() {
    if (!item || !q) return setErro(erroQuantidade || "Selecione um item.");
    if (lados.origem && lados.destino && origem === destino)
      return setErro("Origem e destino devem ser diferentes.");
    if (tipo === "QUEBRA" && !motivoQuebraId)
      return setErro("Selecione o motivo da quebra.");
    if (requerGestao(tipo) && justificativa.trim().length < 10)
      return setErro("Informe uma justificativa com pelo menos 10 caracteres.");
    if (
      (tipo === "QUEBRA" || requerGestao(tipo)) &&
      !window.confirm(`Confirmar ${nomesMovimentacao[tipo].toLowerCase()}?`)
    )
      return;
    chave.current ||= crypto.randomUUID();
    setErro("");
    iniciar(async () => {
      try {
        const r = await registrar({
          unidadeId,
          dados: {
            tipo,
            itemId: item.id,
            quantidade,
            chaveIdempotencia: chave.current,
            posicaoOrigemId: lados.origem ? origem : null,
            posicaoDestinoId: lados.destino ? destino : null,
            motivoQuebraId: motivoQuebraId || null,
            justificativa,
            observacao,
            referencia,
            fotos: tipo === "QUEBRA" ? fotos : [],
          },
        });
        if (!r.ok) return setErro(r.erro);
        setSalvo(r.data);
        toast.success("Movimentação registrada.");
      } catch {
        setErro("Não foi possível concluir. Tente novamente.");
      }
    });
  }
  if (salvo)
    return (
      <section className="space-y-4 rounded-xl border bg-card p-4">
        <p role="status">Movimentação registrada.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/movimentacoes/${salvo}`}>Ver movimentação</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              chave.current = crypto.randomUUID();
              setSalvo("");
              setPasso(0);
              setItem(null);
              setQuantidade("");
              setMotivo("");
              setJustificativa("");
              setObservacao("");
              setReferencia("");
              setFotos([]);
              setLeitura(undefined);
            }}
          >
            Lançar outro
          </Button>
        </div>
      </section>
    );
  return (
    <fieldset
      disabled={pendente}
      className="max-w-2xl space-y-4 rounded-xl border bg-card p-4"
    >
      <label className="grid gap-1">
        Tipo
        <select
          className="min-h-11 rounded-md border bg-background px-3"
          value={tipo}
          disabled={enviandoFotos}
          onChange={(e) => {
            const novo = e.target.value as Tipo;
            setTipo(novo);
            setPasso(item ? 1 : 0);
            setErro("");
            setFotos([]);
            setEnviandoFotos(false);
            if (posicaoInicial) {
              setOrigem(posicaoInicial);
              setDestino(
                ladosMovimentacao(novo).origem ? null : posicaoInicial,
              );
            }
          }}
        >
          {tipos.map((t) => (
            <option key={t} value={t}>
              {nomesMovimentacao[t]}
            </option>
          ))}
        </select>
      </label>
      <h2 className="text-lg font-bold">
        {passo + 1} de 4 · {passos[passo]}
      </h2>
      {passo === 0 && <SeletorItem item={item} selecionar={setItem} />}
      {passo === 1 && (
        <div className="space-y-3">
          {lados.origem && (
            <SeletorPosicao
              titulo="Origem"
              valor={origem}
              selecionar={setOrigem}
              {...{ posicoes, unidadeId }}
            />
          )}
          {lados.destino && (
            <SeletorPosicao
              titulo="Destino"
              valor={destino}
              selecionar={setDestino}
              {...{ posicoes, unidadeId }}
            />
          )}
        </div>
      )}
      {passo === 2 && (
        <label className="grid gap-1">
          Quantidade ({item?.unidadeMedida})
          <Input
            inputMode={item?.unidadeMedida === "UN" ? "numeric" : "decimal"}
            maxLength={40}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </label>
      )}
      {passo >= 2 && (
        <div
          aria-live="polite"
          className="grid gap-2 rounded-lg bg-slate-50 p-3"
        >
          {(
            [
              [lados.origem, "Origem", saldos?.origem, resultanteOrigem],
              [lados.destino, "Destino", saldos?.destino, resultanteDestino],
            ] as const
          )
            .filter(([mostrar]) => mostrar)
            .map(([, nome, saldo, resultante]) => (
              <div key={nome}>
                {!saldo ? (
                  <p>Consultando saldo · {nome}…</p>
                ) : !saldo.ok ? (
                  <p role="alert">{saldo.erro}</p>
                ) : (
                  <p>
                    {nome} · Saldo atual {saldo.data.replace(".", ",")}{" "}
                    {item?.unidadeMedida}.
                    {resultante && (
                      <>
                        {" "}
                        Após o lançamento{" "}
                        <strong
                          className={resultante.lt(0) ? "text-red-700" : ""}
                        >
                          {resultante.toFixed().replace(".", ",")}{" "}
                          {item?.unidadeMedida}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
      {passo === 3 && (
        <div className="space-y-3">
          <p>
            <strong>{item?.nome}</strong> · {q?.toFixed().replace(".", ",")}{" "}
            {item?.unidadeMedida}
          </p>
          {lados.origem && (
            <p>
              Origem:{" "}
              {posicoes.find((p) => p.id === origem)?.codigo ?? "Sem posição"}
            </p>
          )}
          {lados.destino && (
            <p>
              Destino:{" "}
              {posicoes.find((p) => p.id === destino)?.codigo ?? "Sem posição"}
            </p>
          )}
          {tipo === "QUEBRA" && (
            <>
              <label className="grid gap-1">
                Motivo da quebra
                <select
                  className="min-h-11 rounded-md border bg-background px-3"
                  value={motivoQuebraId}
                  onChange={(e) => setMotivo(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {motivos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </label>
              {!motivos.length && (
                <p>Nenhum motivo ativo. Solicite o cadastro à gerência.</p>
              )}
              {habilitarFotos && (
                <FotosAvariaUpload
                  fotos={fotos}
                  aoAlterar={setFotos}
                  aoEnviar={setEnviandoFotos}
                  unidadeId={unidadeId}
                  chaveLancamento={() =>
                    (chave.current ||= crypto.randomUUID())
                  }
                />
              )}
            </>
          )}
          {requerGestao(tipo) && (
            <label className="grid gap-1">
              Justificativa (mínimo de 10 caracteres)
              <Input
                value={justificativa}
                maxLength={1000}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            </label>
          )}
          <label className="grid gap-1">
            Observação
            <textarea
              className="min-h-20 rounded-md border bg-background p-3"
              maxLength={2000}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            Referência
            <Input
              value={referencia}
              maxLength={150}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </label>
        </div>
      )}
      {erro && (
        <p role="alert" className="text-red-700">
          {erro}
        </p>
      )}
      <div className="flex justify-between gap-2">
        {passo > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={enviandoFotos}
            onClick={() => {
              setErro("");
              setPasso(passo - 1);
            }}
          >
            Voltar
          </Button>
        )}
        {passo < 3 ? (
          <Button type="button" onClick={avancar}>
            Continuar
          </Button>
        ) : (
          <Button type="button" disabled={enviandoFotos} onClick={salvar}>
            {pendente ? "Registrando…" : "Registrar movimentação"}
          </Button>
        )}
      </div>
    </fieldset>
  );
}
