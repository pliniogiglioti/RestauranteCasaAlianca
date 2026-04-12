ALTER TABLE public.pratos
  ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS data_promocional DATE;

CREATE INDEX IF NOT EXISTS idx_pratos_promocao_data
  ON public.pratos(data_promocional);
