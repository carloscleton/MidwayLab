-- Script DDL de Criação de Tabelas para o Supabase (MidwayLab - Integração Labfacil & Equipamentos)

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants (Empresas / Laboratórios Clientes)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    nome_responsavel VARCHAR(255),
    email VARCHAR(255),
    cnpj VARCHAR(50),
    codigo_entidade VARCHAR(50),
    identificacao_entidade VARCHAR(255) UNIQUE NOT NULL,
    senha_ws VARCHAR(255) NOT NULL,
    labfacil_base_url VARCHAR(255) NOT NULL DEFAULT 'http://apoio.softlabsolucoes.com.br',
    labfacil_login VARCHAR(255) NOT NULL,
    labfacil_senha VARCHAR(255) NOT NULL,
    softlab_base_url VARCHAR(255),
    softlab_login VARCHAR(255),
    softlab_senha VARCHAR(255),
    configuracoes JSONB,
    usar_catalogo_proprio BOOLEAN DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_identificacao ON public.tenants(identificacao_entidade);

-- 3. Tabela de Equipamentos por Empresa (Tenant)
-- Exemplos: CB350 (Bioquímica), YUMIZEN (Hematologia)
CREATE TABLE IF NOT EXISTS public.equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    modelo VARCHAR(100) NOT NULL, -- 'CB350', 'YUMIZEN', 'HORIBA_YUMIZEN', etc.
    codigo_identificador VARCHAR(100),
    fabricante VARCHAR(100),
    formato_arquivo VARCHAR(50) DEFAULT 'JSON',
    tipo_comunicacao VARCHAR(50) DEFAULT 'ARQUIVO_COMPARTILHADO', -- 'SERIAL', 'TCP_IP', 'ARQUIVO_COMPARTILHADO', 'API'
    ip_host VARCHAR(100),
    porta INTEGER,
    diretorio_carga VARCHAR(255) DEFAULT 'C:\Equipamentos\Carga',
    diretorio_resultados VARCHAR(255) DEFAULT 'C:\Equipamentos\Resultados',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_tenant_equipamento UNIQUE (tenant_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_equipamentos_tenant ON public.equipamentos(tenant_id);

-- 4. Tabela DE-PARA de Exames (por Tenant e opcionalmente por Equipamento)
CREATE TABLE IF NOT EXISTS public.depara_exames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE CASCADE,
    codigo_labfacil VARCHAR(100) NOT NULL,              -- Ex: "GLI", "HEM"
    descricao_labfacil VARCHAR(255),
    codigo_softlab VARCHAR(100),                        -- Compatibilidade
    descricao_softlab VARCHAR(255),
    codigo_equipamento VARCHAR(100),                    -- Ex: "GLUCOSE" no CB350, "CBC" no YUMIZEN
    canal_equipamento VARCHAR(50),                      -- Canal/rack no analisador
    codigo_autolac VARCHAR(100),
    descricao_autolac VARCHAR(255),
    tipo_resultado VARCHAR(50) DEFAULT 'PADRAO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela Transacional de Pedidos / Cargas de Trabalho
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE SET NULL,
    numero_solicitacao VARCHAR(100),
    codigo_pedido_labfacil VARCHAR(100),
    codigo_pedido_softlab VARCHAR(100),
    paciente_nome VARCHAR(255),
    paciente_cpf VARCHAR(20),
    paciente_sexo VARCHAR(10),
    origem_arquivo VARCHAR(50) DEFAULT 'LABFACIL_JSON', -- 'LABFACIL_JSON', 'LABFACIL_XML', 'AUTOLAC_SOAP'
    arquivo_nome VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSADO',
    mensagem_erro TEXT,
    payload_labfacil_json TEXT,
    payload_softlab_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Laudos / Resultados do Equipamento
CREATE TABLE IF NOT EXISTS public.laudos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    equipamento_id UUID REFERENCES public.equipamentos(id) ON DELETE SET NULL,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    codigo_exame_labfacil VARCHAR(100),
    codigo_exame_softlab VARCHAR(100),
    codigo_exame_equipamento VARCHAR(100),
    valor_resultado TEXT,
    unidade_medida VARCHAR(50),
    valor_referencia TEXT,
    formato_laudo VARCHAR(50) DEFAULT 'ESTRUTURADO',
    status_envio_labfacil VARCHAR(50) DEFAULT 'PENDENTE',
    data_hora_liberacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Catálogo de Exames do Labfacil (Cache)
CREATE TABLE IF NOT EXISTS public.catalogo_labfacil_exames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    abreviacao VARCHAR(100),
    tipo_resultado VARCHAR(50) DEFAULT 'PADRAO',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_catalogo_labfacil_tenant UNIQUE (tenant_id, codigo)
);

-- SEED DATA INICIAL
INSERT INTO public.tenants (id, nome, codigo_entidade, identificacao_entidade, senha_ws, labfacil_base_url, labfacil_login, labfacil_senha)
VALUES ('11111111-1111-1111-1111-111111111111', 'LAB. ARES - LABFACIL (San Mathews)', '1', 'yorod23826@gcont.com', 'Soft@2026', 'http://apoio.softlabsolucoes.com.br', 'carloscleton@gmail.com', 'Carlos@2026')
ON CONFLICT (identificacao_entidade) DO NOTHING;

-- Equipamentos Seed para o Tenant de demonstração (CB350 e YUMIZEN)
INSERT INTO public.equipamentos (id, tenant_id, nome, modelo, fabricante, tipo_comunicacao)
VALUES 
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Bioquímica Central CB350', 'CB350', 'Cormay', 'ARQUIVO_COMPARTILHADO'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Hematologia Bancada Yumizen', 'YUMIZEN', 'Horiba', 'ARQUIVO_COMPARTILHADO')
ON CONFLICT DO NOTHING;

INSERT INTO public.usuarios (nome, email, senha, role, tenant_id, status)
VALUES ('Carlos Cleton', 'carloscleton.nat@gmail.com', 'admin', 'admin', NULL, 'ativo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.usuarios (nome, email, senha, role, tenant_id, status)
VALUES ('Atendimento San Mathews', 'atendimento@sanmathews.com.br', '123', 'tenant', '11111111-1111-1111-1111-111111111111', 'ativo')
ON CONFLICT (email) DO NOTHING;
