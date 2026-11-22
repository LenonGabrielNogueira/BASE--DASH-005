"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  limiteFotosAvaria,
  tamanhoMaximoFotoAvaria,
  tiposFotoAvaria,
} from "@/lib/fotos-avaria";

export type FotoAvaria = { fileId: string; url: string; nome: string };
const extensao: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function FotosAvariaUpload({
  fotos,
  aoAlterar,
  aoEnviar,
  unidadeId,
  chaveLancamento,
}: {
  fotos: FotoAvaria[];
  aoAlterar: (lista: FotoAvaria[]) => void;
  aoEnviar: (enviando: boolean) => void;
  unidadeId: string;
  chaveLancamento: () => string;
}) {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState("");
  const enviando = useRef(false);

  async function enviar(arquivos: File[]) {
    if (!arquivos.length || enviando.current) return;
    if (arquivos.length + fotos.length > limiteFotosAvaria)
      return setErro("Anexe no máximo três fotos.");
    if (
      arquivos.some(
        (a) =>
          !tiposFotoAvaria.includes(a.type) ||
          a.size === 0 ||
          a.size > tamanhoMaximoFotoAvaria,
      )
    )
      return setErro("Use JPEG, PNG ou WebP com até 5 MB por foto.");
    enviando.current = true;
    setPendente(true);
    aoEnviar(true);
    setErro("");
    const adicionadas = [...fotos];
    try {
      for (const arquivo of arquivos) {
        const assinatura = await fetch("/api/imagekit/auth", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unidadeId, chave: chaveLancamento() }),
          signal: AbortSignal.timeout(10000),
        });
        const auth = await assinatura.json();
        if (!assinatura.ok)
          throw new Error(auth.erro ?? "Não foi possível autorizar a foto.");
        const form = new FormData();
        form.set("file", arquivo);
        form.set(
          "fileName",
          `${auth.prefixo}-${crypto.randomUUID()}.${extensao[arquivo.type]}`,
        );
        form.set("publicKey", auth.publicKey);
        form.set("signature", auth.signature);
        form.set("expire", String(auth.expire));
        form.set("token", auth.token);
        form.set("folder", auth.pasta);
        form.set("isPrivateFile", "true");
        form.set("overwriteFile", "false");
        form.set(
          "checks",
          '"file.mime" IN ["image/jpeg","image/png","image/webp"] AND "file.size" <= 5242880',
        );
        const resp = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(60000),
          },
        );
        const d = await resp.json();
        if (
          !resp.ok ||
          typeof d.fileId !== "string" ||
          typeof d.url !== "string"
        )
          throw new Error("Não foi possível enviar a foto ao ImageKit.");
        adicionadas.push({ fileId: d.fileId, url: d.url, nome: arquivo.name });
        aoAlterar([...adicionadas]);
      }
    } catch (e) {
      setErro(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "O envio da foto expirou. Tente novamente.",
      );
    } finally {
      enviando.current = false;
      setPendente(false);
      aoEnviar(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="grid gap-1">
        Fotos de avaria (opcional)
        <Input
          type="file"
          multiple
          accept={tiposFotoAvaria.join(",")}
          disabled={pendente || fotos.length >= limiteFotosAvaria}
          onChange={(e) => {
            const lista = Array.from(e.target.files ?? []);
            e.target.value = "";
            void enviar(lista);
          }}
        />
      </label>
      <p className="text-sm text-slate-600">
        Até três fotos em JPEG, PNG ou WebP, com até 5 MB cada.
      </p>
      {pendente && <p role="status">Enviando fotos…</p>}
      {erro && (
        <p role="alert" className="text-red-700">
          {erro}
        </p>
      )}
      {fotos.map((f) => (
        <div key={f.fileId} className="flex items-center justify-between gap-2">
          <span className="break-all text-sm">{f.nome}</span>
          <Button
            type="button"
            variant="outline"
            disabled={pendente}
            onClick={() =>
              aoAlterar(fotos.filter((foto) => foto.fileId !== f.fileId))
            }
          >
            Remover
          </Button>
        </div>
      ))}
    </div>
  );
}
