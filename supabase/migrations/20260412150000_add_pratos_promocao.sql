ALTER TABLE public.pratos
  ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dia_promocional TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pratos_dia_promocional_check'
  ) THEN
    ALTER TABLE public.pratos
      ADD CONSTRAINT pratos_dia_promocional_check CHECK (
        dia_promocional IN (
          'segunda','terca','quarta','quinta','sexta','sabado','domingo'
        ) OR dia_promocional IS NULL
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pratos_promocao_dia
  ON public.pratos(dia_promocional);
