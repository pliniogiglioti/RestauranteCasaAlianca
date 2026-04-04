-- ============================================================
-- SEED - Dados de exemplo para desenvolvimento
-- Execute APÓS o schema.sql
-- ============================================================

-- Configuração inicial
INSERT INTO public.configuracoes (nome_restaurante, descricao, telefone, endereco) VALUES
('Restaurante Casa Aliana', 'O melhor da culinária caseira com amor e sabor.', '(11) 99999-9999', 'Rua das Flores, 123 - São Paulo, SP');

-- Mesas
INSERT INTO public.mesas (numero, slug, ativo) VALUES
(1, 'mesa-1', true),
(2, 'mesa-2', true),
(3, 'mesa-3', true),
(4, 'mesa-4', true),
(5, 'mesa-5', true),
(6, 'mesa-6', true),
(7, 'mesa-7', true),
(8, 'mesa-8', true),
(9, 'mesa-9', true),
(10, 'mesa-10', true);

-- Categorias
INSERT INTO public.categorias (nome, slug, icone, ordem, ativo) VALUES
('Entradas', 'entradas', '🥗', 1, true),
('Pratos Principais', 'pratos-principais', '🍽️', 2, true),
('Massas', 'massas', '🍝', 3, true),
('Grelhados', 'grelhados', '🥩', 4, true),
('Frutos do Mar', 'frutos-do-mar', '🦐', 5, true),
('Sobremesas', 'sobremesas', '🍰', 6, true),
('Bebidas', 'bebidas', '🥤', 7, true);

-- Pratos (usando imagens de placeholder do unsplash)
INSERT INTO public.pratos (nome, descricao, imagem_url, preco, categoria_id, ativo, prato_do_dia, dia_prato_do_dia) VALUES
-- Entradas
('Bruschetta Italiana', 'Pão artesanal tostado com tomate, manjericão fresco e azeite extravirgem', 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80', 24.90, (SELECT id FROM categorias WHERE slug='entradas'), true, false, null),
('Caldo de Mandioca', 'Caldo cremoso de mandioca com bacon e ervas frescas', 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80', 18.90, (SELECT id FROM categorias WHERE slug='entradas'), true, false, null),
('Tabua de Frios', 'Seleção de queijos, frios e pães artesanais', 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=600&q=80', 49.90, (SELECT id FROM categorias WHERE slug='entradas'), true, false, null),

-- Pratos Principais
('Frango ao Molho Pardo', 'Frango caipira ao molho pardo com mandioca cozida e arroz', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80', 42.90, (SELECT id FROM categorias WHERE slug='pratos-principais'), true, true, 'segunda'),
('Picanha Grelhada', 'Picanha grelhada na brasa com arroz, feijão e farofa', 'https://images.unsplash.com/photo-1544025162-d76538977d0b?w=600&q=80', 68.90, (SELECT id FROM categorias WHERE slug='pratos-principais'), true, true, 'sexta'),
('Feijoada Completa', 'Feijoada com todos os acompanhamentos tradicionais', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', 52.90, (SELECT id FROM categorias WHERE slug='pratos-principais'), true, true, 'sabado'),
('Moqueca de Peixe', 'Moqueca baiana de peixe com azeite de dendê e leite de coco', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', 58.90, (SELECT id FROM categorias WHERE slug='pratos-principais'), true, true, 'quarta'),
('Bife à Parmegiana', 'Bife empanado com molho de tomate e queijo gratinado', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80', 48.90, (SELECT id FROM categorias WHERE slug='pratos-principais'), true, true, 'terca'),

-- Massas
('Espaguete à Bolonhesa', 'Espaguete al dente com molho bolonhesa caseiro', 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600&q=80', 38.90, (SELECT id FROM categorias WHERE slug='massas'), true, true, 'quinta'),
('Penne ao Pesto', 'Penne com molho pesto de manjericão e pinoles', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80', 36.90, (SELECT id FROM categorias WHERE slug='massas'), true, false, null),
('Lasanha à Bolonhesa', 'Lasanha gratinada com molho bolonhesa e bechamel', 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&q=80', 42.90, (SELECT id FROM categorias WHERE slug='massas'), true, true, 'domingo'),

-- Grelhados
('Filé Mignon ao Molho', 'Filé mignon grelhado com molho de mostarda e ervas', 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80', 74.90, (SELECT id FROM categorias WHERE slug='grelhados'), true, false, null),
('Frango Grelhado', 'Peito de frango grelhado com legumes no vapor', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80', 39.90, (SELECT id FROM categorias WHERE slug='grelhados'), true, false, null),

-- Frutos do Mar
('Camarão ao Alho e Óleo', 'Camarão VG salteado no azeite com alho e salsinha', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&q=80', 78.90, (SELECT id FROM categorias WHERE slug='frutos-do-mar'), true, false, null),
('Polvo à Lagareiro', 'Polvo assado no forno com batatas e azeite', 'https://images.unsplash.com/photo-1612197527762-8cfb1ea8e1f4?w=600&q=80', 89.90, (SELECT id FROM categorias WHERE slug='frutos-do-mar'), true, false, null),

-- Sobremesas
('Pudim de Leite', 'Pudim de leite condensado com calda de caramelo', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80', 16.90, (SELECT id FROM categorias WHERE slug='sobremesas'), true, false, null),
('Mousse de Chocolate', 'Mousse de chocolate belga aerado', 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=600&q=80', 19.90, (SELECT id FROM categorias WHERE slug='sobremesas'), true, false, null),
('Romeu e Julieta', 'Goiabada cremosa com queijo minas frescal', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', 14.90, (SELECT id FROM categorias WHERE slug='sobremesas'), true, false, null),

-- Bebidas
('Suco Natural', 'Suco natural da fruta da estação (500ml)', 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&q=80', 12.90, (SELECT id FROM categorias WHERE slug='bebidas'), true, false, null),
('Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite (350ml)', 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600&q=80', 8.90, (SELECT id FROM categorias WHERE slug='bebidas'), true, false, null),
('Água Mineral', 'Água mineral com ou sem gás (500ml)', 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&q=80', 6.90, (SELECT id FROM categorias WHERE slug='bebidas'), true, false, null),
('Limonada Suíça', 'Limonada cremosa com leite condensado e limão siciliano', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80', 16.90, (SELECT id FROM categorias WHERE slug='bebidas'), true, false, null);

-- Banners
INSERT INTO public.banners (titulo, subtitulo, imagem_url, link_opcional, ordem, ativo) VALUES
('Bem-vindo ao Casa Aliana', 'Sabores que aquecem o coração', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', null, 1, true),
('Feijoada aos Sábados', 'Feijoada completa com todos os acompanhamentos tradicionais', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80', null, 2, true),
('Frutos do Mar Frescos', 'Direto do mar para a sua mesa todos os dias', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=1200&q=80', null, 3, true);
