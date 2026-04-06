-- ============================================================
-- MIGRATION: Permite anon ler itens de pedido
--
-- Necessário para:
-- 1. impressão automática no app Electron
-- 2. consultas aninhadas `itens:pedido_itens(*)`
-- 3. futuras telas/status que precisem listar itens do pedido
--
-- Sem esta policy, o pedido pode ser lido mas os itens vêm vazios,
-- fazendo o cupom mostrar apenas o valor total.
-- ============================================================

CREATE POLICY "Anon pode ver itens de pedidos"
  ON public.pedido_itens FOR SELECT
  TO anon
  USING (true);
