export function digitoVerificador(base: string): string {
  const soma = [...base]
    .reverse()
    .reduce(
      (total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 3 : 1),
      0,
    );
  return String((10 - (soma % 10)) % 10);
}
export function validarEan(
  codigo: string,
  tipo: "EAN13" | "EAN8" | "UPC",
): boolean {
  const tamanho = { EAN13: 13, EAN8: 8, UPC: 12 }[tipo];
  return (
    new RegExp(`^\\d{${tamanho}}$`).test(codigo) &&
    digitoVerificador(codigo.slice(0, -1)) === codigo.at(-1)
  );
}
