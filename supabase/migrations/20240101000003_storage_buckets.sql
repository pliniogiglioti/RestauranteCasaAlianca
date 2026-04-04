-- ============================================================
-- MIGRATION 004: Storage Buckets
-- Casa Aliança - Cardápio Digital
--
-- Execute este arquivo no SQL Editor do Supabase
-- OU crie os buckets manualmente em Storage > New bucket
-- ============================================================

-- Criar buckets públicos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('imagens', 'imagens', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners',  'banners',  true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── Políticas de storage ────────────────────────────────────

-- Leitura pública (qualquer um vê as imagens)
CREATE POLICY "Imagens públicas - leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('imagens', 'banners'));

-- Admin faz upload
CREATE POLICY "Admin faz upload de imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('imagens', 'banners'));

-- Admin atualiza (upsert)
CREATE POLICY "Admin atualiza imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('imagens', 'banners'));

-- Admin remove imagens
CREATE POLICY "Admin remove imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('imagens', 'banners'));
