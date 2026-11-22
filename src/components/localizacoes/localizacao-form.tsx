"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { localizacaoSchema } from "@/lib/validacao/localizacao";
import type { z } from "zod";
import type { Tipo, Localizacao } from "@/server/services/localizacoes";
import { salvar } from "@/app/(app)/localizacoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function LocalizacaoForm({
  tipo,
  paiId,
  localizacao,
}: {
  tipo: Tipo;
  paiId?: string;
  localizacao?: Localizacao;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof localizacaoSchema>,
    unknown,
    z.output<typeof localizacaoSchema>
  >({
    resolver: zodResolver(localizacaoSchema),
    defaultValues: {
      tipo,
      paiId,
      id: localizacao?.id,
      codigo: localizacao?.codigo,
      nome: localizacao?.nome ?? "",
      descricao: localizacao?.descricao ?? "",
    },
  });
  return (
    <form
      className="formulario"
      onSubmit={handleSubmit(async (d) => {
        try {
          const r = await salvar(d);
          if (r.ok) {
            toast.success("Localização salva.");
            if (localizacao)
              router.push(
                `/localizacoes/${{ SECAO: "secoes", MODULO: "modulos", PRATELEIRA: "prateleiras", POSICAO: "posicoes" }[tipo]}/${localizacao.id}`,
              );
            else if (tipo === "SECAO") router.push("/localizacoes");
            else reset();
            router.refresh();
          } else toast.error(r.erro);
        } catch {
          toast.error("Não foi possível salvar.");
        }
      })}
    >
      {tipo === "SECAO" && (
        <label>
          Código da seção
          <Input
            {...register("codigo")}
            readOnly={!!localizacao}
            placeholder="A"
          />
        </label>
      )}
      {tipo !== "POSICAO" && (
        <label>
          Nome
          <Input
            {...register("nome")}
            placeholder={tipo === "SECAO" ? "Nome da seção" : "Opcional"}
          />
        </label>
      )}
      {tipo !== "PRATELEIRA" && (
        <label>
          Descrição
          <textarea {...register("descricao")} />
        </label>
      )}
      {tipo !== "SECAO" && (
        <p className="text-sm text-slate-500">
          Código{" "}
          {localizacao?.codigo ?? "gerado automaticamente a partir do pai"}. O
          código é imutável.
        </p>
      )}
      {Object.entries(errors).map(([k, e]) => (
        <p key={k} className="text-red-700" role="alert">
          {e.message}
        </p>
      ))}
      <Button disabled={isSubmitting}>
        {isSubmitting
          ? "Salvando…"
          : localizacao
            ? "Salvar alterações"
            : "Criar localização"}
      </Button>
    </form>
  );
}
