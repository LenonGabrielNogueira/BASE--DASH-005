import { contextoLocalizacao } from "@/server/tela-localizacao";
import { listarQrs, idAlvo } from "@/server/services/qrcodes";
import { caminhoLocalizacao } from "@/server/services/localizacoes";
import { SeletorEtiquetas } from "@/components/qrcodes/seletor-etiquetas";
import { EstadoVazio } from "@/components/comum/estado-vazio";
export default async function QrCodes() {
  const c = await contextoLocalizacao();
  const qrs = await listarQrs(c);
  const etiquetas = await Promise.all(
    qrs.map(async (q) => {
      const caminho = await caminhoLocalizacao(c, q.tipo, idAlvo(q));
      return {
        id: q.id,
        tipo: q.tipo,
        codigo: caminho[caminho.length - 1].codigo,
        caminho: caminho.map((l) => l.codigo).join(" > "),
      };
    }),
  );
  return (
    <>
      <div className="titulo">
        <div>
          <h1>QR Codes e etiquetas</h1>
          <p className="subtitulo">
            Selecione QR Codes ativos da unidade atual para impressão.
          </p>
        </div>
      </div>
      {!qrs.length ? (
        <EstadoVazio texto="Nenhum QR Code ativo. Abra uma localização e gere seu QR." />
      ) : (
        <SeletorEtiquetas qrs={etiquetas} />
      )}
    </>
  );
}
