"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IScannerControls } from "@zxing/browser";
import { interpretarLeitura } from "@/lib/leitura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function LeitorCamera({
  aoLer,
}: {
  aoLer?: (
    leitura: NonNullable<ReturnType<typeof interpretarLeitura>>,
    signal: AbortSignal,
  ) => Promise<void>;
} = {}) {
  const video = useRef<HTMLVideoElement>(null);
  const controles = useRef<IScannerControls | null>(null);
  const geracao = useRef(0);
  const lendo = useRef(false);
  const requisicao = useRef<AbortController | null>(null);
  const router = useRouter();
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  function parar() {
    geracao.current++;
    controles.current?.stop();
    controles.current = null;
    const stream = video.current?.srcObject;
    if (typeof MediaStream !== "undefined" && stream instanceof MediaStream)
      stream.getTracks().forEach((t) => t.stop());
    if (video.current) video.current.srcObject = null;
    setAtivo(false);
  }
  useEffect(
    () => () => {
      geracao.current++;
      controles.current?.stop();
      requisicao.current?.abort();
    },
    [],
  );
  async function resolver(valor: string) {
    if (lendo.current) return;
    lendo.current = true;
    parar();
    setErro("");
    setOcupado(true);
    const controller = new AbortController();
    requisicao.current?.abort();
    requisicao.current = controller;
    try {
      const l = interpretarLeitura(
        valor,
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
      );
      if (!l) {
        setErro("Código não reconhecido.");
        return;
      }
      if (aoLer) {
        await aoLer(l, controller.signal);
        setTexto("");
        return;
      }
      if (l.tipo === "QR") {
        router.push(l.destino);
        return;
      }
      const r = await fetch(
        `/api/busca?exato=1&q=${encodeURIComponent(l.codigo)}`,
        { signal: controller.signal },
      );
      const dados = await r.json();
      if (!r.ok)
        throw new Error(dados.erro ?? "Não foi possível consultar o código.");
      if (!dados.itens?.length) {
        setErro("Código não reconhecido.");
        return;
      }
      router.push(`/itens/${dados.itens[0].id}`);
    } catch (e) {
      if (!controller.signal.aborted)
        setErro(
          e instanceof Error ? e.message : "Não foi possível ler o código.",
        );
    } finally {
      if (!controller.signal.aborted) {
        setOcupado(false);
        lendo.current = false;
      }
    }
  }
  async function iniciar() {
    parar();
    const id = ++geracao.current;
    setErro("");
    if (!window.isSecureContext) {
      setErro(
        "A câmera exige HTTPS. Use a digitação manual ou abra uma conexão segura.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro(
        "Nenhuma câmera disponível neste navegador. Use a digitação manual.",
      );
      return;
    }
    setAtivo(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      if (id !== geracao.current) return;
      const reader = new BrowserMultiFormatReader();
      const controle = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        video.current!,
        (resultado, _erro, ctrl) => {
          if (resultado && id === geracao.current && !lendo.current) {
            ctrl.stop();
            void resolver(resultado.getText());
          }
        },
      );
      if (id !== geracao.current) controle.stop();
      else controles.current = controle;
    } catch (e) {
      if (id !== geracao.current) return;
      parar();
      const nome = e instanceof Error ? e.name : "";
      setErro(
        nome === "NotAllowedError" || nome === "PermissionDeniedError"
          ? "Permissão de câmera negada. Autorize a câmera no navegador ou use a digitação manual."
          : nome === "NotFoundError" || nome === "DevicesNotFoundError"
            ? "Nenhuma câmera encontrada. Use a digitação manual."
            : "Não foi possível abrir a câmera. Verifique se ela está em uso por outro aplicativo ou use a digitação manual.",
      );
    }
  }
  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-bold">Ler pela câmera</h2>
        <video
          ref={video}
          muted
          playsInline
          aria-label="Prévia da câmera"
          className={`mb-4 aspect-video w-full rounded-lg bg-slate-950 ${ativo ? "" : "hidden"}`}
        />
        <div className="flex gap-3">
          <Button type="button" disabled={ocupado} onClick={iniciar}>
            {ativo ? "Reiniciar câmera" : "Abrir câmera traseira"}
          </Button>
          {ativo && (
            <Button type="button" variant="outline" onClick={parar}>
              Parar câmera
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Aponte para um QR de localização ou para o código de um item.
        </p>
      </section>
      <form
        className="formulario"
        onSubmit={(e) => {
          e.preventDefault();
          void resolver(texto);
        }}
      >
        <label>
          Digitar ou colar código
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={2048}
            placeholder="URL do QR, código de barras ou código interno"
            required
          />
        </label>
        <Button disabled={ocupado}>
          {ocupado ? "Consultando…" : aoLer ? "Usar código" : "Abrir código"}
        </Button>
      </form>
      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          {erro}
        </p>
      )}
    </div>
  );
}
