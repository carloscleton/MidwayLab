/**
 * MIDWAY AGENT - Robô de Fundo / Serviço Windows
 * Executa 24/7 sem necessidade de navegador aberto.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

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

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'text',
  trimValues: true,
});

// Extrai dados básicos do arquivo para registrar no Supabase
function extrairDadosArquivo(conteudo: string, nomeArquivo: string) {
  let pacienteNome = 'PACIENTE IMPORTADO';
  let codigoPedido = `PED-${Date.now().toString().slice(-6)}`;
  let examesList: string[] = [];

  try {
    if (nomeArquivo.toLowerCase().endsWith('.xml') || conteudo.trim().startsWith('<')) {
      const parsed = xmlParser.parse(conteudo);
      const root = parsed.Principal || parsed.root || parsed.PEDIDO || parsed;
      const pac = root.Paciente || root.paciente || {};
      pacienteNome = pac.Nome || pac.nome || pac.NomePaciente || 'PACIENTE XML';
      codigoPedido = String(pac.Amostra || pac.amostra || pac.Codigo || root.NumeroPedido || codigoPedido);
    } else {
      const parsed = JSON.parse(conteudo);
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      pacienteNome = obj.cliente?.nome || obj.paciente || obj.nome || 'PACIENTE JSON';
      codigoPedido = String(obj.numeroPedido || obj.pedido || codigoPedido);
    }
  } catch (e) {}

  return { pacienteNome, codigoPedido };
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

      // Cria a subpasta de Cargas para o equipamento correspondente
      const pastaCargas = path.join(alvo.diretorioProcessados, `Cargas_${alvo.modeloEquipamento}`);
      assegurarPasta(pastaCargas);

      // Limita o nome do arquivo para evitar erro MAX_PATH do Windows (> 260 caracteres)
      const nomeBaseLimpo = path.parse(arquivo).name.slice(0, 50);
      const extensao = path.extname(arquivo);
      const destinoProcessado = path.join(
        alvo.diretorioProcessados,
        `${nomeBaseLimpo}_${Date.now()}${extensao}`
      );

      // No Windows, fs.copyFileSync + fs.unlinkSync é muito mais resiliente que rename direto entre pastas/locks
      fs.copyFileSync(caminhoOrigem, destinoProcessado);
      fs.unlinkSync(caminhoOrigem);
      console.log(`[Agente] ✅ Arquivo original arquivado com sucesso em: ${destinoProcessado}`);

      // 3. REGISTRA O PEDIDO NO BANCO SUPABASE (PARA APARECER NA INTERFACE WEB EM TEMPO REAL)
      try {
        const { pacienteNome, codigoPedido } = extrairDadosArquivo(conteudo, arquivo);
        const { error: insErr } = await supabase.from('pedidos').insert([
          {
            tenant_id: alvo.tenantId,
            local_autolac: 'LAB',
            codigo_lote_autolac: `LOTE-${alvo.modeloEquipamento}`,
            protocolo_autolac: codigoPedido,
            numero_solicitacao: codigoPedido,
            paciente_nome: pacienteNome,
            codigo_pedido_labfacil: codigoPedido,
            origem_arquivo: path.extname(arquivo).replace('.', '').toUpperCase(),
            arquivo_nome: arquivo,
            status: 'PROCESSADO',
            payload_labfacil_json: {
              modelo_equipamento: alvo.modeloEquipamento,
              arquivo_processado: destinoProcessado,
              processado_em: new Date().toISOString()
            }
          }
        ]);
        if (insErr) {
          console.warn('[Agente] Aviso ao sincronizar pedido com Supabase:', insErr.message);
        } else {
          console.log(`[Agente] 🌐 Pedido '${codigoPedido}' sincronizado no Supabase com sucesso!`);
        }
      } catch (dbErr: any) {
        console.warn('[Agente] Erro de rede ao sincronizar com Supabase:', dbErr.message);
      }

    } catch (err: any) {
      console.error(`[Agente] ⚠️ Falha ao processar ${arquivo}:`, err.message);
      try {
        const nomeCurto = path.parse(arquivo).name.slice(0, 40);
        const destinoErro = path.join(alvo.diretorioErros, `${nomeCurto}_ERRO_${Date.now()}`);
        fs.copyFileSync(caminhoOrigem, destinoErro);
        fs.unlinkSync(caminhoOrigem);
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
