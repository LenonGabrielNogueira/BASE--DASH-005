import "./mensagens";
import { z } from "zod";
import { validarEan } from "@/lib/ean";
export const codigoBarrasSchema = z
  .object({
    codigo: z.string().trim().min(1, "Informe o código.").max(64),
    tipo: z.enum(["EAN13", "EAN8", "UPC", "CODE128", "OUTRO"]),
  })
  .refine(
    (d) =>
      d.tipo === "CODE128" ||
      d.tipo === "OUTRO" ||
      validarEan(d.codigo, d.tipo),
    { path: ["codigo"], message: "Código ou dígito verificador inválido." },
  );
