import React from "react";
import { mkdir, writeFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { EtiquetaPdf, type Etiqueta } from "../src/components/pdf/etiqueta-pdf";
import { FichaPdf, type Ficha } from "../src/components/pdf/ficha-pdf";
import { imagemQr } from "../src/lib/qr";
async function main() {
  const qr = await imagemQr(
    "abcdefghijklmnopqrstuv",
    "https://inventario.example",
  );
  const etiquetas: Etiqueta[] = Array.from({ length: 25 }, (_, n) => ({
    id: String(n),
    codigo:
      n === 0
        ? "ABCDEFGHIJ-01-P20-100"
        : `A-01-P1-${String(n + 1).padStart(2, "0")}`,
    caminho:
      n === 0
        ? "ABCDEFGHIJ > ABCDEFGHIJ-01 > ABCDEFGHIJ-01-P20 > ABCDEFGHIJ-01-P20-100"
        : `A > A-01 > A-01-P1 > A-01-P1-${String(n + 1).padStart(2, "0")}`,
    qr,
  }));
  const ficha: Ficha = {
    localizacao: {
      id: "amostra",
      tipo: "SECAO",
      codigo: "A",
      nome: "Materiais de escritório e manutenção",
      descricao: "Amostra visual da Fase 2. Sem vínculo com cadastros reais.",
      unidadeId: "amostra",
      paiId: null,
      ordem: 0,
    },
    unidade: "Matriz - demonstração",
    caminho: "A",
    data: "15/11/2026",
    qr,
    filhos: [
      {
        id: "modulo",
        tipo: "MODULO",
        codigo: "A-01",
        nome: "Módulo principal",
        descricao: null,
        unidadeId: "amostra",
        paiId: "amostra",
        ordem: 1,
      },
    ],
    itens: Array.from({ length: 70 }, (_, n) => ({
      item: {
        id: String(n),
        unidadeMedida: "UN",
        codigoInterno: String(n + 1).padStart(6, "0"),
        nome: `Item de demonstração ${n + 1} - manutenção e organização`,
      },
      posicoes: [
        {
          id: `p${n}`,
          codigo: `A-01-P${Math.floor(n / 6) + 1}-${String((n % 6) + 1).padStart(2, "0")}`,
          alocacaoId: `a${n}`,
          quantidade: String(n),
          observacao: "Observação de exemplo em português.",
        },
      ],
    })),
  };
  await mkdir("output/pdf", { recursive: true });
  await writeFile(
    "output/pdf/amostra-etiquetas-a4.pdf",
    await renderToBuffer(<EtiquetaPdf etiquetas={etiquetas} formato="A4" />),
  );
  await writeFile(
    "output/pdf/amostra-etiquetas-termicas.pdf",
    await renderToBuffer(
      <EtiquetaPdf etiquetas={etiquetas.slice(0, 2)} formato="TERMICA" />,
    ),
  );
  await writeFile(
    "output/pdf/amostra-ficha.pdf",
    await renderToBuffer(<FichaPdf ficha={ficha} />),
  );
  console.log("Três amostras geradas em output/pdf.");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
