-- Script para limpar colunas desnecessárias e adicionar os campos cadastrais corretos na tabela public.tenants

-- 1. Remove colunas legadas não utilizadas
ALTER TABLE public.tenants DROP COLUMN IF EXISTS codigo_entidade;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS labfacil_base_url;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS labfacil_login;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS labfacil_senha;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS softlab_base_url;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS softlab_login;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS softlab_senha;
ALTER TABLE public.tenants DROP COLUMN IF EXISTS senha_ws;

-- 2. Adiciona os campos oficiais preenchidos no cadastro do laboratório
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cnpj character varying(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS nome_responsavel character varying(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email character varying(255);

-- 3. Comentários descritivos
COMMENT ON COLUMN public.tenants.nome IS 'Nome oficial do laboratório cliente';
COMMENT ON COLUMN public.tenants.nome_responsavel IS 'Nome do Responsável Técnico do laboratório';
COMMENT ON COLUMN public.tenants.email IS 'E-mail de contato do laboratório';
COMMENT ON COLUMN public.tenants.cnpj IS 'CNPJ do laboratório cliente';
