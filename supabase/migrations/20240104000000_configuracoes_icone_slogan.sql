-- ============================================================
-- MIGRATION: Adiciona icone_app e slogan em configuracoes
-- ============================================================

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS icone_app TEXT DEFAULT '🍽️',
  ADD COLUMN IF NOT EXISTS slogan    TEXT DEFAULT 'Sabores que aquecem o coração';

-- Atualiza a linha existente caso já exista
UPDATE public.configuracoes
SET
  icone_app = '🍽️',
  slogan    = 'Sabores que aquecem o coração'
WHERE icone_app IS NULL;
