"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import type { Resultado } from "@/types";
import { cadastroSchema } from "@/lib/validacao/unidade";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
type Dados = z.infer<typeof cadastroSchema>;
export function CadastroForm({
  registro,
  acao,
  titulo,
}: {
  registro?: { id?: string; nome: string; cnpj: string | null; ativa: boolean };
  acao: (d: unknown) => Promise<Resultado<null>>;
  titulo: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof cadastroSchema>, unknown, Dados>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: registro?.nome ?? "",
      cnpj: registro?.cnpj ?? "",
      ativa: registro?.ativa ?? true,
    },
  });
  return (
    <form
      className="formulario"
      onSubmit={handleSubmit(async (dados) => {
        try {
          if (
            !dados.ativa &&
            !window.confirm("Confirma a desativação deste cadastro?")
          )
            return;
          const r = await acao({ ...dados, id: registro?.id });
          if (r.ok) {
            toast.success("Cadastro salvo.");
            if (!registro) reset();
            router.refresh();
          } else toast.error(r.erro);
        } catch {
          toast.error("Não foi possível salvar.");
        }
      })}
    >
      <h2 className="font-bold">{titulo}</h2>
      <label>
        Nome
        <Input {...register("nome")} />
      </label>
      <label>
        CNPJ (somente números)
        <Input inputMode="numeric" {...register("cnpj")} />
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" {...register("ativa")} /> Ativa
      </label>
      {Object.entries(errors).map(([key, e]) => (
        <p key={key} role="alert" className="text-red-700">
          {e.message}
        </p>
      ))}
      <Button disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
