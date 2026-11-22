import type { ContextoUnidade } from "@/types";
import type { Tipo } from "@/server/services/localizacoes";
import { qrDaLocalizacao } from "@/server/services/qrcodes";
import { QrAcoes } from "./qr-acoes";
import { QrPreview } from "./qr-preview";
export async function QrPainel({
  contexto,
  tipo,
  id,
  codigo,
  permitirEdicao = true,
}: {
  contexto: ContextoUnidade;
  tipo: Tipo;
  id: string;
  codigo: string;
  permitirEdicao?: boolean;
}) {
  const qr = await qrDaLocalizacao(contexto, tipo, id);
  return (
    <section className="my-6 flex flex-wrap items-center gap-5 rounded-xl border bg-white p-5">
      {qr ? (
        <QrPreview id={qr.id} codigo={codigo} versao={qr.versao} />
      ) : (
        <p className="text-sm text-slate-500">Sem QR Code ativo.</p>
      )}
      <QrAcoes
        tipo={tipo}
        id={id}
        qrId={qr?.id}
        versao={qr?.versao}
        editar={permitirEdicao && contexto.papel !== "ESTOQUISTA"}
      />
    </section>
  );
}
