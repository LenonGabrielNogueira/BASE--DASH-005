import "dotenv/config";
import { prisma } from "../src/server/db";
import {
  garantirMotivosPadrao,
  listarMotivosQuebra,
} from "../src/server/services/motivos-quebra";
import { registrarMovimentacao } from "../src/server/services/movimentacoes";
import type { EntradaMovimentacao } from "../src/lib/validacao/movimentacao";
import { digitoVerificador } from "../src/lib/ean";
import { createHash, randomBytes } from "node:crypto";

function chaveSeed(empresaId: string, indice: number) {
  const hex = createHash("sha256")
    .update(`${empresaId}/fase3/${indice}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function seedEstoque(empresaId: string) {
  await garantirMotivosPadrao(empresaId);
  const unidade = await prisma.unidade.findFirst({
    where: { empresaId, ativa: true },
    orderBy: [{ criadoEm: "asc" }, { id: "asc" }],
  });
  if (!unidade) return;
  const base = { empresaId, unidadeId: unidade.id };
  const chaves = Array.from({ length: 45 }, (_, i) => chaveSeed(empresaId, i));
  const existentes = await prisma.movimentacao.findMany({
    where: { empresaId, chaveIdempotencia: { in: chaves } },
    select: { chaveIdempotencia: true },
  });
  const registradas = new Set(existentes.map((m) => m.chaveIdempotencia));
  if (registradas.size === chaves.length) return;
  const itens = await prisma.item.findMany({
    where: { empresaId, deletadoEm: null },
    select: {
      id: true,
      posicoes: {
        where: { ...base, posicao: { deletadoEm: null } },
        select: { posicaoId: true },
        orderBy: { posicao: { codigo: "asc" } },
        take: 1,
      },
    },
    orderBy: { codigoInterno: "asc" },
    take: 30,
  });
  if (itens.length < 30)
    throw new Error(
      "O seed de estoque requer os 30 primeiros itens de demonstração.",
    );
  const clerkId = "user_seed_estoque";
  const usuario = await prisma.usuario.upsert({
    where: { clerkId_empresaId: { empresaId, clerkId } },
    create: { empresaId, clerkId, papel: "ADMIN", nome: "Demonstração" },
    update: { removidoEm: null },
  });
  const c = { ...base, usuarioId: usuario.id, papel: usuario.papel };
  const [motivo] = await listarMotivosQuebra(c, true);
  if (!motivo)
    throw new Error("O seed de estoque requer um motivo de quebra ativo.");
  type Exemplo = Omit<
    Extract<EntradaMovimentacao, { itemId: string }>,
    "chaveIdempotencia" | "quantidade" | "itemId"
  >;
  let ordem = 0;
  async function lancar(itemId: string, quantidade: string, dados: Exemplo) {
    const chaveIdempotencia = chaves[ordem++];
    if (!registradas.has(chaveIdempotencia))
      await registrarMovimentacao(c, {
        ...dados,
        itemId,
        quantidade,
        chaveIdempotencia,
        referencia: "Seed da Fase 3",
      });
  }
  for (const item of itens)
    await lancar(item.id, "40", {
      tipo: "ENTRADA",
      posicaoDestinoId: item.posicoes[0]?.posicaoId ?? null,
    });
  for (const item of itens.slice(0, 10))
    await lancar(item.id, "5", {
      tipo: "SAIDA",
      posicaoOrigemId: item.posicoes[0]?.posicaoId ?? null,
    });
  for (const item of itens.slice(0, 3)) {
    const posicaoId = item.posicoes[0]?.posicaoId;
    if (!posicaoId)
      throw new Error("O seed de estoque requer alocações de demonstração.");
    await lancar(item.id, "3", {
      tipo: "TRANSFERENCIA",
      posicaoOrigemId: posicaoId,
    });
  }
  for (const item of itens.slice(3, 5))
    await lancar(item.id, "2", {
      tipo: "QUEBRA",
      posicaoOrigemId: item.posicoes[0]?.posicaoId ?? null,
      motivoQuebraId: motivo.id,
    });
}
async function main() {
  // Substitua pelo orgId real do Clerk para visualizar os dados após autenticar.
  const clerkOrgId =
    process.env.SEED_CLERK_ORG_ID || "org_exemplo_desenvolvimento";
  const empresa = await prisma.empresa.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, nome: "Empresa demonstração" },
    update: {},
  });
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Empresa" WHERE id = ${empresa.id} FOR UPDATE`;
      if (await tx.item.count({ where: { empresaId: empresa.id } })) return;
      for (const nome of ["Matriz", "Filial Centro"])
        await tx.unidade.create({ data: { nome, empresaId: empresa.id } });
      const grupos = [
        [
          "Escritório",
          "Caneta azul",
          "Caderno",
          "Papel A4",
          "Grampeador",
          "Lápis",
          "Borracha",
          "Pasta",
          "Envelope",
          "Marcador",
          "Régua",
        ],
        [
          "Informática",
          "Mouse",
          "Teclado",
          "Monitor",
          "Notebook",
          "Cabo USB",
          "Adaptador",
          "Carregador",
          "Headset",
          "Webcam",
          "Hub USB",
        ],
        [
          "Limpeza",
          "Detergente",
          "Sabão",
          "Esponja",
          "Vassoura",
          "Rodo",
          "Balde",
          "Pano",
          "Desinfetante",
          "Álcool",
          "Saco de lixo",
        ],
        [
          "Ferramentas",
          "Martelo",
          "Alicate",
          "Chave Philips",
          "Furadeira",
          "Trena",
          "Serrote",
          "Chave de fenda",
          "Nível",
          "Lima",
          "Chave inglesa",
        ],
        [
          "Mobiliário",
          "Mesa",
          "Cadeira",
          "Armário",
          "Estante",
          "Gaveteiro",
          "Bancada",
          "Prateleira",
          "Banco",
          "Suporte",
          "Arquivo",
        ],
      ];
      let numero = empresa.proxCodigo;
      for (const [nome, ...nomes] of grupos) {
        const categoria = await tx.categoria.upsert({
          where: { empresaId_nome: { empresaId: empresa.id, nome } },
          create: { empresaId: empresa.id, nome },
          update: { deletadoEm: null },
        });
        for (const nomeItem of nomes) {
          const base = `789${String(numero).padStart(9, "0")}`;
          await tx.item.create({
            data: {
              empresaId: empresa.id,
              categoriaId: categoria.id,
              nome: nomeItem,
              codigoInterno: String(numero).padStart(6, "0"),
              valorUnitario: (numero * 3.7).toFixed(2),
              codigosBarras: {
                create: {
                  empresaId: empresa.id,
                  codigo: base + digitoVerificador(base),
                  tipo: "EAN13",
                },
              },
            },
          });
          numero++;
        }
      }
      await tx.empresa.update({
        where: { id: empresa.id },
        data: { proxCodigo: numero },
      });
    },
    { timeout: 60000 },
  );
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Empresa" WHERE id = ${empresa.id} FOR UPDATE`;
      const unidade = await tx.unidade.findFirst({
        where: { empresaId: empresa.id, ativa: true },
        orderBy: [{ criadoEm: "asc" }, { id: "asc" }],
      });
      if (!unidade) return;
      const base = { empresaId: empresa.id, unidadeId: unidade.id };
      const posicoes: string[] = [];
      for (const codigo of ["A", "B"]) {
        const secao = await tx.secao.upsert({
          where: {
            unidadeId_codigo: { unidadeId: unidade.id, codigo },
            empresaId: empresa.id,
          },
          create: {
            ...base,
            codigo,
            nome: codigo === "A" ? "Materiais gerais" : "Equipamentos",
          },
          update: {},
        });
        await tx.qRCode.upsert({
          where: { secaoId: secao.id, empresaId: empresa.id },
          create: {
            empresaId: empresa.id,
            tipo: "SECAO",
            secaoId: secao.id,
            token: randomBytes(16).toString("base64url"),
          },
          update: {},
        });
        for (let m = 1; m <= 3; m++) {
          const codigoModulo = `${codigo}-${String(m).padStart(2, "0")}`;
          const modulo = await tx.modulo.upsert({
            where: {
              unidadeId_codigo: { unidadeId: unidade.id, codigo: codigoModulo },
              empresaId: empresa.id,
            },
            create: {
              ...base,
              secaoId: secao.id,
              codigo: codigoModulo,
              ordem: m,
              nome: `Módulo ${m}`,
            },
            update: {},
          });
          await tx.qRCode.upsert({
            where: { moduloId: modulo.id, empresaId: empresa.id },
            create: {
              empresaId: empresa.id,
              tipo: "MODULO",
              moduloId: modulo.id,
              token: randomBytes(16).toString("base64url"),
            },
            update: {},
          });
          for (let p = 1; p <= 4; p++) {
            const codigoPrateleira = `${codigoModulo}-P${p}`;
            const prateleira = await tx.prateleira.upsert({
              where: {
                unidadeId_codigo: {
                  unidadeId: unidade.id,
                  codigo: codigoPrateleira,
                },
                empresaId: empresa.id,
              },
              create: {
                ...base,
                moduloId: modulo.id,
                codigo: codigoPrateleira,
                ordem: p,
                nome: `Prateleira ${p}`,
              },
              update: {},
            });
            for (let n = 1; n <= 6; n++) {
              const codigoPosicao = `${codigoPrateleira}-${String(n).padStart(2, "0")}`;
              const posicao = await tx.posicao.upsert({
                where: {
                  unidadeId_codigo: {
                    unidadeId: unidade.id,
                    codigo: codigoPosicao,
                  },
                  empresaId: empresa.id,
                },
                create: {
                  ...base,
                  prateleiraId: prateleira.id,
                  codigo: codigoPosicao,
                  ordem: n,
                },
                update: {},
              });
              posicoes.push(posicao.id);
            }
          }
        }
      }
      const itens = await tx.item.findMany({
        where: { empresaId: empresa.id, deletadoEm: null },
        orderBy: { codigoInterno: "asc" },
        take: 20,
      });
      for (let i = 0; i < itens.length; i++)
        await tx.itemPosicao.upsert({
          where: {
            itemId_posicaoId: { itemId: itens[i].id, posicaoId: posicoes[i] },
            ...base,
          },
          create: {
            ...base,
            itemId: itens[i].id,
            posicaoId: posicoes[i],
            observacao: "Alocação de demonstração",
          },
          update: {},
        });
    },
    { timeout: 60000 },
  );
  await seedEstoque(empresa.id);
  console.log("Dados de exemplo das fases 1, 2 e 3 prontos.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
