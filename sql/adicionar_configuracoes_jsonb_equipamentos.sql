-- ==============================================================================
-- MIDWAYLAB - SCRIPT DE EVOLUÇÃO E FLEXIBILIDADE COM JSONB (PUBLIC.EQUIPAMENTOS)
-- Adiciona a coluna configuracoes JSONB para permitir campos infinitos e customizados
-- por modelo sem precisar criar colunas soltas na tabela.
-- ==============================================================================

-- 1. Adicionar coluna configuracoes JSONB com valor padrão seguro
ALTER TABLE public.equipamentos 
  ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}'::jsonb;

-- 2. Migrar dados já existentes das colunas específicas para dentro do JSONB
UPDATE public.equipamentos
SET configuracoes = jsonb_strip_nulls(
  coalesce(configuracoes, '{}'::jsonb) || 
  jsonb_build_object(
    'ip_host', ip_host,
    'porta', porta,
    'porta_resultados', porta_resultados,
    'modo_operacao', modo_operacao,
    'timeout_conexao', timeout_conexao,
    'diretorio_carga', diretorio_carga,
    'diretorio_resultados', diretorio_resultados
  )
)
WHERE configuracoes IS NULL OR configuracoes = '{}'::jsonb;

-- 3. Criar índice GIN no campo JSONB para buscas e consultas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_equipamentos_configuracoes 
  ON public.equipamentos USING gin (configuracoes);
