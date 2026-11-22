CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Item_nome_trgm_idx" ON "Item" USING GIN ("nome" gin_trgm_ops);
