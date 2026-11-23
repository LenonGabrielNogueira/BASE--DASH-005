import type { NextConfig } from "next";
import path from "node:path";

const fontesPdfkit = [
  "./node_modules/pdfkit/js/data/*.afm",
  "./node_modules/pdfkit/js/standard-fonts/*.cjs",
];

const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "qrcode", "pdfkit"],
  outputFileTracingRoot: path.resolve(process.cwd()),
  outputFileTracingIncludes: {
    "/api/pdf/etiquetas": fontesPdfkit,
    "/api/pdf/ficha/[tipo]/[id]": fontesPdfkit,
  },
};

export default config;