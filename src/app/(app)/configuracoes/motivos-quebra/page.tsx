import { getContexto } from "@/server/contexto";
import { listarMotivosQuebra } from "@/server/services/motivos-quebra";
import { MotivoForm } from "@/components/motivos/motivo-form";
import { notFound } from "next/navigation";

export default async function MotivosQuebraPage() {
  const contexto = await getContexto();
  if (contexto.papel === "ESTOQUISTA") notFound();
  const motivos = await listarMotivosQuebra(contexto);
  return (
    <>
      <div className="titulo">
        <h1>Motivos de quebra</h1>
      </div>
      <div className="space-y-4">
        <MotivoForm />
        {motivos.length === 0 && <p>Nenhum motivo cadastrado.</p>}
        {motivos.map((motivo) => (
          <MotivoForm key={motivo.id} motivo={motivo} />
        ))}
      </div>
    </>
  );
}
