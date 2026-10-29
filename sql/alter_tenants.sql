-- Migração para adicionar campos cadastrais do laboratório na tabela public.tenants
-- Campos correspondentes aos dados solicitados na tela de cadastro (solicitacoes_acesso)

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cnpj character varying(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS nome_responsavel character varying(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email character varying(255);

-- Comentários descritivos dos campos
COMMENT ON COLUMN public.tenants.cnpj IS 'CNPJ oficial do laboratório cliente';
COMMENT ON COLUMN public.tenants.nome_responsavel IS 'Nome do Responsável Técnico do laboratório cliente';
COMMENT ON COLUMN public.tenants.email IS 'E-mail de contato principal do laboratório';
