ALTER TABLE public.pratos
  ADD COLUMN IF NOT EXISTS dia_promocional TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pratos'
      AND column_name = 'data_promocional'
  ) THEN
    UPDATE public.pratos
    SET dia_promocional = CASE EXTRACT(DOW FROM data_promocional)
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'segunda'
      WHEN 2 THEN 'terca'
      WHEN 3 THEN 'quarta'
      WHEN 4 THEN 'quinta'
      WHEN 5 THEN 'sexta'
      WHEN 6 THEN 'sabado'
      ELSE NULL
    END
    WHERE data_promocional IS NOT NULL
      AND dia_promocional IS NULL;

    ALTER TABLE public.pratos
      DROP COLUMN data_promocional;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_pratos_promocao_data;

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
