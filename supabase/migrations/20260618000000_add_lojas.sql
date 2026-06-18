-- Função genérica para atualizar updated_at (criada se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de empresas/lojas
CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at em lojas
CREATE TRIGGER set_lojas_updated_at
  BEFORE UPDATE ON lojas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insere Loja Parapua como loja principal
INSERT INTO lojas (nome, slug)
VALUES ('Loja Parapua', 'parapua')
ON CONFLICT (slug) DO NOTHING;

-- Adiciona loja_id a todas as tabelas de dados
ALTER TABLE mesas ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
ALTER TABLE pratos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS loja_id UUID UNIQUE REFERENCES lojas(id) ON DELETE CASCADE;

-- Associa todos os registros existentes à Loja Parapua
UPDATE mesas SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;
UPDATE categorias SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;
UPDATE pratos SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;
UPDATE banners SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;
UPDATE pedidos SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;
UPDATE configuracoes SET loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1) WHERE loja_id IS NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mesas_loja_id ON mesas(loja_id);
CREATE INDEX IF NOT EXISTS idx_categorias_loja_id ON categorias(loja_id);
CREATE INDEX IF NOT EXISTS idx_pratos_loja_id ON pratos(loja_id);
CREATE INDEX IF NOT EXISTS idx_banners_loja_id ON banners(loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_loja_id ON pedidos(loja_id);

-- RLS: lojas visíveis para anon (para carregar dados pelo slug)
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojas ativas visíveis para todos" ON lojas
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admin pode gerenciar lojas" ON lojas
  FOR ALL USING (auth.role() = 'authenticated');
