import { NextResponse } from 'next/server';
import { supabase } from '../../../db/supabase';

export const dynamic = 'force-dynamic';

function extrairToken(request: Request): string | null {
  const url = new URL(request.url);
  const tokenQuery = url.searchParams.get('token');
  if (tokenQuery) return tokenQuery.trim();

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const customHeader = request.headers.get('x-agent-token');
  if (customHeader) return customHeader.trim();

  return null;
}

async function buscarTenantPorToken(token: string) {
  if (!token || token.length < 8) return null;

  try {
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, nome, configuracoes, ativo')
      .eq('ativo', true);

    if (error || !tenants) {
      console.error('[Agent API] Erro ao buscar tenants no Supabase:', error);
      return null;
    }

    const tenant = tenants.find(t => {
      const cfgToken = t.configuracoes?.api_token;
      return cfgToken && cfgToken.trim() === token.trim();
    });

    return tenant || null;
  } catch (err: any) {
    console.error('[Agent API] Falha na autenticação do token:', err);
    return null;
  }
}

// Atualiza o timestamp de heartbeat do agente no tenant
async function atualizarHeartbeatTenant(tenantId: string, configuracoesAtuais: any) {
  try {
    const novasConfigs = {
      ...(configuracoesAtuais || {}),
      ultimo_heartbeat_agente: new Date().toISOString()
    };
    await supabase
      .from('tenants')
      .update({ configuracoes: novasConfigs })
      .eq('id', tenantId);
  } catch (_) {}
}

// GET: Retorna as pastas e configurações de monitoramento para o agente autenticado
export async function GET(request: Request) {
  const token = extrairToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, erro: 'Token de autenticação do agente não fornecido. Envie via header x-agent-token ou query ?token=' },
      { status: 401 }
    );
  }

  const tenant = await buscarTenantPorToken(token);
  if (!tenant) {
    return NextResponse.json(
      { ok: false, erro: 'Token de agente inválido ou laboratório inativo.' },
      { status: 401 }
    );
  }

  // Registra heartbeat
  atualizarHeartbeatTenant(tenant.id, tenant.configuracoes);

  const alvos: Array<{
    modeloEquipamento: string;
    diretorioEntrada: string;
    diretorioProcessados: string;
    diretorioErros: string;
    diretorioCarga: string;
  }> = [];

  const equipPastas = tenant.configuracoes?.equipamentos_pastas || {};
  for (const [modelo, cfg] of Object.entries<any>(equipPastas)) {
    if (cfg.diretorio_entrada && cfg.monitor_ativo !== false) {
      alvos.push({
        modeloEquipamento: modelo,
        diretorioEntrada: cfg.diretorio_entrada,
        diretorioProcessados: cfg.diretorio_processados || `${cfg.diretorio_entrada}/Processados`,
        diretorioErros: cfg.diretorio_erros || `${cfg.diretorio_entrada}/Erros`,
        diretorioCarga: cfg.diretorio_carga || `C:\\MidwayLab/Equipamentos/${modelo}/Carga`
      });
    }
  }

  // Fallback caso ainda use o formato de ingestao_pastas único
  if (alvos.length === 0 && tenant.configuracoes?.ingestao_pastas?.diretorio_entrada) {
    const ing = tenant.configuracoes.ingestao_pastas;
    const modelo = ing.equipamento_destino || 'EQUIPAMENTO_PADRAO';
    alvos.push({
      modeloEquipamento: modelo,
      diretorioEntrada: ing.diretorio_entrada,
      diretorioProcessados: ing.diretorio_processados || `${ing.diretorio_entrada}/Processados`,
      diretorioErros: ing.diretorio_erros || `${ing.diretorio_entrada}/Erros`,
      diretorioCarga: `C:\\MidwayLab/Equipamentos/${modelo}/Carga`
    });
  }

  return NextResponse.json({
    ok: true,
    tenant: {
      id: tenant.id,
      nome: tenant.nome
    },
    alvos
  });
}

// POST: Registra um pedido processado pelo agente no Supabase de forma segura
export async function POST(request: Request) {
  const token = extrairToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, erro: 'Token de autenticação do agente não fornecido.' },
      { status: 401 }
    );
  }

  const tenant = await buscarTenantPorToken(token);
  if (!tenant) {
    return NextResponse.json(
      { ok: false, erro: 'Token de agente inválido ou laboratório inativo.' },
      { status: 401 }
    );
  }

  // Atualiza heartbeat do robô
  atualizarHeartbeatTenant(tenant.id, tenant.configuracoes);

  try {
    const body = await request.json();

    // Heartbeat dedicado
    if (body.acao === 'heartbeat') {
      return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
    }

    const {
      codigoPedido,
      pacienteNome,
      modeloEquipamento,
      arquivoNome,
      arquivoCarga,
      arquivoProcessado,
      origemArquivo,
      status,
      mensagemErro,
      etapas
    } = body;

    if (!codigoPedido) {
      return NextResponse.json(
        { ok: false, erro: 'Campo codigoPedido é obrigatório.' },
        { status: 400 }
      );
    }

    const protocoloUnico = `${codigoPedido}_${Date.now().toString().slice(-4)}`;
    const statusFinal = status === 'ERRO' ? 'ERRO' : 'PROCESSADO';

    const payloadInsert = {
      tenant_id: tenant.id,
      local_autolac: 'LABFACIL',
      codigo_lote_autolac: `LOTE-${modeloEquipamento || 'GERAL'}`,
      protocolo_autolac: protocoloUnico,
      numero_solicitacao: String(codigoPedido),
      paciente_nome: pacienteNome || 'PACIENTE IMPORTADO',
      codigo_pedido_labfacil: String(codigoPedido),
      origem_arquivo: origemArquivo || (String(arquivoNome).toLowerCase().endsWith('.json') ? 'LABFACIL_JSON' : 'LABFACIL_XML'),
      arquivo_nome: arquivoNome || 'arquivo_desconhecido',
      status: statusFinal,
      mensagem_erro: mensagemErro || null,
      payload_labfacil_json: JSON.stringify({
        modelo_equipamento: modeloEquipamento || 'GERAL',
        arquivo_origem: arquivoNome,
        arquivo_carga: arquivoCarga || '',
        arquivo_processado: arquivoProcessado || '',
        processado_em: new Date().toISOString(),
        origem: 'MIDWAY_SECURE_AGENT',
        status: statusFinal,
        erro: mensagemErro || null,
        etapas: etapas || [
          {
            etapa: 'ENTRADA',
            titulo: '1. Arquivo na Pasta Entrada',
            descricao: `Arquivo lido: ${arquivoNome}`,
            status: 'CONCLUIDO',
            timestamp: new Date().toISOString()
          },
          {
            etapa: 'LEITURA',
            titulo: '2. Identificação da Amostra',
            descricao: `Paciente: ${pacienteNome || 'Importado'} • Pedido: ${codigoPedido}`,
            status: 'CONCLUIDO',
            timestamp: new Date().toISOString()
          },
          {
            etapa: 'CONVERSAO',
            titulo: '3. Conversão de Layout',
            descricao: `Layout convertido para ${modeloEquipamento || 'Equipamento'}`,
            status: statusFinal === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
            timestamp: new Date().toISOString()
          },
          {
            etapa: 'CARGA',
            titulo: '4. Worklist Gravada no Analisador',
            descricao: arquivoCarga ? `Carga salva em ${arquivoCarga}` : 'Worklist gerada',
            status: statusFinal === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
            timestamp: new Date().toISOString()
          },
          {
            etapa: 'ARQUIVAMENTO',
            titulo: '5. Arquivamento Seguro',
            descricao: arquivoProcessado ? `Movido para ${arquivoProcessado}` : 'Arquivo arquivado',
            status: 'CONCLUIDO',
            timestamp: new Date().toISOString()
          },
          {
            etapa: 'NUVEM',
            titulo: '6. Confirmação no MidwayLab',
            descricao: statusFinal === 'ERRO' ? `Erro: ${mensagemErro}` : `Protocolo ${protocoloUnico} sincronizado`,
            status: statusFinal === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
            timestamp: new Date().toISOString()
          }
        ]
      })
    };

    const { data, error } = await supabase
      .from('pedidos')
      .insert([payloadInsert])
      .select('id')
      .single();

    if (error) {
      console.error('[Agent API] Erro ao inserir pedido no Supabase:', error);
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pedidoId: data?.id,
      protocolo: protocoloUnico,
      status: statusFinal,
      mensagem: `Pedido ${codigoPedido} registrado com sucesso!`
    });
  } catch (err: any) {
    console.error('[Agent API] Falha ao processar requisição do agente:', err);
    return NextResponse.json(
      { ok: false, erro: err?.message || 'Falha interna ao processar pedido.' },
      { status: 500 }
    );
  }
}
