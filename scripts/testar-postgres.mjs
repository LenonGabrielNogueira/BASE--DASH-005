import EmbeddedPostgres from "embedded-postgres";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
const pasta = resolve(".teste-postgres", randomUUID());
if (
  !pasta.startsWith(
    resolve(".teste-postgres") + (process.platform === "win32" ? "\\" : "/"),
  )
)
  throw new Error("Diretório de teste inválido.");
class PostgresTeste extends EmbeddedPostgres {
  async stop() {
    if (!pgCtl) return super.stop();
    if (!iniciado) return;
    // No Windows o pg_ctl encerra o cluster sem depender de taskkill.
    await rodar(
      null,
      ["stop", "-D", pasta, "-m", "fast", "-w", "-t", "15"],
      pgCtl,
    );
    iniciado = false;
  }
}
const pg = new PostgresTeste({
  databaseDir: pasta,
  user: "postgres",
  password: "teste_local",
  port: 55432,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error(String(message)),
});
const env = {
  ...process.env,
  DATABASE_URL:
    "postgresql://postgres:teste_local@localhost:55432/inventario_teste?connection_limit=20&pool_timeout=180",
  DIRECT_URL:
    "postgresql://postgres:teste_local@localhost:55432/inventario_teste",
  TEST_DATABASE_URL:
    "postgresql://postgres:teste_local@localhost:55432/inventario_teste?connection_limit=20&pool_timeout=180",
  SEED_CLERK_ORG_ID: `org_seed_${randomUUID()}`,
  NEXT_PUBLIC_APP_URL: "https://inventario.example",
};
async function rodar(arquivo, args, executavel = process.execPath) {
  await new Promise((resolvePromise, reject) => {
    const p = spawn(executavel, arquivo ? [arquivo, ...args] : args, {
      stdio: "inherit",
      env,
      windowsHide: true,
    });
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`Comando terminou com código ${code}`)),
    );
  });
}
const pgCtl =
  process.platform === "win32"
    ? (await import("@embedded-postgres/windows-x64")).pg_ctl
    : null;
let iniciado = false;
try {
  console.log("Iniciando PostgreSQL temporário na porta 55432…");
  await pg.initialise();
  await pg.start();
  iniciado = true;
  await pg.createDatabase("inventario_teste");
  await rodar("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  for (let execucao = 0; execucao < 2; execucao++) {
    await rodar("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"]);
    const cliente = pg.getPgClient("inventario_teste");
    await cliente.connect();
    try {
      const { rows } = await cliente.query(
        `SELECT (SELECT count(*)::int FROM "Unidade" WHERE "empresaId" = e.id) unidades, (SELECT count(*)::int FROM "Categoria" WHERE "empresaId" = e.id) categorias, (SELECT count(*)::int FROM "Item" WHERE "empresaId" = e.id) itens, (SELECT count(*)::int FROM "CodigoBarras" WHERE "empresaId" = e.id) codigos FROM "Empresa" e WHERE "clerkOrgId" = $1`,
        [env.SEED_CLERK_ORG_ID],
      );
      if (
        rows.length !== 1 ||
        rows[0].unidades !== 2 ||
        rows[0].categorias !== 5 ||
        rows[0].itens !== 50 ||
        rows[0].codigos !== 50
      )
        throw new Error("Seed não corresponde às quantidades esperadas.");
      for (const [tabela, quantidade] of [
        ["Secao", 2],
        ["Modulo", 6],
        ["Prateleira", 24],
        ["Posicao", 144],
        ["QRCode", 8],
        ["ItemPosicao", 20],
        ["MotivoQuebra", 7],
        ["Movimentacao", 45],
      ]) {
        const resultado = await cliente.query(
          `SELECT count(*)::int quantidade FROM "${tabela}" WHERE "empresaId" = (SELECT id FROM "Empresa" WHERE "clerkOrgId" = $1)`,
          [env.SEED_CLERK_ORG_ID],
        );
        if (resultado.rows[0].quantidade !== quantidade)
          throw new Error(`Seed inválido: ${tabela}`);
      }
    } finally {
      await cliente.end();
    }
  }
  console.log(
    "Seed idempotente conferido, incluindo 7 motivos de quebra e 45 movimentações.",
  );
  await rodar("node_modules/tsx/dist/cli.mjs", [
    "scripts/reconciliar-saldos.ts",
  ]);
  await rodar("node_modules/vitest/vitest.mjs", ["run"]);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  if (iniciado) {
    try {
      await pg.stop();
    } catch (erro) {
      console.error(erro);
      process.exitCode = 1;
    }
  }
}
