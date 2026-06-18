-- Adiciona campos de contato diretamente na tabela lojas
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE lojas ADD COLUMN IF NOT EXISTS endereco TEXT;
