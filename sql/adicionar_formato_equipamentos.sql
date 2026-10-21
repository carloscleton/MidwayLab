-- Script para adicionar a coluna formato_arquivo na tabela equipamentos do Supabase
-- Execute este script no SQL Editor do painel do seu Supabase:

ALTER TABLE public.equipamentos 
ADD COLUMN IF NOT EXISTS formato_arquivo VARCHAR(50) DEFAULT 'JSON';

COMMENT ON COLUMN public.equipamentos.formato_arquivo IS 'Formato de mensagem/arquivo do analisador: XML, JSON, ASTM, HL7, CSV';

-- Atualiza os equipamentos existentes caso estejam vazios
UPDATE public.equipamentos
SET formato_arquivo = 'JSON'
WHERE formato_arquivo IS NULL AND (modelo = 'CB350' OR modelo LIKE '%CB%');

UPDATE public.equipamentos
SET formato_arquivo = 'ASTM'
WHERE formato_arquivo IS NULL AND (modelo = 'YUMIZEN' OR modelo = 'ACCESS');

UPDATE public.equipamentos
SET formato_arquivo = 'HL7'
WHERE formato_arquivo IS NULL AND (modelo LIKE '%BS%' OR modelo LIKE '%BC%');
