"use strict";
/**
 * MIDWAY AGENT - Robô de Fundo / Serviço Windows
 * Executa 24/7 de forma 100% autônoma e segura.
 *
 * MODO SEGURO:
 *   Utiliza apenas MIDWAY_API_URL e MIDWAY_AGENT_TOKEN.
 *   Nenhuma chave mestra do banco Supabase precisa ficar na máquina do cliente!
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const supabase_js_1 = require("@supabase/supabase-js");
const fast_xml_parser_1 = require("fast-xml-parser");
// Busca o caminho do .env mesmo se o serviço for chamado pelo Agendador do Windows (wscript) em outro diretório
const rootDir = __dirname.includes('dist-agent') ? path.join(__dirname, '..') : __dirname;
dotenv.config({ path: path.join(rootDir, '.env') });
const API_URL = (process.env.MIDWAY_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const AGENT_TOKEN = (process.env.MIDWAY_AGENT_TOKEN || '').trim();
// Fallback legado caso o cliente ainda não tenha configurado o MIDWAY_AGENT_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const modoSeguro = Boolean(AGENT_TOKEN && AGENT_TOKEN.length > 8);
let supabaseLegado = null;
if (!modoSeguro && SUPABASE_URL && SUPABASE_KEY) {
    supabaseLegado = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY);
}
console.log('====================================================');
console.log('🤖 MIDWAY AGENT - SERVIÇO DE MONITORAMENTO 24/7');
if (modoSeguro) {
    console.log('🛡️  MODO SEGURO ATIVADO: Autenticação via API Token');
    console.log(`🌐 Servidor MidwayLab: ${API_URL}`);
    console.log(`🔑 Token do Laboratório: ${AGENT_TOKEN.slice(0, 10)}...`);
}
else {
    console.warn('⚠️  MODO LEGADO: Conexão direta ao banco Supabase.');
    console.warn('💡 Recomendado: Configure MIDWAY_AGENT_TOKEN no .env para segurança total.');
}
console.log('Iniciando rotinas em segundo plano no Windows...');
console.log('====================================================\n');
// Garante criação da pasta no Windows
function assegurarPasta(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`[Agente] 📂 Pasta criada: ${dirPath}`);
        }
    }
    catch (err) {
        console.error(`[Agente] Erro ao criar pasta ${dirPath}:`, err.message);
    }
}
const xmlParser = new fast_xml_parser_1.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
    trimValues: true,
});
// Extrai dados básicos do arquivo para registrar no sistema
function extrairDadosArquivo(conteudo, nomeArquivo) {
    let pacienteNome = 'PACIENTE IMPORTADO';
    let codigoPedido = `PED-${Date.now().toString().slice(-6)}`;
    try {
        if (nomeArquivo.toLowerCase().endsWith('.xml') || conteudo.trim().startsWith('<')) {
            const parsed = xmlParser.parse(conteudo);
            const root = parsed.Principal || parsed.root || parsed.PEDIDO || parsed;
            const pac = root.Paciente || root.paciente || {};
            pacienteNome = pac.Nome || pac.nome || pac.NomePaciente || 'PACIENTE XML';
            codigoPedido = String(pac.Amostra || pac.amostra || pac.Codigo || root.NumeroPedido || codigoPedido);
        }
        else {
            const parsed = JSON.parse(conteudo);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            pacienteNome = obj.cliente?.nome || obj.paciente || obj.nome || 'PACIENTE JSON';
            codigoPedido = String(obj.numeroPedido || obj.pedido || codigoPedido);
        }
    }
    catch (e) { }
    return { pacienteNome, codigoPedido };
}
// Heartbeat para sinalizar que o robô está ativo
async function enviarHeartbeat() {
    if (!modoSeguro)
        return;
    try {
        await axios_1.default.post(`${API_URL}/api/agent`, { acao: 'heartbeat' }, {
            headers: { 'x-agent-token': AGENT_TOKEN },
            timeout: 5000
        });
    }
    catch (_) { }
}
// Busca as pastas a monitorar (via API Segura ou Supabase Legado)
async function carregarAlvosMonitoramento() {
    const alvos = [];
    // MODO SEGURO: Chama /api/agent com o token do laboratório
    if (modoSeguro) {
        try {
            const res = await axios_1.default.get(`${API_URL}/api/agent`, {
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
            }
            else {
                console.warn('[Agente] Resposta inesperada da API:', res.data);
            }
        }
        catch (e) {
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
                for (const [modelo, cfg] of Object.entries(equipPastas)) {
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
        }
        catch (e) {
            console.error('[Agente] Erro ao sincronizar configs com Supabase:', e.message);
        }
    }
    return alvos;
}
// Sincroniza o pedido processado com a nuvem (via API Segura ou Supabase Legado)
async function registrarPedidoProcessado(alvo, codigoPedido, pacienteNome, arquivo, destinoProcessado, destinoCarga = '', status = 'PROCESSADO', mensagemErro = null) {
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
            const res = await axios_1.default.post(`${API_URL}/api/agent`, {
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
            }, {
                headers: {
                    'x-agent-token': AGENT_TOKEN
                },
                timeout: 10000
            });
            if (res.data?.ok) {
                console.log(`[Agente] 🌐 Pedido '${codigoPedido}' sincronizado com sucesso na nuvem via API Segura!`);
            }
            else {
                console.warn(`[Agente] ⚠️ Aviso da API ao salvar pedido:`, res.data?.erro);
            }
            return;
        }
        catch (err) {
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
            }
            else {
                console.log(`[Agente] 🌐 Pedido '${codigoPedido}' gravado com sucesso no Supabase!`);
            }
        }
        catch (dbErr) {
            console.error('[Agente] ⚠️ Falha na chamada Supabase:', dbErr.message);
        }
    }
}
// Varre e processa uma pasta específica
async function processarPasta(alvo) {
    if (!fs.existsSync(alvo.diretorioEntrada))
        return;
    assegurarPasta(alvo.diretorioProcessados);
    assegurarPasta(alvo.diretorioErros);
    let arquivos = [];
    try {
        arquivos = fs.readdirSync(alvo.diretorioEntrada).filter(f => {
            const lower = f.toLowerCase();
            return (lower.endsWith('.xml') || lower.endsWith('.json')) && !lower.startsWith('tmp_');
        });
    }
    catch (e) {
        return;
    }
    for (const arquivo of arquivos) {
        const caminhoOrigem = path.join(alvo.diretorioEntrada, arquivo);
        console.log(`\n[Agente] ⚡ Processando arquivo: ${arquivo} (${alvo.tenantNome} -> ${alvo.modeloEquipamento})`);
        let codigoPedido = `PED-${Date.now().toString().slice(-6)}`;
        let pacienteNome = 'PACIENTE IMPORTADO';
        try {
            const conteudo = fs.readFileSync(caminhoOrigem, 'utf8');
            if (!conteudo.trim())
                continue;
            const extraido = extrairDadosArquivo(conteudo, arquivo);
            codigoPedido = extraido.codigoPedido;
            pacienteNome = extraido.pacienteNome;
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
            // 2. Copia para a pasta de Carga do equipamento
            const destinoCarga = path.join(pastaCargaEquipamento, arquivo);
            fs.copyFileSync(caminhoOrigem, destinoCarga);
            console.log(`[Agente] 📋 Carga copiada para o equipamento em: ${destinoCarga}`);
            // 3. Arquiva em Processados
            const nomeBaseLimpo = path.parse(arquivo).name.slice(0, 50);
            const extensao = path.extname(arquivo);
            const destinoProcessado = path.join(alvo.diretorioProcessados, `${nomeBaseLimpo}_${Date.now()}${extensao}`);
            fs.copyFileSync(caminhoOrigem, destinoProcessado);
            fs.unlinkSync(caminhoOrigem);
            console.log(`[Agente] ✅ Arquivo original arquivado com sucesso em: ${destinoProcessado}`);
            // 4. Registra o ciclo completo de ponta a ponta na nuvem
            await registrarPedidoProcessado(alvo, codigoPedido, pacienteNome, arquivo, destinoProcessado, destinoCarga, 'PROCESSADO', null);
        }
        catch (err) {
            console.error(`[Agente] ⚠️ Falha ao processar ${arquivo}:`, err.message);
            let destinoErro = '';
            try {
                const nomeCurto = path.parse(arquivo).name.slice(0, 40);
                destinoErro = path.join(alvo.diretorioErros, `${nomeCurto}_ERRO_${Date.now()}`);
                fs.copyFileSync(caminhoOrigem, destinoErro);
                fs.unlinkSync(caminhoOrigem);
            }
            catch (_) { }
            // Registra o log de erro no sistema
            await registrarPedidoProcessado(alvo, codigoPedido, pacienteNome, arquivo, destinoErro, '', 'ERRO', err.message);
        }
    }
}
// Loop contínuo de monitoramento
let isExecutandoVarredura = false;
async function executarCiclo() {
    if (isExecutandoVarredura)
        return;
    isExecutandoVarredura = true;
    try {
        await enviarHeartbeat();
        const alvos = await carregarAlvosMonitoramento();
        if (alvos.length > 0) {
            for (const alvo of alvos) {
                await processarPasta(alvo);
            }
        }
    }
    catch (err) {
        console.error('[Agente] Erro no ciclo de varredura:', err.message);
    }
    finally {
        isExecutandoVarredura = false;
    }
}
// Inicia imediatamente e roda a cada 4 segundos
executarCiclo();
setInterval(executarCiclo, 4000);
