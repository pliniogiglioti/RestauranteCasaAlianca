-- ============================================================
-- MIGRATION: Fix RLS para INSERT de pedidos por anon
--
-- Problema: .insert().select() dispara RLS de SELECT após INSERT.
-- O role anon não tem SELECT em pedidos → erro 42501.
--
-- Solução aplicada no código (pedidos.ts):
--   - UUID gerado no cliente via crypto.randomUUID()
--   - INSERT sem .select() → não dispara SELECT RLS
--
-- Esta migration garante que o banco também aceite o id
-- enviado pelo cliente (não é auto-gerado pelo Postgres).
-- O DEFAULT uuid_generate_v4() já permite override por UUID externo.
-- ============================================================

-- Nenhuma alteração de schema necessária.
-- A correção foi feita no cliente (src/services/pedidos.ts).

-- Opcional: se quiser que anon possa consultar SEUS pedidos futuramente,
-- adicione uma coluna session_token ou implemente via Edge Function.

-- Por ora apenas documentamos o comportamento esperado:
COMMENT ON TABLE public.pedidos IS
  'Pedidos criados por clientes (anon) via cardápio digital. '
  'INSERT permitido para anon sem SELECT (UUID gerado no cliente).';
