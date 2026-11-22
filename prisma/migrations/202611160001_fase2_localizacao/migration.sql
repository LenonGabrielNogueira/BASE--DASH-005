-- CreateEnum
CREATE TYPE "TipoLocalizacao" AS ENUM ('SECAO', 'MODULO', 'PRATELEIRA', 'POSICAO');

-- CreateTable
CREATE TABLE "Secao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Secao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "secaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prateleira" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT,
    "ordem" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Prateleira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posicao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "prateleiraId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Posicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPosicao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "posicaoId" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemPosicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tipo" "TipoLocalizacao" NOT NULL,
    "secaoId" TEXT,
    "moduloId" TEXT,
    "prateleiraId" TEXT,
    "posicaoId" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Secao_empresaId_unidadeId_idx" ON "Secao"("empresaId", "unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Secao_unidadeId_codigo_key" ON "Secao"("unidadeId", "codigo");

-- CreateIndex
CREATE INDEX "Modulo_empresaId_unidadeId_secaoId_idx" ON "Modulo"("empresaId", "unidadeId", "secaoId");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_unidadeId_codigo_key" ON "Modulo"("unidadeId", "codigo");

-- CreateIndex
CREATE INDEX "Prateleira_empresaId_unidadeId_moduloId_idx" ON "Prateleira"("empresaId", "unidadeId", "moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "Prateleira_unidadeId_codigo_key" ON "Prateleira"("unidadeId", "codigo");

-- CreateIndex
CREATE INDEX "Posicao_empresaId_unidadeId_prateleiraId_idx" ON "Posicao"("empresaId", "unidadeId", "prateleiraId");

-- CreateIndex
CREATE UNIQUE INDEX "Posicao_unidadeId_codigo_key" ON "Posicao"("unidadeId", "codigo");

-- CreateIndex
CREATE INDEX "ItemPosicao_empresaId_unidadeId_posicaoId_idx" ON "ItemPosicao"("empresaId", "unidadeId", "posicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPosicao_itemId_posicaoId_key" ON "ItemPosicao"("itemId", "posicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_token_key" ON "QRCode"("token");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_secaoId_key" ON "QRCode"("secaoId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_moduloId_key" ON "QRCode"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_prateleiraId_key" ON "QRCode"("prateleiraId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_posicaoId_key" ON "QRCode"("posicaoId");

-- CreateIndex
CREATE INDEX "QRCode_empresaId_idx" ON "QRCode"("empresaId");

-- AddForeignKey
ALTER TABLE "Secao" ADD CONSTRAINT "Secao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secao" ADD CONSTRAINT "Secao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "Secao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prateleira" ADD CONSTRAINT "Prateleira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prateleira" ADD CONSTRAINT "Prateleira_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prateleira" ADD CONSTRAINT "Prateleira_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posicao" ADD CONSTRAINT "Posicao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posicao" ADD CONSTRAINT "Posicao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posicao" ADD CONSTRAINT "Posicao_prateleiraId_fkey" FOREIGN KEY ("prateleiraId") REFERENCES "Prateleira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPosicao" ADD CONSTRAINT "ItemPosicao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPosicao" ADD CONSTRAINT "ItemPosicao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPosicao" ADD CONSTRAINT "ItemPosicao_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPosicao" ADD CONSTRAINT "ItemPosicao_posicaoId_fkey" FOREIGN KEY ("posicaoId") REFERENCES "Posicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "Secao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_prateleiraId_fkey" FOREIGN KEY ("prateleiraId") REFERENCES "Prateleira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_posicaoId_fkey" FOREIGN KEY ("posicaoId") REFERENCES "Posicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_alvo_tipo_check" CHECK (
 num_nonnulls("secaoId", "moduloId", "prateleiraId", "posicaoId") = 1 AND (
 (tipo = 'SECAO' AND "secaoId" IS NOT NULL) OR
 (tipo = 'MODULO' AND "moduloId" IS NOT NULL) OR
 (tipo = 'PRATELEIRA' AND "prateleiraId" IS NOT NULL) OR
 (tipo = 'POSICAO' AND "posicaoId" IS NOT NULL)));

CREATE INDEX "Secao_nome_trgm_idx" ON "Secao" USING GIN (nome gin_trgm_ops);
CREATE INDEX "Modulo_nome_trgm_idx" ON "Modulo" USING GIN (nome gin_trgm_ops);
CREATE INDEX "Prateleira_nome_trgm_idx" ON "Prateleira" USING GIN (nome gin_trgm_ops);
