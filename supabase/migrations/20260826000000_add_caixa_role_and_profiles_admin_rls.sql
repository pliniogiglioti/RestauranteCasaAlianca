-- ============================================================
-- MIGRATION: Papel "caixa" + correção de RLS de profiles
-- Casa Aliança - Cardápio Digital
-- ============================================================
-- Contexto:
-- 1) A política antiga "Admin acesso ao próprio profile" (FOR ALL,
--    id = auth.uid()) fazia com que QUALQUER usuário logado só
--    enxergasse a própria linha em `profiles` — por isso a tela
--    Admin > Usuários não listava todos os usuários, nem para
--    super_admin. Ela também permitia que um usuário alterasse a
--    própria role/loja_id diretamente pelo client (escalonamento
--    de privilégio).
-- 2) Agora role, loja_id, senha e criação/exclusão de usuário só
--    podem ser alterados pela Edge Function `manage-users`
--    (service role) ou por um super_admin autenticado.
-- ============================================================

-- ─── Novo papel: caixa ────────────────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'super_admin', 'caixa'));

-- ─── Função auxiliar (SECURITY DEFINER evita recursão de RLS) ─
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ─── Corrige políticas de profiles ────────────────────────────
DROP POLICY IF EXISTS "Admin acesso ao próprio profile" ON public.profiles;

-- Qualquer usuário autenticado pode LER o próprio perfil
CREATE POLICY "Usuario le o proprio profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Super admin tem acesso total (ver, criar, editar, apagar todos)
CREATE POLICY "Super admin acesso total profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
