-- Script de Segurança RLS (Row Level Security) para o Supabase (Projeto MidwayLab)

--------------------------------------------------------------------------------
-- 1. HABILITAR RLS EM TODAS AS TABELAS
--------------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depara_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depara_convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laudos_historico ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 2. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Deny all public access to tenants" ON public.tenants;
DROP POLICY IF EXISTS "Deny all public access to depara_exames" ON public.depara_exames;
DROP POLICY IF EXISTS "Deny all public access to depara_convenios" ON public.depara_convenios;
DROP POLICY IF EXISTS "Deny all public access to pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Deny all public access to laudos_historico" ON public.laudos_historico;

DROP POLICY IF EXISTS "Allow authenticated admin full access to tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow authenticated admin full access to depara_exames" ON public.depara_exames;
DROP POLICY IF EXISTS "Allow authenticated admin full access to depara_convenios" ON public.depara_convenios;
DROP POLICY IF EXISTS "Allow authenticated admin full access to pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow authenticated admin full access to laudos_historico" ON public.laudos_historico;

--------------------------------------------------------------------------------
-- 3. POLÍTICA DE PROTEÇÃO TOTAL CONTRA ACESSO PÚBLICO (ANON)
-- Nenhuma requisição anônima ou pública conseguirá ler, inserir ou alterar dados.
--------------------------------------------------------------------------------

-- Apenas usuários autenticados no Supabase Auth (Admins da Plataforma) possuem acesso via Dashboard/API Admin
CREATE POLICY "Allow authenticated admin full access to tenants"
    ON public.tenants
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to depara_exames"
    ON public.depara_exames
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to depara_convenios"
    ON public.depara_convenios
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to pedidos"
    ON public.pedidos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admin full access to laudos_historico"
    ON public.laudos_historico
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

--------------------------------------------------------------------------------
-- NOTA IMPORTANTE DE SEGURANÇA:
-- O Backend Node.js do MIDWAY utiliza a chave `service_role` (Secret), que
-- ignora o RLS e executa as operações com privilégios administrativos.
-- NENHUMA chave pública (anon) terá acesso aos dados do seu banco.
--------------------------------------------------------------------------------
