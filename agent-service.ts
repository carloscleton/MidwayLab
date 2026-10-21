/**
 * MIDWAY AGENT - Robô de Fundo / Serviço Windows
 * Executa 24/7 sem necessidade de navegador aberto.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iibwbufbshqiaeorwoja.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('====================================================');
console.log('🤖 MIDWAY AGENT - SERVIÇO DE MONITORAMENTO 24/7');
console.log('Iniciando rotinas em segundo plano no Windows...');
console.log('====================================================');

interface IFolderTarget {
  tenantNome: string;
  tenantId: string;
  modeloEquipamento: string;
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  formato: string;
}

// Garante criação da pasta no Windows
function assegurarPasta(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[Agente] 📂 Pasta criada: ${dirPath}`);
    }
  } catch (err: any) {
    console.error(`[Agente] Erro ao criar pasta ${dirPath}:`, err.message);
  }
}

// Busca dinamicamente todas as pastas cadastradas para todas as empresas ativas
async function carregarAlvosMonitoramento(): Promise<IFolderTarget[]> {
  const alvos: IFolderTarget[] = [];

  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, nome, configuracoes, ativo')
      .eq('ativo', true);

    if (error || !tenants) {
      console.warn('[Agente] Aviso ao buscar tenants:', error?.message);
      return alvos;
    }

    for (const t of tenants) {
      const equipPastas = t.configuracoes?.equipamentos_pastas || {};

      for (const [modelo, cfg] of Object.entries<any>(equipPastas)) {
        if (cfg.diretorio_entrada && cfg.monitor_ativo !== false) {
          alvos.push({
            tenantNome: t.nome,
            tenantId: t.id,
            modeloEquipamento: modelo,
            diretorioEntrada: cfg.diretorio_entrada,
            diretorioProcessados: cfg.diretorio_processados || path.join(cfg.diretorio_entrada, 'Processados'),
            diretorioErros: cfg.diretorio_erros || 'C:\\Labfacil\\Erros',
            formato: cfg.formato || 'AUTO'
          });
        }
      }
    }
  } catch (e: any) {
    console.error('[Agente] Erro ao sincronizar configs com Supabase:', e.message);
  }

  return alvos;
}

// Varre e processa uma pasta específica
async function processarPasta(alvo: IFolderTarget) {
  if (!fs.existsSync(alvo.diretorioEntrada)) return;

  assegurarPasta(alvo.diretorioProcessados);
  assegurarPasta(alvo.diretorioErros);

  let arquivos: string[] = [];
  try {
    arquivos = fs.readdirSync(alvo.diretorioEntrada).filter(f => {
      const lower = f.toLowerCase();
      return (lower.endsWith('.xml') || lower.endsWith('.json')) && !lower.startsWith('tmp_');
    });
  } catch (e) {
    return;
  }

  for (const arquivo of arquivos) {
    const caminhoOrigem = path.join(alvo.diretorioEntrada, arquivo);
    console.log(`\n[Agente] ⚡ Processando arquivo: ${arquivo} (${alvo.tenantNome} -> ${alvo.modeloEquipamento})`);

    try {
      const conteudo = fs.readFileSync(caminhoOrigem, 'utf8');
      if (!conteudo.trim()) continue;

      // Move para a pasta de processados com carimbo de data/hora
      const nomeBase = path.parse(arquivo).name;
      const extensao = path.extname(arquivo);
      const destinoProcessado = path.join(
        alvo.diretorioProcessados,
        `${nomeBase}_${Date.now()}${extensao}`
      );

      fs.renameSync(caminhoOrigem, destinoProcessado);
      console.log(`[Agente] ✅ Arquivo processado e arquivado em: ${destinoProcessado}`);

    } catch (err: any) {
      console.error(`[Agente] ⚠️ Falha ao processar ${arquivo}:`, err.message);
      try {
        const destinoErro = path.join(alvo.diretorioErros, `${arquivo}_ERRO_${Date.now()}`);
        fs.renameSync(caminhoOrigem, destinoErro);
      } catch (_) {}
    }
  }
}

// Loop Principal do Robô (executa a cada 5 segundos)
async function loopRobo() {
  let alvos = await carregarAlvosMonitoramento();
  console.log(`[Agente] 🟢 Monitorando ${alvos.length} pasta(s) de equipamentos ativas no momento.`);

  // Recarrega alvos a cada 60 segundos
  setInterval(async () => {
    alvos = await carregarAlvosMonitoramento();
  }, 60000);

  // Varredura de pastas a cada 5 segundos
  setInterval(async () => {
    for (const alvo of alvos) {
      await processarPasta(alvo);
    }
  }, 5000);
}

loopRobo();
