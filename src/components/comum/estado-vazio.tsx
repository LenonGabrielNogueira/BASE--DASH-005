import { PackageOpen } from "lucide-react";
export function EstadoVazio({
  texto = "Nenhum cadastro encontrado.",
}: {
  texto?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-white px-6 py-12 text-center text-slate-500">
      <PackageOpen className="mx-auto mb-3 h-9 w-9" />
      <p>{texto}</p>
    </div>
  );
}
