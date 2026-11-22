export function interpretarLeitura(
  valor: string,
  appUrl: string,
): { tipo: "QR"; destino: string } | { tipo: "ITEM"; codigo: string } | null {
  const texto = valor.trim();
  if (!texto) return null;
  if (/^https?:\/\//i.test(texto)) {
    try {
      const url = new URL(texto);
      const sistema = new URL(appUrl);
      if (
        url.origin === sistema.origin &&
        /^\/q\/[A-Za-z0-9_-]{22}$/.test(url.pathname) &&
        !url.username &&
        !url.password
      )
        return { tipo: "QR", destino: url.pathname };
    } catch {
      /* Pode ser um código de barras livre. */
    }
  }
  if (texto.length > 100) return null;
  // Outros conteúdos só são consultados como códigos exatos; nunca viram URLs de navegação.
  return { tipo: "ITEM", codigo: texto };
}
