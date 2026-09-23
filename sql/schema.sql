-- Script DDL de Criação de Tabelas para o Supabase (Projeto MidwayLab)

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants (Empresas / Laboratórios Clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    codigo_entidade VARCHAR(50),
    identificacao_entidade VARCHAR(255) UNIQUE NOT NULL, -- Login de acesso ao WS do Autolac
    senha_ws VARCHAR(255) NOT NULL,                    -- Senha de acesso ao WS do Autolac
    softlab_base_url VARCHAR(255) NOT NULL DEFAULT 'http://apoio.softlabsolucoes.com.br',
    softlab_login VARCHAR(255) NOT NULL,               -- Credencial API Softlab
    softlab_senha VARCHAR(255) NOT NULL,               -- Credencial API Softlab
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para busca rápida do Tenant no recebimento da requisição SOAP do Autolac
CREATE INDEX IF NOT EXISTS idx_tenants_identificacao ON public.tenants(identificacao_entidade);

-- 3. Tabela DE-PARA de Exames (por Tenant)
CREATE TABLE IF NOT EXISTS public.depara_exames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo_autolac VARCHAR(100) NOT NULL,              -- Ex: "T3"
    descricao_autolac VARCHAR(255),
    codigo_softlab VARCHAR(100) NOT NULL,              -- Ex: "T3_SOFT"
    descricao_softlab VARCHAR(255),
    tipo_resultado VARCHAR(50) DEFAULT 'PDF',          -- 'ESTRUTURADO' ou 'PDF'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_depara_exame_tenant UNIQUE (tenant_id, codigo_autolac)
);

-- 4. Tabela DE-PARA de Convênios e Planos (por Tenant)
CREATE TABLE IF NOT EXISTS public.depara_convenios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo_convenio_autolac VARCHAR(100) NOT NULL,
    codigo_plano_autolac VARCHAR(100),
    codigo_convenio_softlab VARCHAR(100) NOT NULL,
    codigo_plano_softlab VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_depara_convenio_tenant UNIQUE (tenant_id, codigo_convenio_autolac, codigo_plano_autolac)
);

-- 5. Tabela Transacional de Pedidos (Log de Envio - Ida)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo_lote_autolac VARCHAR(100),
    local_autolac VARCHAR(100) NOT NULL,
    protocolo_autolac VARCHAR(100) NOT NULL,
    numero_solicitacao VARCHAR(100),
    codigo_pedido_softlab VARCHAR(100),
    paciente_nome VARCHAR(255),
    paciente_cpf VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'ENVIADO_SOFTLAB', -- 'ENVIADO_SOFTLAB', 'ERRO', 'CONCLUIDO'
    mensagem_erro TEXT,
    payload_autolac_xml TEXT,
    payload_softlab_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_pedido_protocolo UNIQUE (tenant_id, local_autolac, protocolo_autolac)
);

-- 6. Tabela de Laudos / Resultados (Log de Retorno - Volta)
CREATE TABLE IF NOT EXISTS public.laudos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    local_autolac VARCHAR(100),
    protocolo_autolac VARCHAR(100),
    codigo_exame_softlab VARCHAR(100),
    codigo_exame_autolac VARCHAR(100),
    formato_laudo VARCHAR(50),                         -- 'PDF', 'HTML', 'RTF', 'ESTRUTURADO'
    status_envio_autolac VARCHAR(50) DEFAULT 'PENDENTE',-- 'PENDENTE', 'ENTREGUE', 'ERRO'
    data_hora_liberacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Usuários do Sistema (SuperAdmin e Clientes)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant',         -- 'admin' ou 'tenant'
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ativo',       -- 'ativo', 'pendente', 'bloqueado'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Solicitações de Acesso (Self-Service)
CREATE TABLE IF NOT EXISTS public.solicitacoes_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_lab VARCHAR(255) NOT NULL,
    nome_responsavel VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cnpj VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',    -- 'PENDENTE', 'APROVADO', 'REJEITADO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEED DATA INICIAL
INSERT INTO public.tenants (id, nome, codigo_entidade, identificacao_entidade, senha_ws, softlab_base_url, softlab_login, softlab_senha)
VALUES ('11111111-1111-1111-1111-111111111111', 'LAB. ARES - SOFTLAB (San Mathews)', '1', 'yorod23826@gcont.com', 'Soft@2026', 'http://apoio.softlabsolucoes.com.br', 'carloscleton@gmail.com', 'Carlos@2026')
ON CONFLICT (identificacao_entidade) DO NOTHING;

INSERT INTO public.usuarios (nome, email, senha, role, tenant_id, status)
VALUES ('Carlos Cleton', 'carloscleton.nat@gmail.com', 'admin', 'admin', NULL, 'ativo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.usuarios (nome, email, senha, role, tenant_id, status)
VALUES ('Atendimento San Mathews', 'atendimento@sanmathews.com.br', '123', 'tenant', '11111111-1111-1111-1111-111111111111', 'ativo')
ON CONFLICT (email) DO NOTHING;

-- =========================================================================
-- CRIAÇÃO DOS USUÁRIOS NO PAINEL DE AUTHENTICATION DO SUPABASE (auth.users)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Inserir SuperAdmin Carlos Cleton no Supabase Auth NATIVO (auth.users)
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carloscleton.nat@gmail.com') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000001',
        'authenticated', 'authenticated',
        'carloscleton.nat@gmail.com',
        crypt('admin', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"nome":"Carlos Cleton","role":"admin"}',
        false, now(), now()
      );
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0000000-0000-0000-0000-000000000001') THEN
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        '{"sub":"a0000000-0000-0000-0000-000000000001","email":"carloscleton.nat@gmail.com"}',
        'email', now(), now(), now()
      );
   END IF;
END $$;

-- 2. Inserir Cliente San Mathews no Supabase Auth NATIVO (auth.users)
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'atendimento@sanmathews.com.br') THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        'a0000000-0000-0000-0000-000000000002',
        'authenticated', 'authenticated',
        'atendimento@sanmathews.com.br',
        crypt('123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"nome":"Atendimento San Mathews","role":"tenant","tenant_id":"11111111-1111-1111-1111-111111111111"}',
        false, now(), now()
      );
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'a0000000-0000-0000-0000-000000000002') THEN
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        '{"sub":"a0000000-0000-0000-0000-000000000002","email":"atendimento@sanmathews.com.br"}',
        'email', now(), now(), now()
      );
   END IF;
END $$;




