-- ============================================================
-- RESTAURANTE CASA ALIANA - Schema do Banco de Dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_restaurante TEXT NOT NULL DEFAULT 'Restaurante Casa Aliança',
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#f2700f',
  descricao TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: mesas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero INTEGER NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesas_slug ON public.mesas(slug);
CREATE INDEX IF NOT EXISTS idx_mesas_ativo ON public.mesas(ativo);

-- ============================================================
-- TABELA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON public.categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON public.categorias(ordem);

-- ============================================================
-- TABELA: pratos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pratos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  prato_do_dia BOOLEAN DEFAULT false,
  dia_prato_do_dia TEXT CHECK (
    dia_prato_do_dia IN (
      'segunda','terca','quarta','quinta','sexta','sabado','domingo'
    ) OR dia_prato_do_dia IS NULL
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pratos_categoria ON public.pratos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pratos_ativo ON public.pratos(ativo);
CREATE INDEX IF NOT EXISTS idx_pratos_prato_do_dia ON public.pratos(prato_do_dia, dia_prato_do_dia);

-- ============================================================
-- TABELA: banners
-- ============================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  imagem_url TEXT NOT NULL,
  link_opcional TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_ativo ON public.banners(ativo);
CREATE INDEX IF NOT EXISTS idx_banners_ordem ON public.banners(ordem);

-- ============================================================
-- TABELA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (
    status IN ('recebido','em_preparo','pronto','entregue','finalizado')
  ),
  observacao_geral TEXT,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_mesa ON public.pedidos(mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON public.pedidos(created_at DESC);

-- ============================================================
-- TABELA: pedido_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  prato_id UUID REFERENCES public.pratos(id) ON DELETE SET NULL,
  nome_prato TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  observacao_item TEXT,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON public.pedido_itens(pedido_id);

-- ============================================================
-- TABELA: profiles (admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER tr_mesas_updated_at
  BEFORE UPDATE ON public.mesas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_pratos_updated_at
  BEFORE UPDATE ON public.pratos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Leitura pública (cardápio e dados de exibição)
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

-- POLÍTICAS: Inserção de pedidos (público pode criar pedidos)
CREATE POLICY "Qualquer um pode criar pedido"
  ON public.pedidos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Qualquer um pode criar itens de pedido"
  ON public.pedido_itens FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- POLÍTICAS: Admin tem acesso total
CREATE POLICY "Admin acesso total mesas"
  ON public.mesas FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total categorias"
  ON public.categorias FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total pratos"
  ON public.pratos FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso total banners"
  ON public.banners FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin leitura de pedidos"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin atualiza pedidos"
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin leitura de itens de pedido"
  ON public.pedido_itens FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin acesso ao próprio profile"
  ON public.profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin acesso total configuracoes"
  ON public.configuracoes FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- GRANTS EXPLÍCITOS (necessário para role anon funcionar com RLS)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Leitura pública (cardápio)
GRANT SELECT ON public.mesas TO anon;
GRANT SELECT ON public.categorias TO anon;
GRANT SELECT ON public.pratos TO anon;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.configuracoes TO anon;

-- Clientes podem criar pedidos (sem login)
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedido_itens TO anon;

-- Admin (authenticated)
GRANT ALL ON public.mesas TO authenticated;
GRANT ALL ON public.categorias TO authenticated;
GRANT ALL ON public.pratos TO authenticated;
GRANT ALL ON public.banners TO authenticated;
GRANT ALL ON public.pedidos TO authenticated;
GRANT ALL ON public.pedido_itens TO authenticated;
GRANT ALL ON public.configuracoes TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Execute após criar o projeto no Supabase:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('imagens', 'imagens', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Políticas de storage (execute separadamente se necessário)
-- CREATE POLICY "Imagens públicas" ON storage.objects FOR SELECT USING (bucket_id IN ('imagens','banners'));
-- CREATE POLICY "Admin faz upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('imagens','banners'));
-- CREATE POLICY "Admin apaga imagens" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('imagens','banners'));
