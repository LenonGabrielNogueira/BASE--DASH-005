"use client";
import { useEffect, useState } from "react";
export function QrPreview({
  id,
  codigo,
  versao = 1,
}: {
  id: string;
  codigo: string;
  versao?: number;
}) {
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">(
    "carregando",
  );
  useEffect(() => setEstado("carregando"), [id, versao]);
  return (
    <div className="space-y-2">
      <img
        src={`/api/qrcodes/${id}/imagem?v=${versao}`}
        onLoad={() => setEstado("pronto")}
        onError={() => setEstado("erro")}
        width={192}
        height={192}
        alt={`QR Code da localização ${codigo}`}
        className="h-48 w-48 rounded-lg border bg-white"
      />
      <p
        aria-live="polite"
        className={`max-w-48 text-xs ${estado === "erro" ? "text-red-700" : "text-slate-500"}`}
      >
        {estado === "carregando"
          ? "Carregando QR Code…"
          : estado === "erro"
            ? "Não foi possível carregar o QR Code. Tente atualizar a página."
            : "QR Code pronto para leitura."}
      </p>
    </div>
  );
}
