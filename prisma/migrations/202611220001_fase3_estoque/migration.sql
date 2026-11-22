-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'QUEBRA', 'TRANSFERENCIA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'ESTORNO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "removidoEm" TIMESTAMP(3), ADD COLUMN "nome" TEXT;

-- CreateTable
CREATE TABLE "Saldo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "posicaoId" TEXT,
    "quantidade" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivoQuebra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "MotivoQuebra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimentacao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "posicaoOrigemId" TEXT,
    "posicaoDestinoId" TEXT,
    "motivoQuebraId" TEXT,
    "justificativa" TEXT,
    "observacao" TEXT,
    "referencia" TEXT,
    "saldoOrigemApos" DECIMAL(14,3),
    "saldoDestinoApos" DECIMAL(14,3),
    "estornoDeId" TEXT,
    "chaveIdempotencia" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvariaFoto" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "movimentacaoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvariaFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivosQuebraPadrao" (
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "MotivosQuebraPadrao_pkey" PRIMARY KEY ("empresaId")
);

-- CreateIndex
CREATE INDEX "Saldo_empresaId_unidadeId_idx" ON "Saldo"("empresaId", "unidadeId");

-- CreateIndex
CREATE INDEX "Saldo_posicaoId_idx" ON "Saldo"("posicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Saldo_itemId_unidadeId_posicaoId_key" ON "Saldo"("itemId", "unidadeId", "posicaoId");

-- CreateIndex
CREATE INDEX "MotivoQuebra_empresaId_idx" ON "MotivoQuebra"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Movimentacao_estornoDeId_key" ON "Movimentacao"("estornoDeId");

-- CreateIndex
CREATE INDEX "Movimentacao_empresaId_unidadeId_criadoEm_idx" ON "Movimentacao"("empresaId", "unidadeId", "criadoEm");

-- CreateIndex
CREATE INDEX "Movimentacao_itemId_criadoEm_idx" ON "Movimentacao"("itemId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Movimentacao_empresaId_chaveIdempotencia_key" ON "Movimentacao"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "AvariaFoto_movimentacaoId_idx" ON "AvariaFoto"("movimentacaoId");

-- AddForeignKey
ALTER TABLE "Saldo" ADD CONSTRAINT "Saldo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saldo" ADD CONSTRAINT "Saldo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saldo" ADD CONSTRAINT "Saldo_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saldo" ADD CONSTRAINT "Saldo_posicaoId_fkey" FOREIGN KEY ("posicaoId") REFERENCES "Posicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivoQuebra" ADD CONSTRAINT "MotivoQuebra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_posicaoOrigemId_fkey" FOREIGN KEY ("posicaoOrigemId") REFERENCES "Posicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_posicaoDestinoId_fkey" FOREIGN KEY ("posicaoDestinoId") REFERENCES "Posicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_motivoQuebraId_fkey" FOREIGN KEY ("motivoQuebraId") REFERENCES "MotivoQuebra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_estornoDeId_fkey" FOREIGN KEY ("estornoDeId") REFERENCES "Movimentacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvariaFoto" ADD CONSTRAINT "AvariaFoto_movimentacaoId_fkey" FOREIGN KEY ("movimentacaoId") REFERENCES "Movimentacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MotivosQuebraPadrao" ADD CONSTRAINT "MotivosQuebraPadrao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Invariantes de estoque e unicidade de registros ativos.
ALTER TABLE "Saldo" ADD CONSTRAINT "Saldo_quantidade_nao_negativa" CHECK ("quantidade" >= 0);
CREATE UNIQUE INDEX "Saldo_sem_posicao_key" ON "Saldo" ("itemId", "unidadeId") WHERE "posicaoId" IS NULL;
CREATE UNIQUE INDEX "MotivoQuebra_nome_vigente_key" ON "MotivoQuebra" ("empresaId", "nome") WHERE "deletadoEm" IS NULL;
ALTER TABLE "Movimentacao"
  ADD CONSTRAINT "Movimentacao_quantidade_positiva" CHECK ("quantidade" > 0),
  ADD CONSTRAINT "Movimentacao_quebra_com_motivo" CHECK ("tipo" <> 'QUEBRA' OR "motivoQuebraId" IS NOT NULL),
  ADD CONSTRAINT "Movimentacao_estorno_com_original" CHECK ("tipo" <> 'ESTORNO' OR "estornoDeId" IS NOT NULL),
  ADD CONSTRAINT "Movimentacao_justificativa_estorno" CHECK ("tipo" <> 'ESTORNO' OR coalesce(length(btrim("justificativa")), 0) > 0),
  ADD CONSTRAINT "Movimentacao_justificativa_ajuste" CHECK ("tipo" NOT IN ('AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO') OR coalesce(length(btrim("justificativa")), 0) >= 10),
  ADD CONSTRAINT "Movimentacao_transferencia_lados_distintos" CHECK ("tipo" <> 'TRANSFERENCIA' OR "posicaoOrigemId" IS DISTINCT FROM "posicaoDestinoId");
