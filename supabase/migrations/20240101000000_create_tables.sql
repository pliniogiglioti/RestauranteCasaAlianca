-- ============================================================
-- MIGRATION 001: Criação das tabelas
-- Casa Aliança - Cardápio Digital
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_restaurante TEXT   NOT NULL DEFAULT 'Restaurante Casa Aliança',
  logo_url    TEXT,
  cor_primaria TEXT       DEFAULT '#f2700f',
  descricao   TEXT,
  telefone    TEXT,
  endereco    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: mesas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mesas (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero      INTEGER     NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  qr_code_url TEXT,
  ativo       BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mesas_slug  ON public.mesas(slug);
CREATE INDEX IF NOT EXISTS idx_mesas_ativo ON public.mesas(ativo);

-- ============================================================
-- TABELA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  icone       TEXT,
  ordem       INTEGER     DEFAULT 0,
  ativo       BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON public.categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON public.categorias(ordem);

-- ============================================================
-- TABELA: pratos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pratos (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT           NOT NULL,
  descricao       TEXT,
  imagem_url      TEXT,
  preco           NUMERIC(10,2)  NOT NULL DEFAULT 0,
  categoria_id    UUID           REFERENCES public.categorias(id) ON DELETE SET NULL,
  ativo           BOOLEAN        DEFAULT true,
  prato_do_dia    BOOLEAN        DEFAULT false,
  dia_prato_do_dia TEXT          CHECK (
    dia_prato_do_dia IN (
      'segunda','terca','quarta','quinta','sexta','sabado','domingo'
    ) OR dia_prato_do_dia IS NULL
  ),
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pratos_categoria    ON public.pratos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pratos_ativo        ON public.pratos(ativo);
CREATE INDEX IF NOT EXISTS idx_pratos_prato_do_dia ON public.pratos(prato_do_dia, dia_prato_do_dia);

-- ============================================================
-- TABELA: banners
-- ============================================================
CREATE TABLE IF NOT EXISTS public.banners (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo        TEXT        NOT NULL,
  subtitulo     TEXT,
  imagem_url    TEXT        NOT NULL,
  link_opcional TEXT,
  ordem         INTEGER     DEFAULT 0,
  ativo         BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_ativo ON public.banners(ativo);
CREATE INDEX IF NOT EXISTS idx_banners_ordem ON public.banners(ordem);

-- ============================================================
-- TABELA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id          UUID          REFERENCES public.mesas(id) ON DELETE SET NULL,
  status           TEXT          NOT NULL DEFAULT 'recebido' CHECK (
    status IN ('recebido','em_preparo','pronto','entregue','finalizado')
  ),
  observacao_geral TEXT,
  valor_total      NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_mesa    ON public.pedidos(mesa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status  ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created ON public.pedidos(created_at DESC);

-- ============================================================
-- TABELA: pedido_itens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id      UUID          NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  prato_id       UUID          REFERENCES public.pratos(id) ON DELETE SET NULL,
  nome_prato     TEXT          NOT NULL,
  quantidade     INTEGER       NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  observacao_item TEXT,
  subtotal       NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON public.pedido_itens(pedido_id);

-- ============================================================
-- TABELA: profiles (admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  nome       TEXT,
  role       TEXT        NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
