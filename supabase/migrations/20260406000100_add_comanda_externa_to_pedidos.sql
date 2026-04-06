ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS comanda_externa TEXT;
