-- Permite que restaurantes diferentes usem a mesma numeração/slug de mesa.
-- A combinação continua única dentro de cada restaurante.
ALTER TABLE public.mesas
  DROP CONSTRAINT IF EXISTS mesas_slug_key;

DROP INDEX IF EXISTS public.mesas_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS mesas_loja_slug_key
  ON public.mesas (loja_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS mesas_loja_numero_key
  ON public.mesas (loja_id, numero);
