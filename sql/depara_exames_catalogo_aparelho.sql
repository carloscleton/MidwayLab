-- Colunas extras em public.depara_exames para o catálogo de exames por equipamento
-- Execute no SQL Editor do Supabase.

ALTER TABLE public.depara_exames
  ADD COLUMN IF NOT EXISTS categoria            character varying(100),
  ADD COLUMN IF NOT EXISTS metodo_ou_principio  character varying(255),
  ADD COLUMN IF NOT EXISTS amostra_sugerida     character varying(100),
  ADD COLUMN IF NOT EXISTS unidade_padrao       character varying(50),
  ADD COLUMN IF NOT EXISTS ativo                boolean not null default true,
  ADD COLUMN IF NOT EXISTS catalogo_aparelho    boolean not null default false;

CREATE INDEX IF NOT EXISTS idx_depara_exames_equip_catalogo
  ON public.depara_exames (equipamento_id)
  WHERE catalogo_aparelho = true;
