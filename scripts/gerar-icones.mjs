import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
// Ícone vetorial rasterizado diretamente: caixa branca sobre fundo verde.
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) {
    c ^= x;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(tipo, dados) {
  const t = Buffer.from(tipo);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tamanho, t, dados, crc]);
}
mkdirSync("public/icons", { recursive: true });
for (const n of [192, 512]) {
  const linhas = Buffer.alloc((n * 4 + 1) * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = x / n,
        v = y / n;
      const borda =
        u > 0.24 &&
        u < 0.76 &&
        v > 0.27 &&
        v < 0.76 &&
        (u < 0.275 ||
          u > 0.725 ||
          v < 0.305 ||
          v > 0.725 ||
          Math.abs(v - 0.46) < 0.018 ||
          (v < 0.46 && Math.abs(u - 0.5) < 0.018));
      const k = y * (n * 4 + 1) + x * 4 + 1;
      linhas[k] = borda ? 255 : 4;
      linhas[k + 1] = borda ? 255 : 120;
      linhas[k + 2] = borda ? 255 : 87;
      linhas[k + 3] = 255;
    }
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(n);
  cabecalho.writeUInt32BE(n, 4);
  cabecalho[8] = 8;
  cabecalho[9] = 6;
  writeFileSync(
    `public/icons/icon-${n}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", cabecalho),
      chunk("IDAT", deflateSync(linhas)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
