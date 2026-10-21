-- Linhas de resultado e exames calculados por exame do catálogo do aparelho
-- Execute no SQL Editor do Supabase (depois de depara_exames_catalogo_aparelho.sql).

ALTER TABLE public.depara_exames
  ADD COLUMN IF NOT EXISTS linhas_resultado jsonb not null default '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS calculados       jsonb not null default '[]'::jsonb;
