-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'GERENTE', 'ESTOQUISTA');

-- CreateEnum
CREATE TYPE "TipoCodigoBarras" AS ENUM ('EAN13', 'EAN8', 'UPC', 'CODE128', 'OUTRO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "proxCodigo" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'ESTOQUISTA',

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "codigoInterno" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'UN',
    "valorUnitario" DECIMAL(12,2),
    "altoValor" BOOLEAN NOT NULL DEFAULT false,
    "imagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoBarras" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoCodigoBarras" NOT NULL DEFAULT 'EAN13',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoBarras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_clerkOrgId_key" ON "Empresa"("clerkOrgId");

-- CreateIndex
CREATE INDEX "Unidade_empresaId_idx" ON "Unidade"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_clerkId_empresaId_key" ON "Usuario"("clerkId", "empresaId");

-- CreateIndex
CREATE INDEX "Categoria_empresaId_idx" ON "Categoria"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_empresaId_nome_key" ON "Categoria"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Item_empresaId_categoriaId_idx" ON "Item"("empresaId", "categoriaId");

-- CreateIndex
CREATE INDEX "Item_empresaId_nome_idx" ON "Item"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Item_empresaId_codigoInterno_key" ON "Item"("empresaId", "codigoInterno");

-- CreateIndex
CREATE INDEX "CodigoBarras_itemId_idx" ON "CodigoBarras"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CodigoBarras_empresaId_codigo_key" ON "CodigoBarras"("empresaId", "codigo");

-- AddForeignKey
ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarras" ADD CONSTRAINT "CodigoBarras_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodigoBarras" ADD CONSTRAINT "CodigoBarras_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
