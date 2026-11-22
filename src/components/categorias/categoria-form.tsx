"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import { categoriaSchema } from "@/lib/validacao/categoria";
import { salvar } from "@/app/(app)/categorias/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function CategoriaForm({
  categoria,
}: {
  categoria?: { id: string; nome: string; descricao: string | null };
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: categoria?.nome ?? "",
      descricao: categoria?.descricao ?? "",
    },
  });
  return (
    <form
      className="formulario"
      onSubmit={handleSubmit(async (dados) => {
        try {
          const r = await salvar({ ...dados, id: categoria?.id });
          if (r.ok) {
            toast.success("Categoria salva.");
            router.push("/categorias");
            router.refresh();
          } else toast.error(r.erro);
        } catch {
          toast.error("Não foi possível salvar.");
        }
      })}
    >
      <label>
        Nome
        <Input {...register("nome")} aria-invalid={!!errors.nome} />
        {errors.nome && <span role="alert">{errors.nome.message}</span>}
      </label>
      <label>
        Descrição
        <textarea {...register("descricao")} />
        {errors.descricao && (
          <span role="alert">{errors.descricao.message}</span>
        )}
      </label>
      <Button disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar categoria"}
      </Button>
    </form>
  );
}
