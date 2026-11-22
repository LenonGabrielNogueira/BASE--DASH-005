import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { ContextoUnidade } from "@/types";
import { exigirPapel } from "@/server/permissoes";
import { ConflitoDeDados } from "@/lib/erros";
import { etiquetasSchema } from "@/lib/validacao/qrcode";
import { imagemQr } from "@/lib/qr";
import { obterQr, idAlvo, dadosFicha } from "./qrcodes";
import { caminhoLocalizacao, type Tipo } from "./localizacoes";
import { validarUnidade } from "./unidades";
import { EtiquetaPdf } from "@/components/pdf/etiqueta-pdf";
import { FichaPdf } from "@/components/pdf/ficha-pdf";
export async function gerarEtiquetas(c: ContextoUnidade, entrada: unknown) {
  exigirPapel(c, ["ADMIN", "GERENTE", "ESTOQUISTA"]);
  await validarUnidade(c, c.unidadeId);
  const d = etiquetasSchema.parse(entrada);
  // Autoriza TODOS os alvos antes de gerar qualquer imagem.
  const qrs = await Promise.all(
    [...new Set(d.ids)].map((id) => obterQr(c, id)),
  );
  const etiquetas = await Promise.all(
    qrs.map(async (q) => {
      const caminho = await caminhoLocalizacao(c, q.tipo, idAlvo(q));
      return {
        id: q.id,
        codigo: caminho[caminho.length - 1].codigo,
        caminho: caminho.map((l) => l.codigo).join(" > "),
        qr: await imagemQr(q.token),
      };
    }),
  );
  return renderToBuffer(
    <EtiquetaPdf etiquetas={etiquetas} formato={d.formato} />,
  );
}
export async function gerarFicha(c: ContextoUnidade, tipo: Tipo, id: string) {
  exigirPapel(c, ["ADMIN", "GERENTE", "ESTOQUISTA"]);
  await validarUnidade(c, c.unidadeId);
  const ficha = await dadosFicha(c, tipo, id);
  if (!ficha.qr)
    throw new ConflitoDeDados(
      "Gere o QR Code da localização antes de imprimir a ficha.",
    );
  return renderToBuffer(<FichaPdf ficha={ficha} />);
}
