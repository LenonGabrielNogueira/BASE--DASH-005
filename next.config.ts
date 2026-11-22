import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "qrcode"],
  outputFileTracingRoot: path.resolve(process.cwd()),
};
export default config;
