-- ============================================================
-- MIGRATION: Storage bucket downloads
-- Bucket público para distribuição do app desktop (Windows)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('downloads', 'downloads', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (qualquer um pode baixar o instalador)
DROP POLICY IF EXISTS "downloads_public_read" ON storage.objects;
CREATE POLICY "downloads_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'downloads');

-- Apenas autenticados fazem upload/delete
DROP POLICY IF EXISTS "downloads_auth_insert" ON storage.objects;
CREATE POLICY "downloads_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'downloads');

DROP POLICY IF EXISTS "downloads_auth_delete" ON storage.objects;
CREATE POLICY "downloads_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'downloads');
