-- ============================================================
-- MIGRATION 003: Row Level Security (RLS) + Grants
-- Casa Aliança - Cardápio Digital
-- ============================================================

-- ─── Habilitar RLS em todas as tabelas ───────────────────────
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pratos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;

-- ─── Políticas: leitura pública (cardápio) ───────────────────
CREATE POLICY "Leitura pública de mesas ativas"
  ON public.mesas FOR SELECT
  USING (ativo = true);

CREATE POLICY "Leitura pública de categorias ativas"
  ON public.categorias FOR SELECT
  USING (ativo = true);

CREATE POLICY "Leitura pública de pratos ativos"
  ON public.pratos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Leitura pública de banners ativos"
  ON public.banners FOR SELECT
  USING (ativo = true);

CREATE POLICY "Leitura pública de configuracoes"
  ON public.configuracoes FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── Políticas: clientes criam pedidos (sem login) ───────────
CREATE POLICY "Qualquer um pode criar pedido"
  ON public.pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Qualquer um pode criar itens de pedido"
  ON public.pedido_itens FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─── Políticas: admin tem acesso total ───────────────────────
CREATE POLICY "Admin acesso total mesas"
  ON public.mesas FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total categorias"
  ON public.categorias FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total pratos"
  ON public.pratos FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total banners"
  ON public.banners FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin leitura de pedidos"
  ON public.pedidos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin atualiza pedidos"
  ON public.pedidos FOR UPDATE TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin leitura de itens de pedido"
  ON public.pedido_itens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso ao próprio profile"
  ON public.profiles FOR ALL TO authenticated
  USING     (id = auth.uid())
  WITH CHECK(id = auth.uid());

CREATE POLICY "Admin acesso total configuracoes"
  ON public.configuracoes FOR ALL TO authenticated
  USING     (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK(EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

-- ─── Grants explícitos (obrigatório para role anon + RLS) ─────
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Leitura pública
GRANT SELECT ON public.mesas          TO anon;
GRANT SELECT ON public.categorias     TO anon;
GRANT SELECT ON public.pratos         TO anon;
GRANT SELECT ON public.banners        TO anon;
GRANT SELECT ON public.configuracoes  TO anon;
GRANT SELECT ON public.pedido_itens   TO anon; -- necessário para upsell mais pedidas

-- Clientes criam pedidos
GRANT INSERT ON public.pedidos        TO anon;
GRANT INSERT ON public.pedido_itens   TO anon;

-- Admin (authenticated) acesso total
GRANT ALL ON public.mesas             TO authenticated;
GRANT ALL ON public.categorias        TO authenticated;
GRANT ALL ON public.pratos            TO authenticated;
GRANT ALL ON public.banners           TO authenticated;
GRANT ALL ON public.pedidos           TO authenticated;
GRANT ALL ON public.pedido_itens      TO authenticated;
GRANT ALL ON public.configuracoes     TO authenticated;
GRANT ALL ON public.profiles          TO authenticated;
