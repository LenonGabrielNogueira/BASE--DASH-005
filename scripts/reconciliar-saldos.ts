import "dotenv/config";
import { prisma } from "../src/server/db";
import { _reconciliar } from "../src/server/services/saldos";

try {
  const divergencias = await _reconciliar();
  if (divergencias.length) {
    console.table(
      divergencias.map((d) => ({
        ...d,
        saldo: d.saldo.toFixed(),
        esperado: d.esperado.toFixed(),
      })),
    );
    process.exitCode = 1;
  } else {
    console.log("Nenhuma divergência de saldo.");
  }
} catch (erro) {
  console.error(erro);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
