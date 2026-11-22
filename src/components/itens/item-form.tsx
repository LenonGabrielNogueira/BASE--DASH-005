"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import { itemSchema } from "@/lib/validacao/item";
import { salvar } from "@/app/(app)/itens/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
type Dados = z.infer<typeof itemSchema>;
export function ItemForm({
  categorias,
  item,
}: {
  categorias: { id: string; nome: string }[];
  item?: Dados & { id: string; codigoInterno: string };
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof itemSchema>, unknown, Dados>({
    resolver: zodResolver(itemSchema),
    defaultValues: item ?? {
      nome: "",
      descricao: "",
      categoriaId: "",
      unidadeMedida: "UN",
      valorUnitario: "",
      altoValor: false,
      imagemUrl: "",
      ativo: true,
    },
  });
  return (
    <form
      className="formulario"
      onSubmit={handleSubmit(async (dados) => {
        try {
          const r = await salvar({ ...dados, id: item?.id });
          if (r.ok) {
            toast.success("Item salvo.");
            router.push(item ? `/itens/${item.id}` : "/itens");
            router.refresh();
          } else toast.error(r.erro);
        } catch {
          toast.error("Não foi possível salvar.");
        }
      })}
    >
      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
        Código interno:{" "}
        {item?.codigoInterno ?? "gerado automaticamente ao salvar"}
      </p>
      <label>
        Nome
        <Input {...register("nome")} />
      </label>
      <label>
        Descrição
        <textarea {...register("descricao")} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Categoria
          <select {...register("categoriaId")}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Unidade de medida
          <Input {...register("unidadeMedida")} />
        </label>
        <label>
          Valor unitário (R$)
          <Input inputMode="decimal" {...register("valorUnitario")} />
        </label>
        <label>
          Imagem (URL HTTPS)
          <Input {...register("imagemUrl")} placeholder="https://…" />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" {...register("altoValor")} /> Item de alto valor
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" {...register("ativo")} /> Item ativo
      </label>
      {Object.entries(errors).map(([campo, erro]) => (
        <p role="alert" className="text-sm text-red-700" key={campo}>
          {erro.message}
        </p>
      ))}
      <Button disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar item"}
      </Button>
    </form>
  );
}
