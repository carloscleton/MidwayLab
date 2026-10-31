-- Adiciona as colunas de Modo de Operação ASTM e 2ª Porta de Resultados no Supabase
ALTER TABLE public.equipamentos 
  ADD COLUMN IF NOT EXISTS modo_operacao VARCHAR(50) DEFAULT 'QUERY',
  ADD COLUMN IF NOT EXISTS porta_resultados INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usar_segunda_porta BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS timeout_conexao INTEGER DEFAULT 15;
