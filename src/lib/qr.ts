import { randomBytes } from "node:crypto";
import QR from "qrcode";
import { AppError } from "./erros";
export function gerarTokenQr() {
  return randomBytes(16).toString("base64url");
}
export function urlQr(token: string, base = process.env.NEXT_PUBLIC_APP_URL) {
  if (!base)
    throw new AppError("Configure NEXT_PUBLIC_APP_URL para gerar QR Codes.");
  let origem: URL;
  try {
    origem = new URL(base);
  } catch {
    throw new AppError("A URL pública do sistema é inválida.");
  }
  if (
    !["http:", "https:"].includes(origem.protocol) ||
    origem.username ||
    origem.password
  )
    throw new AppError("A URL pública deve usar HTTP ou HTTPS.");
  return new URL(`/q/${encodeURIComponent(token)}`, origem.origin).href;
}
export const imagemQr = (token: string, base?: string) =>
  QR.toDataURL(urlQr(token, base), {
    width: 512,
    margin: 4,
    errorCorrectionLevel: "M",
  });
export const svgQr = (token: string) =>
  QR.toString(urlQr(token), {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "M",
  });
