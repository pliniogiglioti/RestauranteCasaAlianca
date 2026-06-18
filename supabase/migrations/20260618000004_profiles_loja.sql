-- Adiciona vínculo de loja ao perfil do usuário admin
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL;
