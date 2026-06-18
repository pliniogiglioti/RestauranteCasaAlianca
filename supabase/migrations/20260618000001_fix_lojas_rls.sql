-- Corrige RLS da tabela lojas para permitir operações via chave anon
-- O admin deste app usa a chave anon (sem autenticação Supabase)

DROP POLICY IF EXISTS "Lojas ativas visíveis para todos" ON lojas;
DROP POLICY IF EXISTS "Admin pode gerenciar lojas" ON lojas;

-- Permite leitura de todas as lojas (ativas e inativas) para qualquer um
CREATE POLICY "Lojas visíveis para todos" ON lojas
  FOR SELECT USING (true);

-- Permite inserção, atualização e exclusão via chave anon (sem auth)
CREATE POLICY "Permite gerenciar lojas" ON lojas
  FOR ALL USING (true) WITH CHECK (true);
