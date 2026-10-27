/**
 * MIDWAY AGENT - Robô de Fundo / Serviço Windows
 * Executa 24/7 de forma 100% autônoma e segura.
 *
 * MODO SEGURO:
 *   Utiliza apenas MIDWAY_API_URL e MIDWAY_AGENT_TOKEN.
 *   Nenhuma chave mestra do banco Supabase precisa ficar na máquina do cliente!
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { XMLParser } from 'fast-xml-parser';

// Busca o caminho do .env mesmo se o serviço for chamado pelo Agendador do Windows (wscript) em outro diretório
const rootDir = __dirname.includes('dist-agent') ? path.join(__dirname, '..') : __dirname;
dotenv.config({ path: path.join(rootDir, '.env') });

const API_URL = (process.env.MIDWAY_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const AGENT_TOKEN = (process.env.MIDWAY_AGENT_TOKEN || '').trim();

// Fallback legado caso o cliente ainda não tenha configurado o MIDWAY_AGENT_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const modoSeguro = Boolean(AGENT_TOKEN && AGENT_TOKEN.length > 8);
let supabaseLegado: any = null;

if (!modoSeguro && SUPABASE_URL && SUPABASE_KEY) {
  supabaseLegado = createClient(SUPABASE_URL, SUPABASE_KEY);
}

console.log('====================================================');
console.log('🤖 MIDWAY AGENT - SERVIÇO DE MONITORAMENTO 24/7');
if (modoSeguro) {
  console.log('🛡️  MODO SEGURO ATIVADO: Autenticação via API Token');
  console.log(`🌐 Servidor MidwayLab: ${API_URL}`);
  console.log(`🔑 Token do Laboratório: ${AGENT_TOKEN.slice(0, 10)}...`);
} else {
  console.warn('⚠️  MODO LEGADO: Conexão direta ao banco Supabase.');
  console.warn('💡 Recomendado: Configure MIDWAY_AGENT_TOKEN no .env para segurança total.');
}
console.log('Iniciando rotinas em segundo plano no Windows...');
console.log('====================================================\n');

interface IFolderTarget {
  tenantNome: string;
  tenantId: string;
  modeloEquipamento: string;
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  diretorioCarga?: string;
  formato?: string;
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

// Extrai dados básicos do arquivo para registrar no sistema
function extrairDadosArquivo(conteudo: string, nomeArquivo: string) {
  let pacienteNome = 'PACIENTE IMPORTADO';
  let codigoPedido = `PED-${Date.now().toString().slice(-6)}`;

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

// Busca as pastas a monitorar (via API Segura ou Supabase Legado)
async function carregarAlvosMonitoramento(): Promise<IFolderTarget[]> {
  const alvos: IFolderTarget[] = [];

  // MODO SEGURO: Chama /api/agent com o token do laboratório
  if (modoSeguro) {
    try {
      const res = await axios.get(`${API_URL}/api/agent`, {
        headers: {
          'x-agent-token': AGENT_TOKEN
        },
        timeout: 10000
      });

      if (res.data?.ok && Array.isArray(res.data.alvos)) {
        const tenantNome = res.data.tenant?.nome || 'LABORATÓRIO';
        const tenantId = res.data.tenant?.id || 'CLIENTE';

        for (const a of res.data.alvos) {
          alvos.push({
            tenantNome,
            tenantId,
            modeloEquipamento: a.modeloEquipamento,
            diretorioEntrada: a.diretorioEntrada,
            diretorioProcessados: a.diretorioProcessados,
            diretorioErros: a.diretorioErros,
            diretorioCarga: a.diretorioCarga
          });
        }
      } else {
        console.warn('[Agente] Resposta inesperada da API:', res.data);
      }
    } catch (e: any) {
      const msg = e.response?.data?.erro || e.message;
      console.error(`[Agente] ⚠️ Falha ao consultar API (${API_URL}/api/agent):`, msg);
    }
    return alvos;
  }

  // MODO LEGADO (apenas se não houver MIDWAY_AGENT_TOKEN)
  if (supabaseLegado) {
    try {
      const { data: tenants, error } = await supabaseLegado
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
              diretorioCarga: cfg.diretorio_carga
            });
          }
        }
      }
    } catch (e: any) {
      console.error('[Agente] Erro ao sincronizar configs com Supabase:', e.message);
    }
  }

  return alvos;
}

// Sincroniza o pedido processado com a nuvem (via API Segura ou Supabase Legado)
async function registrarPedidoProcessado(
  alvo: IFolderTarget,
  codigoPedido: string,
  pacienteNome: string,
  arquivo: string,
  destinoProcessado: string
) {
  // MODO SEGURO: Envia para a API Segura do MidwayLab
  if (modoSeguro) {
    try {
      const res = await axios.post(
        `${API_URL}/api/agent`,
        {
          codigoPedido,
          pacienteNome,
          modeloEquipamento: alvo.modeloEquipamento,
          arquivoNome: arquivo,
          arquivoProcessado: destinoProcessado,
          origemArquivo: path.extname(arquivo).toLowerCase().includes('json') ? 'LABFACIL_JSON' : 'LABFACIL_XML'
        },
        {
          headers: {
            'x-agent-token': AGENT_TOKEN
          },
          timeout: 10000
        }
      );

      if (res.data?.ok) {
        console.log(`[Agente] 🌐 Pedido '${codigoPedido}' sincronizado com sucesso na nuvem via API Segura!`);
      } else {
        console.warn(`[Agente] ⚠️ Aviso da API ao salvar pedido:`, res.data?.erro);
      }
      return;
    } catch (err: any) {
      const msg = err.response?.data?.erro || err.message;
      console.error(`[Agente] ❌ Erro ao enviar pedido para a API (${API_URL}/api/agent):`, msg);
      return;
    }
  }

  // MODO LEGADO (Direto no Supabase)
  if (supabaseLegado) {
    try {
      const protocoloUnico = `${codigoPedido}_${Date.now().toString().slice(-4)}`;

      const payloadInsert = {
        tenant_id: alvo.tenantId,
        local_autolac: 'LABFACIL',
        codigo_lote_autolac: `LOTE-${alvo.modeloEquipamento}`,
        protocolo_autolac: protocoloUnico,
        numero_solicitacao: codigoPedido,
        paciente_nome: pacienteNome,
        codigo_pedido_labfacil: codigoPedido,
        origem_arquivo: path.extname(arquivo).toLowerCase().includes('json') ? 'LABFACIL_JSON' : 'LABFACIL_XML',
        arquivo_nome: arquivo,
        status: 'PROCESSADO',
        payload_labfacil_json: JSON.stringify({
          modelo_equipamento: alvo.modeloEquipamento,
          arquivo_processado: destinoProcessado,
          processado_em: new Date().toISOString()
        })
      };

      const { error: insErr } = await supabaseLegado.from('pedidos').insert([payloadInsert]);
      if (insErr) {
        console.error(`[Agente] ❌ Erro ao salvar pedido no Supabase: ${insErr.message}`);
      } else {
        console.log(`[Agente] 🌐 Pedido '${codigoPedido}' gravado com sucesso no Supabase!`);
      }
    } catch (dbErr: any) {
      console.error('[Agente] ⚠️ Falha na chamada Supabase:', dbErr.message);
    }
  }
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

      // Pasta de Carga do analisador
      let baseMidway = 'C:\\MidwayLab';
      if (alvo.diretorioEntrada && alvo.diretorioEntrada.toLowerCase().includes('labfacil')) {
        const partes = alvo.diretorioEntrada.split(/[\\/]labfacil/i);
        if (partes[0] && partes[0].trim().length > 0) {
          baseMidway = partes[0].trim();
        }
      }
      const pastaCargaEquipamento = alvo.diretorioCarga || path.join(baseMidway, 'Equipamentos', alvo.modeloEquipamento, 'Carga');
      assegurarPasta(pastaCargaEquipamento);

      // Copia para a pasta de Carga do equipamento
      const destinoCarga = path.join(pastaCargaEquipamento, arquivo);
      fs.copyFileSync(caminhoOrigem, destinoCarga);
      console.log(`[Agente] 📋 Carga copiada para o equipamento em: ${destinoCarga}`);

      // Arquiva em Processados
      const nomeBaseLimpo = path.parse(arquivo).name.slice(0, 50);
      const extensao = path.extname(arquivo);
      const destinoProcessado = path.join(
        alvo.diretorioProcessados,
        `${nomeBaseLimpo}_${Date.now()}${extensao}`
      );

      fs.copyFileSync(caminhoOrigem, destinoProcessado);
      fs.unlinkSync(caminhoOrigem);
      console.log(`[Agente] ✅ Arquivo original arquivado com sucesso em: ${destinoProcessado}`);

      // Registra o pedido com segurança na nuvem
      const { pacienteNome, codigoPedido } = extrairDadosArquivo(conteudo, arquivo);
      await registrarPedidoProcessado(alvo, codigoPedido, pacienteNome, arquivo, destinoProcessado);

    } catch (err: any) {
      console.error(`[Agente] ⚠️ Falha ao processar ${arquivo}:`, err.message);
    }
  }
}

// Loop contínuo de monitoramento
let isExecutandoVarredura = false;
async function executarCiclo() {
  if (isExecutandoVarredura) return;
  isExecutandoVarredura = true;

  try {
    const alvos = await carregarAlvosMonitoramento();
    if (alvos.length === 0) {
      // Silencioso se não houver alvos cadastrados
    } else {
      for (const alvo of alvos) {
        await processarPasta(alvo);
      }
    }
  } catch (err: any) {
    console.error('[Agente] Erro no ciclo de varredura:', err.message);
  } finally {
    isExecutandoVarredura = false;
  }
}

// Inicia imediatamente e roda a cada 4 segundos
executarCiclo();
setInterval(executarCiclo, 4000);
