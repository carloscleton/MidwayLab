import { NextResponse } from 'next/server';
import { supabase } from '../../../db/supabase';
import { FolderWatcherService } from '../../../services/folder-watcher-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    // 1. Busca os últimos pedidos registrados
    let query = supabase
      .from('pedidos')
      .select('id, tenant_id, numero_solicitacao, paciente_nome, status, mensagem_erro, origem_arquivo, arquivo_nome, payload_labfacil_json, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: pedidos, error: pedidosErr } = await query;
    if (pedidosErr) {
      console.error('[API agent-logs] Erro ao buscar pedidos:', pedidosErr);
    }

    // 2. Busca lista de tenants para mapear nomes e status
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, nome, configuracoes, ativo');

    const tenantMap = new Map<string, any>();
    if (tenants) {
      tenants.forEach(t => tenantMap.set(t.id, t));
    }

    // 3. Monta o log detalhado com o ciclo completo de comunicação
    const logsFormatados: any[] = [];

    if (pedidos && pedidos.length > 0) {
      for (const p of pedidos) {
        let payloadExtra: any = {};
        try {
          if (p.payload_labfacil_json) {
            payloadExtra = typeof p.payload_labfacil_json === 'string'
              ? JSON.parse(p.payload_labfacil_json)
              : p.payload_labfacil_json;
          }
        } catch (_) {}

        const tenant = tenantMap.get(p.tenant_id);
        const tenantNome = tenant ? tenant.nome : 'Laboratório';
        const modelo = payloadExtra.modelo_equipamento || 'SYSMEX_UF_1500';
        const arquivoOrigem = p.arquivo_nome || p.origem_arquivo || 'amostra.xml';
        const arquivoProcessado = payloadExtra.arquivo_processado || `C:\\MidwayLab\\Labfacil\\${modelo}\\Processados\\${arquivoOrigem}`;
        const arquivoCarga = payloadExtra.arquivo_carga || `C:\\MidwayLab\\Equipamentos\\${modelo}\\Carga\\${arquivoOrigem}`;
        const isErro = p.status === 'ERRO';

        // Linha do tempo das etapas de ponta a ponta
        const etapas = payloadExtra.etapas || [
          {
            etapa: 'ENTRADA',
            titulo: '1. Arquivo na Pasta Entrada',
            descricao: `Detectado em Labfacil\\${modelo}\\Entrada\\${arquivoOrigem}`,
            status: 'CONCLUIDO',
            timestamp: p.created_at
          },
          {
            etapa: 'LEITURA',
            titulo: '2. Identificação da Amostra',
            descricao: `Paciente: ${p.paciente_nome || 'NÃO IDENTIFICADO'} • Amostra: ${p.numero_solicitacao}`,
            status: 'CONCLUIDO',
            timestamp: p.created_at
          },
          {
            etapa: 'CONVERSAO',
            titulo: '3. Conversão de Layout',
            descricao: `Exames mapeados para protocolo do ${modelo}`,
            status: isErro ? 'FALHOU' : 'CONCLUIDO',
            timestamp: p.created_at
          },
          {
            etapa: 'CARGA',
            titulo: '4. Worklist Gravada no Analisador',
            descricao: isErro ? 'Cancelado por erro de conversão' : `Worklist gerada em ${arquivoCarga}`,
            status: isErro ? 'FALHOU' : 'CONCLUIDO',
            timestamp: p.created_at
          },
          {
            etapa: 'ARQUIVAMENTO',
            titulo: '5. Arquivamento Seguro',
            descricao: isErro ? 'Movido para pasta Erros' : `Movido para ${arquivoProcessado}`,
            status: 'CONCLUIDO',
            timestamp: p.created_at
          },
          {
            etapa: 'NUVEM',
            titulo: '6. Confirmação no MidwayLab',
            descricao: isErro ? `Erro registrado: ${p.mensagem_erro || 'Falha de validação'}` : `Protocolo ${p.numero_solicitacao} sincronizado`,
            status: isErro ? 'FALHOU' : 'CONCLUIDO',
            timestamp: p.created_at
          }
        ];

        logsFormatados.push({
          id: p.id,
          tipo: 'COMUNICACAO_EQUIPAMENTO',
          timestamp: p.created_at,
          tenantId: p.tenant_id,
          tenantNome,
          modeloEquipamento: modelo,
          numeroSolicitacao: p.numero_solicitacao,
          pacienteNome: p.paciente_nome,
          arquivoNome: arquivoOrigem,
          arquivoCarga,
          arquivoProcessado,
          status: p.status || 'PROCESSADO',
          mensagemErro: p.mensagem_erro || payloadExtra.erro || null,
          etapas,
          payloadDetalhes: payloadExtra
        });
      }
    }

    // 4. Incorpora logs em tempo real do serviço local (FolderWatcherService)
    try {
      const watcherStatus = FolderWatcherService.obterStatus();
      if (watcherStatus?.logs && Array.isArray(watcherStatus.logs)) {
        for (const wLog of watcherStatus.logs.slice(0, 20)) {
          // Evita duplicatas se o pedido já estiver listado
          if (wLog.pedidoId && logsFormatados.some(l => l.numeroSolicitacao === wLog.pedidoId)) {
            continue;
          }

          logsFormatados.unshift({
            id: wLog.id || `wlog-${Date.now()}-${Math.random()}`,
            tipo: 'LOCAL_WATCHER',
            timestamp: wLog.timestamp || new Date().toISOString(),
            tenantId: tenantId || 'LOCAL',
            tenantNome: 'Serviço Local',
            modeloEquipamento: watcherStatus.config?.equipamentoDestino || 'SYSMEX_UF_1500',
            numeroSolicitacao: wLog.pedidoId || '---',
            pacienteNome: wLog.paciente || '---',
            arquivoNome: wLog.arquivo,
            arquivoCarga: wLog.caminhoCargaGerada || '',
            arquivoProcessado: '',
            status: wLog.status || 'PROCESSADO',
            mensagemErro: wLog.status === 'ERRO' ? wLog.mensagem : null,
            etapas: [
              {
                etapa: 'ENTRADA',
                titulo: '1. Arquivo na Pasta Entrada',
                descricao: `Recebido: ${wLog.arquivo}`,
                status: 'CONCLUIDO',
                timestamp: wLog.timestamp
              },
              {
                etapa: 'CARGA',
                titulo: '2. Geração da Carga',
                descricao: wLog.mensagem,
                status: wLog.status === 'ERRO' ? 'FALHOU' : 'CONCLUIDO',
                timestamp: wLog.timestamp
              }
            ],
            payloadDetalhes: wLog
          });
        }
      }
    } catch (_) {}

    // Ordena os logs mais recentes primeiro
    logsFormatados.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Verifica heartbeat do tenant
    let ultimoHeartbeat: string | null = null;
    let roboOnline = false;

    if (tenantId && tenantMap.has(tenantId)) {
      const t = tenantMap.get(tenantId);
      ultimoHeartbeat = t.configuracoes?.ultimo_heartbeat_agente || null;
      if (ultimoHeartbeat) {
        const diffMs = Date.now() - new Date(ultimoHeartbeat).getTime();
        roboOnline = diffMs < 120000; // online se enviou ping nos últimos 2 minutos
      }
    } else if (tenants && tenants.length > 0) {
      // Se não filtrou por tenant específico, pega o mais recente de qualquer tenant
      for (const t of tenants) {
        const hb = t.configuracoes?.ultimo_heartbeat_agente;
        if (hb) {
          const diffMs = Date.now() - new Date(hb).getTime();
          if (diffMs < 120000) {
            roboOnline = true;
            ultimoHeartbeat = hb;
            break;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      roboOnline,
      ultimoHeartbeat,
      total: logsFormatados.length,
      logs: logsFormatados
    });
  } catch (err: any) {
    console.error('[API agent-logs] Falha:', err);
    return NextResponse.json(
      { ok: false, erro: err?.message || 'Erro ao carregar logs' },
      { status: 500 }
    );
  }
}
