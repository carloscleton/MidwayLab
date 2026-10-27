const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_URL = 'http://localhost:3000';
const VALID_TOKEN = 'mw_agt_a1a07164394741e3b07d7c743394e590_1f7847031235'; // LABORATORIO CIAMOLAB

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 TESTE 100% REAL: AGENTE EM MODO SEGURO COM API TOKEN');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. TESTE DE BLOQUEIO SEM TOKEN
  try {
    process.stdout.write('[1/6] Bloqueio sem token na API... ');
    await axios.get(`${API_URL}/api/agent`);
    console.log('❌ FALHOU');
    failed++;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ OK (401 Unauthorized)');
      passed++;
    } else {
      console.log('❌ FALHOU:', err.message);
      failed++;
    }
  }

  // 2. TESTE DE BLOQUEIO COM TOKEN FALSO
  try {
    process.stdout.write('[2/6] Bloqueio com token inválido... ');
    await axios.get(`${API_URL}/api/agent`, {
      headers: { 'x-agent-token': 'mw_agt_falso_12345' }
    });
    console.log('❌ FALHOU');
    failed++;
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ OK (401 Unauthorized)');
      passed++;
    } else {
      console.log('❌ FALHOU:', err.message);
      failed++;
    }
  }

  // 3. CONSULTA SEGURA DE PASTAS VIA API
  try {
    process.stdout.write('[3/6] Obter pastas monitoradas do laboratório... ');
    const res = await axios.get(`${API_URL}/api/agent`, {
      headers: { 'x-agent-token': VALID_TOKEN }
    });
    if (res.status === 200 && res.data.ok && res.data.alvos?.length > 0) {
      console.log(`✅ OK (${res.data.tenant.nome} - ${res.data.alvos.length} pasta(s))`);
      passed++;
    } else {
      console.log('❌ FALHOU:', res.data);
      failed++;
    }
  } catch (err) {
    console.log('❌ FALHOU:', err.response?.data || err.message);
    failed++;
  }

  // 4. PREPARAR ARQUIVO REAL DE TESTE NA PASTA ENTRADA
  const dirEntrada = 'C:\\MidwayLab\\Labfacil\\SYSMEX_UF_1500\\Entrada';
  const dirProcessados = 'C:\\MidwayLab\\Labfacil\\SYSMEX_UF_1500\\Processados';
  if (!fs.existsSync(dirEntrada)) fs.mkdirSync(dirEntrada, { recursive: true });
  if (!fs.existsSync(dirProcessados)) fs.mkdirSync(dirProcessados, { recursive: true });

  const numPedido = `PED-E2E-${Date.now().toString().slice(-4)}`;
  const nomeArquivo = `amostra_${numPedido}.json`;
  const caminhoArquivo = path.join(dirEntrada, nomeArquivo);

  const conteudoPedido = {
    numeroPedido: numPedido,
    paciente: 'CARLOS CLETON (TESTE AGENTE 100%)',
    data: new Date().toISOString(),
    exames: ['URINA', 'SEDIMENTO', 'UROCULTURA']
  };

  fs.writeFileSync(caminhoArquivo, JSON.stringify(conteudoPedido, null, 2), 'utf8');
  console.log(`[4/6] Arquivo de teste depositado em Entrada: ${nomeArquivo} ✅ OK`);
  passed++;

  // 5. EXECUTAR O ROBÔ REAL (dist-agent/agent-service.js) COM VARIÁVEIS DE PRODUÇÃO DO CLIENTE
  console.log('[5/6] Disparando o robô real dist-agent/agent-service.js...');
  
  const envCliente = {
    ...process.env,
    MIDWAY_API_URL: API_URL,
    MIDWAY_AGENT_TOKEN: VALID_TOKEN,
    // Garante que NENHUMA chave do supabase exista no processo do agente
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: ''
  };

  const agentProc = spawn('node', ['dist-agent/agent-service.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: envCliente
  });

  let agentOutput = '';
  agentProc.stdout.on('data', (d) => {
    agentOutput += d.toString();
  });
  agentProc.stderr.on('data', (d) => {
    agentOutput += d.toString();
  });

  // Aguarda 8 segundos para o robô fazer a varredura e enviar o pedido
  await new Promise((r) => setTimeout(r, 8000));
  agentProc.kill();

  console.log('\n--- LOGS DO ROBÔ EM TEMPO REAL ---');
  console.log(agentOutput.trim());
  console.log('-----------------------------------\n');

  const arquivoSaiuDeEntrada = !fs.existsSync(caminhoArquivo);
  const arquivoChegouEmProcessados = fs.existsSync(path.join(dirProcessados, nomeArquivo)) ||
    fs.readdirSync(dirProcessados).some(f => f.includes(numPedido));

  if (arquivoSaiuDeEntrada && arquivoChegouEmProcessados) {
    console.log('✅ OK: Robô leu o arquivo, processou e moveu para Processados!');
    passed++;
  } else {
    console.log(`❌ FALHOU: Arquivo ainda na entrada (${arquivoSaiuDeEntrada}) ou não está em processados (${arquivoChegouEmProcessados})`);
    failed++;
  }

  // 6. VERIFICAR SE O PEDIDO ESTÁ REGISTRADO NO BANCO SUPABASE
  try {
    process.stdout.write('[6/6] Verificando pedido persistido no Supabase... ');
    const { data: pedidoDb, error } = await supabase
      .from('pedidos')
      .select('id, numero_solicitacao, paciente_nome, status, local_autolac, created_at')
      .eq('numero_solicitacao', numPedido)
      .single();

    if (error || !pedidoDb) {
      console.log('❌ FALHOU: Pedido não encontrado no banco de dados', error?.message);
      failed++;
    } else {
      console.log(`✅ SUCESSO TOTAL!`);
      console.log(`   -> Pedido ID: ${pedidoDb.id}`);
      console.log(`   -> Solicitação: ${pedidoDb.numero_solicitacao}`);
      console.log(`   -> Paciente: ${pedidoDb.paciente_nome}`);
      console.log(`   -> Status: ${pedidoDb.status}`);
      passed++;
    }
  } catch (err) {
    console.log('❌ FALHOU:', err.message);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} PASSARAM | ${failed} FALHARAM`);
  if (failed === 0) {
    console.log('🎉 O ROBÔ ESTÁ FUNCIONANDO 100% NO MODO SEGURO SEM SUPABASE NO CLIENTE!');
  } else {
    console.log('⚠️ Algum teste falhou.');
  }
  console.log('===============================================================\n');
}

runTests();
