"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  excluir,
  salvar,
} from "@/app/(app)/configuracoes/motivos-quebra/actions";

type Motivo = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
};

export function MotivoForm({ motivo }: { motivo?: Motivo }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = new FormData(form);
    setErro("");
    iniciar(async () => {
      const resultado = await salvar({
        id: motivo?.id,
        nome: dados.get("nome"),
        descricao: dados.get("descricao"),
        ativo: dados.get("ativo") === "on",
      });
      if (!resultado.ok) return setErro(resultado.erro);
      if (!motivo) form.reset();
      toast.success("Motivo salvo.");
    });
  }
  function remover(id: string) {
    if (!window.confirm("Excluir este motivo de quebra?")) return;
    setErro("");
    iniciar(async () => {
      const resultado = await excluir(id);
      if (!resultado.ok) return setErro(resultado.erro);
      toast.success("Motivo excluído.");
    });
  }
  return (
    <form onSubmit={enviar} className="rounded-xl border bg-card p-4">
      <fieldset
        disabled={pendente}
        className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto] md:items-end"
      >
        <label className="grid gap-1">
          Nome
          <Input
            name="nome"
            required
            maxLength={100}
            defaultValue={motivo?.nome}
          />
        </label>
        <label className="grid gap-1">
          Descrição
          <Input
            name="descricao"
            maxLength={500}
            defaultValue={motivo?.descricao ?? ""}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={motivo?.ativo ?? true}
          />{" "}
          Ativo
        </label>
        <div className="flex gap-2">
          <Button type="submit">
            {pendente ? "Salvando…" : motivo ? "Salvar" : "Adicionar motivo"}
          </Button>
          {motivo && (
            <Button
              variant="outline"
              type="button"
              onClick={() => remover(motivo.id)}
            >
              Excluir
            </Button>
          )}
        </div>
      </fieldset>
      {erro && (
        <p role="alert" className="mt-2 text-red-700">
          {erro}
        </p>
      )}
    </form>
  );
}
