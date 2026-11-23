import type { NextConfig } from "next";
import path from "node:path";

// Inclui todos os arquivos do pdfkit (fontes e chunks carregados dinamicamente)
const arquivosPdfkit = [
  "./node_modules/pdfkit/package.json",
  "./node_modules/pdfkit/js/**/*",
];

const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "qrcode", "pdfkit"],
  outputFileTracingRoot: path.resolve(process.cwd()),
  outputFileTracingIncludes: {
    "/api/pdf/etiquetas": arquivosPdfkit,
    "/api/pdf/ficha/[tipo]/[id]": arquivosPdfkit,
  },
};

export default config;