import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
Font.registerHyphenationCallback((word) => [word]);
export function codigoParaImpressao(codigo: string, limite = 12) {
  const partes = codigo.split("-");
  const linhas: string[] = [];
  let linha = partes[0];
  for (const parte of partes.slice(1)) {
    if ((linha + "-" + parte).length <= limite) linha += "-" + parte;
    else {
      linhas.push(linha + "-");
      linha = parte;
    }
  }
  linhas.push(linha);
  return linhas.join("\n");
}
export type Etiqueta = {
  id: string;
  codigo: string;
  caminho: string;
  qr: string;
};
const mm = (n: number) => (n * 72) / 25.4;
const estilos = StyleSheet.create({
  pagina: { padding: 18, fontFamily: "Helvetica" },
  grade: { flexDirection: "row", flexWrap: "wrap" },
  etiqueta: {
    width: "33.3333%",
    height: 100.5,
    border: "0.4pt solid #cbd5e1",
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  qr: { width: 58, height: 58, marginRight: 5 },
  texto: { flex: 1 },
  codigo: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  caminho: { fontSize: 6.5, color: "#334155", lineHeight: 1.3 },
  termica: {
    width: mm(50),
    height: mm(30),
    padding: 4,
    fontFamily: "Helvetica",
    flexDirection: "row",
    alignItems: "center",
  },
});
export function EtiquetaPdf({
  etiquetas,
  formato,
}: {
  etiquetas: Etiqueta[];
  formato: "A4" | "TERMICA";
}) {
  if (formato === "TERMICA")
    return (
      <Document title="Etiquetas de localização">
        {etiquetas.map((e) => (
          <Page key={e.id} size={[mm(50), mm(30)]} style={estilos.termica}>
            <Image
              src={e.qr}
              style={{ width: 57, height: 57, marginRight: 4 }}
            />
            <View style={estilos.texto}>
              <Text
                style={{
                  ...estilos.codigo,
                  fontSize: e.codigo.split("-")[0].length >= 10 ? 8 : 9,
                }}
              >
                {codigoParaImpressao(e.codigo, 11)}
              </Text>
              <Text style={{ ...estilos.caminho, fontSize: 5.5 }}>
                {e.caminho}
              </Text>
            </View>
          </Page>
        ))}
      </Document>
    );
  const paginas = Array.from(
    { length: Math.ceil(etiquetas.length / 24) },
    (_, i) => etiquetas.slice(i * 24, (i + 1) * 24),
  );
  return (
    <Document title="Etiquetas de localização">
      {paginas.map((pagina, i) => (
        <Page key={i} size="A4" style={estilos.pagina}>
          <View style={estilos.grade}>
            {pagina.map((e) => (
              <View key={e.id} style={estilos.etiqueta} wrap={false}>
                <Image src={e.qr} style={estilos.qr} />
                <View style={estilos.texto}>
                  <Text style={estilos.codigo}>
                    {codigoParaImpressao(e.codigo)}
                  </Text>
                  <Text style={estilos.caminho}>{e.caminho}</Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
