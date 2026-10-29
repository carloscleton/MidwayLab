-- ==============================================================================
-- MIDWAYLAB - SCRIPT DE LIMPEZA E ATUALIZAÇÃO DA TABELA PUBLIC.PEDIDOS
-- Remove todas as colunas legadas e desnecessárias do Autolac e Softlab
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Remover a constraint unique antiga que dependia das colunas autolac
ALTER TABLE public.pedidos 
  DROP CONSTRAINT IF EXISTS uq_pedido_protocolo;

-- 2. Remover todas as colunas que mencionam autolac ou softlab
ALTER TABLE public.pedidos 
  DROP COLUMN IF EXISTS codigo_lote_autolac,
  DROP COLUMN IF EXISTS local_autolac,
  DROP COLUMN IF EXISTS protocolo_autolac,
  DROP COLUMN IF EXISTS codigo_pedido_softlab,
  DROP COLUMN IF EXISTS payload_autolac_xml,
  DROP COLUMN IF EXISTS payload_softlab_json;

-- 3. Atualizar o valor padrão (DEFAULT) da coluna status para 'NA_CARGA'
ALTER TABLE public.pedidos 
  ALTER COLUMN status SET DEFAULT 'NA_CARGA'::character varying;

-- 4. Garantir que a coluna arquivo_nome comporte nomes longos
ALTER TABLE public.pedidos 
  ALTER COLUMN arquivo_nome TYPE text;

-- 5. Garantir que a coluna origem_arquivo tenha tamanho adequado
ALTER TABLE public.pedidos 
  ALTER COLUMN origem_arquivo SET DEFAULT 'LABFACIL_XML'::character varying;

-- 6. Recriar índice de performance para consultas rápidas por empresa e data
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_created 
  ON public.pedidos USING btree (tenant_id, created_at DESC) 
  TABLESPACE pg_default;

-- ==============================================================================
-- ESTRUTURA FINAL ATUALIZADA (Para conferência ou novas instalações)
-- ==============================================================================
/*
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  codigo_pedido_labfacil character varying(100) NULL,
  numero_solicitacao character varying(100) NULL,
  paciente_nome character varying(255) NULL,
  paciente_cpf character varying(20) NULL,
  equipamento_id uuid NULL,
  modelo_equipamento character varying(100) NULL,
  status character varying(50) NOT NULL DEFAULT 'NA_CARGA'::character varying,
  origem_arquivo character varying(50) NULL DEFAULT 'LABFACIL_XML'::character varying,
  arquivo_nome text NULL,
  total_exames integer NULL DEFAULT 0,
  payload_labfacil_json text NULL,
  mensagem_erro text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.equipamentos (id) ON DELETE SET NULL
) TABLESPACE pg_default;
*/
