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
import * as http from 'http';
import * as net from 'net';
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

// Heartbeat para sinalizar que o robô está ativo
async function enviarHeartbeat() {
  if (!modoSeguro) return;
  try {
    await axios.post(
      `${API_URL}/api/agent`,
      { acao: 'heartbeat' },
      {
        headers: { 'x-agent-token': AGENT_TOKEN },
        timeout: 5000
      }
    );
  } catch (_) {}
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

        // Registra configurações de portas dos equipamentos
        if (Array.isArray(res.data.equipamentos)) {
          for (const eq of res.data.equipamentos) {
            if (eq.tipo_comunicacao === 'TCP_IP' && eq.ip_host) {
              if (eq.usar_segunda_porta && eq.porta_resultados) {
                console.log(`[Agente] 🔌 ${eq.modelo} [TCP/IP]: ${eq.ip_host} -> Modo 2 Portas Ativado (Query: ${eq.porta} | Resultados: ${eq.porta_resultados})`);
              } else {
                console.log(`[Agente] 🔌 ${eq.modelo} [TCP/IP]: ${eq.ip_host} -> Modo Porta Única (${eq.porta}) [2ª Porta Desabilitada]`);
              }
            }
          }
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
              diretorioProcessados: cfg.diretorio_processados || path.join('C:\\MidwayLab', 'Labfacil', modelo, 'Processados'),
              diretorioErros: cfg.diretorio_erros || path.join('C:\\MidwayLab', 'Labfacil', modelo, 'Erros'),
              diretorioCarga: cfg.diretorio_carga || path.join('C:\\MidwayLab', 'Equipamentos', modelo, 'Carga')
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
  destinoProcessado: string,
  destinoCarga: string = '',
  status: 'NA_CARGA' | 'PROCESSADO' | 'ERRO' = 'NA_CARGA',
  mensagemErro: string | null = null
) {
  const agora = new Date().toISOString();

  // Etapas detalhadas do ciclo de vida para o log
  const etapas = [
    {
      etapa: 'ENTRADA',
      titulo: '1. Arquivo na Pasta Entrada',
      descricao: `Recebido: ${arquivo} em ${alvo.diretorioEntrada}`,
      status: 'CONCLUIDO',
      timestamp: agora
    },
    {
      etapa: 'LEITURA',
      titulo: '2. Identificação da Amostra',
      descricao: `Amostra: ${codigoPedido} • Paciente: ${pacienteNome}`,
      status: 'CONCLUIDO',
      timestamp: agora
    },
    {
      etapa: 'CONVERSAO',
      titulo: '3. Conversão de Layout',
      descricao: `Formato processado para o modelo ${alvo.modeloEquipamento}`,
      status: status === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
      timestamp: agora
    },
    {
      etapa: 'CARGA',
      titulo: '4. Worklist Gravada no Analisador',
      descricao: status === 'ERRO' ? 'Carga cancelada devido a erro' : `Worklist gerada em ${destinoCarga}`,
      status: status === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
      timestamp: agora
    },
    {
      etapa: 'ARQUIVAMENTO',
      titulo: '5. Arquivamento Seguro',
      descricao: status === 'ERRO' ? `Movido para pasta Erros (${alvo.diretorioErros})` : `Movido para ${destinoProcessado}`,
      status: 'CONCLUIDO',
      timestamp: agora
    },
    {
      etapa: 'NUVEM',
      titulo: '6. Confirmação no MidwayLab',
      descricao: status === 'ERRO' ? `Erro registrado: ${mensagemErro}` : `Registrado e auditado no servidor em nuvem`,
      status: status === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
      timestamp: agora
    }
  ];

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
          arquivoCarga: destinoCarga,
          arquivoProcessado: destinoProcessado,
          origemArquivo: path.extname(arquivo).toLowerCase().includes('json') ? 'LABFACIL_JSON' : 'LABFACIL_XML',
          status,
          mensagemErro,
          etapas
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
        status: status,
        mensagem_erro: mensagemErro,
        payload_labfacil_json: JSON.stringify({
          modelo_equipamento: alvo.modeloEquipamento,
          arquivo_origem: arquivo,
          arquivo_carga: destinoCarga,
          arquivo_processado: destinoProcessado,
          processado_em: agora,
          etapas
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

    let codigoPedido = `PED-${Date.now().toString().slice(-6)}`;
    let pacienteNome = 'PACIENTE IMPORTADO';

    try {
      const conteudo = fs.readFileSync(caminhoOrigem, 'utf8');
      if (!conteudo.trim()) continue;

      const extraidoInicial = extrairDadosArquivo(conteudo, arquivo);
      codigoPedido = extraidoInicial.codigoPedido;
      pacienteNome = extraidoInicial.pacienteNome;

      // 1. Pasta de Carga do analisador
      let baseMidway = 'C:\\MidwayLab';
      if (alvo.diretorioEntrada && alvo.diretorioEntrada.toLowerCase().includes('labfacil')) {
        const partes = alvo.diretorioEntrada.split(/[\\/]labfacil/i);
        if (partes[0] && partes[0].trim().length > 0) {
          baseMidway = partes[0].trim();
        }
      }
      const pastaCargaEquipamento = alvo.diretorioCarga || path.join(baseMidway, 'Equipamentos', alvo.modeloEquipamento, 'Carga');
      assegurarPasta(pastaCargaEquipamento);

      // 2. Converte para o layout oficial do equipamento (ASTM, HL7, JSON, etc) via API Segura
      if (modoSeguro) {
        const res = await axios.post(
          `${API_URL}/api/agent`,
          {
            acao: 'processar_arquivo',
            modeloEquipamento: alvo.modeloEquipamento,
            nomeArquivo: arquivo,
            conteudoArquivo: conteudo
          },
          {
            headers: { 'x-agent-token': AGENT_TOKEN },
            timeout: 15000
          }
        );

        if (res.data?.ok && Array.isArray(res.data.cargas) && res.data.cargas.length > 0) {
          for (const c of res.data.cargas) {
            codigoPedido = c.pedidoId || codigoPedido;
            pacienteNome = c.paciente || pacienteNome;
            const nomeCarga = c.nomeArquivoSugerido || `CARGA_${c.pedidoId}.astm`;
            const destinoCarga = path.join(pastaCargaEquipamento, nomeCarga);
            fs.writeFileSync(destinoCarga, c.conteudoArquivo, 'utf8');
            console.log(`[Agente] 📋 Carga oficial (${c.formato || 'ASTM'}) gerada com sucesso em: ${destinoCarga}`);
          }

          // 3. Move o arquivo original XML/JSON para a pasta Processados
          const nomeBaseLimpo = path.parse(arquivo).name.slice(0, 50);
          const extensao = path.extname(arquivo);
          const destinoProcessado = path.join(
            alvo.diretorioProcessados,
            `${nomeBaseLimpo}_${Date.now()}${extensao}`
          );

          fs.copyFileSync(caminhoOrigem, destinoProcessado);
          fs.unlinkSync(caminhoOrigem);
          console.log(`[Agente] ✅ Arquivo original arquivado com sucesso em: ${destinoProcessado}`);
          continue;
        } else {
          throw new Error(res.data?.erro || 'API não retornou cargas convertidas');
        }
      }

      // Modo de contingência / legado
      const extraidoFallback = extrairDadosArquivo(conteudo, arquivo);
      codigoPedido = extraidoFallback.codigoPedido;
      pacienteNome = extraidoFallback.pacienteNome;
      const dateFormatted = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const patientNameAstm = (pacienteNome || 'PACIENTE').trim().replace(/\s+/g, '^');
      const astmContent = [
        `H|\\^&|||${alvo.modeloEquipamento}|||||||P|1|${dateFormatted}`,
        `P|1|||${codigoPedido}||${patientNameAstm}|||U|||||||||||||||`,
        `O|1|${codigoPedido}||||||||A||||||||||||||Q`,
        `L|1|N`
      ].join('\r\n');
      const nomeCarga = `${alvo.modeloEquipamento}_${codigoPedido}.astm`;
      const destinoCarga = path.join(pastaCargaEquipamento, nomeCarga);
      fs.writeFileSync(destinoCarga, astmContent, 'utf8');
      console.log(`[Agente] 📋 Carga ASTM gerada localmente em: ${destinoCarga}`);

      // 3. Arquiva em Processados
      const nomeBaseLimpo = path.parse(arquivo).name.slice(0, 50);
      const extensao = path.extname(arquivo);
      const destinoProcessado = path.join(
        alvo.diretorioProcessados,
        `${nomeBaseLimpo}_${Date.now()}${extensao}`
      );

      fs.copyFileSync(caminhoOrigem, destinoProcessado);
      fs.unlinkSync(caminhoOrigem);
      console.log(`[Agente] ✅ Arquivo original arquivado com sucesso em: ${destinoProcessado}`);

      // 4. Registra o ciclo completo de ponta a ponta na nuvem
      await registrarPedidoProcessado(
        alvo,
        codigoPedido,
        pacienteNome,
        arquivo,
        destinoProcessado,
        destinoCarga,
        'NA_CARGA',
        null
      );

    } catch (err: any) {
      console.error(`[Agente] ⚠️ Falha ao processar ${arquivo}:`, err.message);

      let destinoErro = '';
      try {
        const nomeCurto = path.parse(arquivo).name.slice(0, 40);
        destinoErro = path.join(alvo.diretorioErros, `${nomeCurto}_ERRO_${Date.now()}`);
        fs.copyFileSync(caminhoOrigem, destinoErro);
        fs.unlinkSync(caminhoOrigem);
      } catch (_) {}

      // Registra o log de erro no sistema
      await registrarPedidoProcessado(
        alvo,
        codigoPedido,
        pacienteNome,
        arquivo,
        destinoErro,
        '',
        'ERRO',
        err.message
      );
    }
  }
}

// ==============================================================================
// BRIDGE LOCAL HTTP (Porta 4545)
// Permite que o Painel Web (local ou em nuvem) execute testes de conectividade
// TCP/IP e validação de pastas diretamente no ambiente de rede da máquina local.
// ==============================================================================
function testarSocketTcp(host: string, port: number, timeoutSec: number): Promise<{ success: boolean; erro?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutSec * 1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve({ success: true });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, erro: `Timeout de ${timeoutSec}s` });
    });
    socket.on('error', (err: any) => {
      socket.destroy();
      resolve({ success: false, erro: err.message });
    });
    try {
      socket.connect(port, host);
    } catch (e: any) {
      resolve({ success: false, erro: e.message });
    }
  });
}

function iniciarBridgeLocal() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      if (pathname === '/test-socket') {
        const ip = parsedUrl.searchParams.get('ip') || '127.0.0.1';
        const porta1 = parseInt(parsedUrl.searchParams.get('porta') || '7101', 10);
        const porta2Raw = parsedUrl.searchParams.get('porta2');
        const porta2 = porta2Raw ? parseInt(porta2Raw, 10) : null;
        const timeoutSec = parseInt(parsedUrl.searchParams.get('timeout') || '10', 10);

        testarSocketTcp(ip, porta1, timeoutSec).then((res1) => {
          if (!res1.success) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              message: `❌ Falha ao conectar na Porta TCP principal (${porta1}) no host ${ip}: ${res1.erro}`
            }));
            return;
          }

          // Se a segunda porta estiver desabilitada
          if (!porta2) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: `✓ Conexão TCP/IP local testada com sucesso na Porta Única ${ip}:${porta1}! (2ª porta desabilitada conforme configurado).`
            }));
            return;
          }

          // Se a segunda porta estiver habilitada, testa também
          testarSocketTcp(ip, porta2, timeoutSec).then((res2) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (res2.success) {
              res.end(JSON.stringify({
                success: true,
                message: `✓ Conexão TCP/IP local testada com sucesso em AMBAS as portas! Porta 1 (Query: ${porta1}) OK • Porta 2 (Resultados: ${porta2}) OK.`
              }));
            } else {
              res.end(JSON.stringify({
                success: false,
                message: `⚠️ Porta 1 (Query: ${porta1}) OK, mas a 2ª Porta (Resultados: ${porta2}) falhou: ${res2.erro}. Verifique se o U-WAM está ativo na 2ª porta.`
              }));
            }
          });
        });
        return;
      }

      if (pathname === '/test-folder') {
        const dirCarga = parsedUrl.searchParams.get('diretorioCarga') || '';
        const dirRes = parsedUrl.searchParams.get('diretorioResultados') || '';
        const cargaOk = fs.existsSync(dirCarga);
        const resOk = fs.existsSync(dirRes);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: cargaOk,
          message: cargaOk
            ? `✓ Pastas locais validadas no disco pelo Robô! Carga: ${cargaOk ? 'OK' : 'Não encontrada'} | Resultados: ${resOk ? 'OK' : 'Não encontrada'}`
            : `❌ Pasta de carga não encontrada no disco: ${dirCarga}`
        }));
        return;
      }

      if (pathname === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, robo: 'MidwayLab Agent', status: 'Ativo 24/7' }));
        return;
      }

      res.writeHead(404);
      res.end();
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: e.message }));
    }
  });

  server.listen(4545, '127.0.0.1', () => {
    console.log('[Agente] 🌐 Bridge Local TCP/IP ativo em http://127.0.0.1:4545 (Porta 4545)');
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('[Agente] ℹ️ Bridge Local na porta 4545 já em execução.');
    } else {
      console.warn('[Agente] Aviso no Bridge Local:', err.message);
    }
  });
}

// Inicia o bridge local
iniciarBridgeLocal();

// Loop contínuo de monitoramento
let isExecutandoVarredura = false;
async function executarCiclo() {
  if (isExecutandoVarredura) return;
  isExecutandoVarredura = true;

  try {
    await enviarHeartbeat();
    const alvos = await carregarAlvosMonitoramento();
    if (alvos.length > 0) {
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
