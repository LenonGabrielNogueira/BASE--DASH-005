import React from "react";
import { nomesTipoLocalizacao } from "@/lib/localizacoes";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { dadosFicha } from "@/server/services/qrcodes";
export type Ficha = Awaited<ReturnType<typeof dadosFicha>>;
const s = StyleSheet.create({
  pagina: {
    paddingTop: 74,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  cabecalho: {
    position: "absolute",
    top: 26,
    left: 32,
    right: 32,
    borderBottom: "1pt solid #047857",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
  },
  titulo: { fontSize: 23, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  subtitulo: { fontSize: 9, color: "#475569", marginBottom: 6 },
  bloco: { marginBottom: 18 },
  secao: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 9,
    marginTop: 10,
    color: "#047857",
  },
  linha: { borderBottom: "0.5pt solid #e2e8f0", paddingVertical: 7 },
  rodape: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 20,
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
  },
});
export function FichaPdf({ ficha }: { ficha: Ficha }) {
  return (
    <Document title={`Ficha ${ficha.localizacao.codigo}`}>
      <Page size="A4" style={s.pagina}>
        <View style={s.cabecalho} fixed>
          <Text>INVENTÁRIO | {ficha.unidade}</Text>
          <Text>{ficha.data}</Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 15 }}>
          <View style={{ flex: 1, paddingRight: 15 }}>
            <Text style={s.titulo}>{ficha.localizacao.codigo}</Text>
            <Text style={{ fontSize: 13, marginBottom: 10 }}>
              {ficha.localizacao.nome ||
                nomesTipoLocalizacao[ficha.localizacao.tipo]}
            </Text>
            <Text style={s.subtitulo}>{ficha.caminho}</Text>
            {ficha.localizacao.descricao && (
              <Text style={{ fontSize: 10, marginTop: 7 }}>
                {ficha.localizacao.descricao}
              </Text>
            )}
          </View>
          {ficha.qr && (
            <Image src={ficha.qr} style={{ width: 96, height: 96 }} />
          )}
        </View>
        <Text style={s.secao}>Estrutura ({ficha.filhos.length})</Text>
        {!ficha.filhos.length && (
          <Text style={s.subtitulo}>Nenhuma localização filha cadastrada.</Text>
        )}
        {ficha.filhos.map((f) => (
          <View key={f.id} style={s.linha} wrap={false}>
            <Text>
              {f.codigo}
              {f.nome ? ` - ${f.nome}` : ""}
              {f.descricao ? ` - ${f.descricao}` : ""}
            </Text>
          </View>
        ))}
        <Text style={s.secao}>Itens alocados ({ficha.itens.length})</Text>
        {!ficha.itens.length && (
          <Text style={s.subtitulo}>Nenhum item alocado.</Text>
        )}
        {ficha.itens.map((g) => (
          <View key={g.item.id} style={s.linha} wrap={g.posicoes.length > 8}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 5 }}>
              {g.item.codigoInterno} - {g.item.nome}
            </Text>
            {g.posicoes.map((p) => (
              <Text key={p.id} style={{ fontSize: 9, marginBottom: 3 }}>
                {p.codigo} - Saldo: {p.quantidade.replace(".", ",")}{" "}
                {g.item.unidadeMedida}
                {p.observacao ? ` - ${p.observacao}` : ""}
              </Text>
            ))}
          </View>
        ))}
        <Text
          style={s.rodape}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Unidade: ${ficha.unidade} | Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
