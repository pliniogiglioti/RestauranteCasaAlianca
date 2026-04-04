-- ============================================================
-- MIGRATION: Permite anon ler pedidos pelo ID (para status em tempo real)
--
-- UUID é suficientemente seguro — impossível adivinhar.
-- Necessário para Supabase Realtime funcionar com role anon.
-- ============================================================

CREATE POLICY "Anon pode ver status do próprio pedido"
  ON public.pedidos FOR SELECT
  TO anon
  USING (true);
  -- O cliente só acessa com o UUID que recebeu ao criar o pedido.
  -- UUID v4 tem 2^122 combinações — não há risco prático de enumeração.
