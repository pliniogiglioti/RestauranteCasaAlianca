-- Insere "Loja 1" como loja principal (dona dos dados existentes)
INSERT INTO lojas (nome, slug)
VALUES ('Loja 1', 'loja-1')
ON CONFLICT (slug) DO NOTHING;

-- Garante que "Loja Parapua" também existe
INSERT INTO lojas (nome, slug)
VALUES ('Loja Parapua', 'parapua')
ON CONFLICT (slug) DO NOTHING;

-- Re-vincula todos os registros existentes para "Loja 1"
-- (corrige caso tenham sido linkados à Loja Parapua pela migration anterior)
UPDATE mesas
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);

UPDATE categorias
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);

UPDATE pratos
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);

UPDATE banners
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);

UPDATE pedidos
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);

UPDATE configuracoes
  SET loja_id = (SELECT id FROM lojas WHERE slug = 'loja-1' LIMIT 1)
  WHERE loja_id IS NULL
     OR loja_id = (SELECT id FROM lojas WHERE slug = 'parapua' LIMIT 1);
