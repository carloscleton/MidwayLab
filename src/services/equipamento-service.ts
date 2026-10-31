import { supabase, IEquipamentoRecord } from '../db/supabase';
import { supabaseBrowser } from '../lib/supabase-client';

export class EquipamentoService {
  /**
   * Lista todos os equipamentos cadastrados para um determinado Tenant
   */
  static async listarEquipamentos(tenantId?: string): Promise<IEquipamentoRecord[]> {
    try {
      let query = supabaseBrowser.from('equipamentos').select('*');
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      const { data, error } = await query.order('nome', { ascending: true });

      if (error || !data) {
        console.warn('[EquipamentoService] Aviso ao buscar do Supabase, retornando fallback local ou vazio:', error?.message);
        return [];
      }
      return data.map((item: any) => {
        let formato = item.formato_arquivo;
        if (!formato && item.codigo_identificador && item.codigo_identificador.includes("FORMAT:")) {
          formato = item.codigo_identificador.split("FORMAT:")[1].trim();
        }
        if (!formato) {
          formato = item.modelo === "CB350" ? "JSON" : (item.modelo === "YUMIZEN" || item.modelo === "ACCESS") ? "ASTM" : "HL7";
        }
        const cfg = item.configuracoes || {};
        const usarSegundaPorta = item.usar_segunda_porta !== undefined
          ? Boolean(item.usar_segunda_porta)
          : (cfg.usar_segunda_porta !== undefined
              ? Boolean(cfg.usar_segunda_porta)
              : Boolean(item.porta_resultados || cfg.porta_resultados));

        const portaResultados = usarSegundaPorta
          ? (item.porta_resultados ?? cfg.porta_resultados ?? 7102)
          : null;

        return {
          ...item,
          formato_arquivo: formato,
          ip_host: item.ip_host || cfg.ip_host || '',
          porta: item.porta ?? cfg.porta ?? null,
          porta_resultados: portaResultados,
          usar_segunda_porta: usarSegundaPorta,
          modo_operacao: item.modo_operacao || cfg.modo_operacao || 'QUERY',
          timeout_conexao: item.timeout_conexao ?? cfg.timeout_conexao ?? 15,
          diretorio_carga: item.diretorio_carga || cfg.diretorio_carga || 'C:\\MidwayLab\\Equipamentos\\' + (item.modelo || 'MODELO') + '\\Carga',
          diretorio_resultados: item.diretorio_resultados || cfg.diretorio_resultados || 'C:\\MidwayLab\\Equipamentos\\' + (item.modelo || 'MODELO') + '\\Resultados',
          configuracoes: cfg
        };
      }) as IEquipamentoRecord[];
    } catch (e: any) {
      console.error('[EquipamentoService] Erro ao listar equipamentos:', e);
      return [];
    }
  }

  /**
   * Cadastra ou atualiza um equipamento por empresa (Tenant)
   */
  static async salvarEquipamento(equipamento: Partial<IEquipamentoRecord>): Promise<IEquipamentoRecord | null> {
    try {
      // Monta configurações dinâmicas no formato JSONB e preenche colunas explícitas
      const usarSegundaPorta = equipamento.usar_segunda_porta !== undefined
        ? Boolean(equipamento.usar_segunda_porta)
        : (equipamento.configuracoes?.usar_segunda_porta !== undefined
            ? Boolean(equipamento.configuracoes?.usar_segunda_porta)
            : Boolean(equipamento.porta_resultados || equipamento.configuracoes?.porta_resultados));

      const portaResultadosFinal = usarSegundaPorta
        ? (equipamento.porta_resultados ?? equipamento.configuracoes?.porta_resultados ?? 7102)
        : null;

      const configuracoesJsonb: any = {
        ...(equipamento.configuracoes || {}),
        ip_host: equipamento.ip_host || equipamento.configuracoes?.ip_host || '',
        porta: equipamento.porta ?? equipamento.configuracoes?.porta ?? null,
        porta_resultados: portaResultadosFinal,
        usar_segunda_porta: usarSegundaPorta,
        modo_operacao: equipamento.modo_operacao || equipamento.configuracoes?.modo_operacao || 'QUERY',
        timeout_conexao: equipamento.timeout_conexao ?? equipamento.configuracoes?.timeout_conexao ?? 15,
        diretorio_carga: equipamento.diretorio_carga || equipamento.configuracoes?.diretorio_carga || 'C:\\MidwayLab\\Equipamentos\\' + (equipamento.modelo || 'MODELO') + '\\Carga',
        diretorio_resultados: equipamento.diretorio_resultados || equipamento.configuracoes?.diretorio_resultados || 'C:\\MidwayLab\\Equipamentos\\' + (equipamento.modelo || 'MODELO') + '\\Resultados',
      };

      const payload: any = {
        tenant_id: equipamento.tenant_id,
        nome: equipamento.nome,
        modelo: equipamento.modelo || 'CB350',
        codigo_identificador: String((equipamento.codigo_identificador || equipamento.nome || "").replace(/\|FORMAT:[^|]+/g, "")) + "|FORMAT:" + (equipamento.formato_arquivo || "JSON"),
        formato_arquivo: equipamento.formato_arquivo || "JSON",
        fabricante: equipamento.fabricante || (equipamento.modelo?.includes('YUMIZEN') ? 'Horiba' : 'Cormay'),
        tipo_comunicacao: equipamento.tipo_comunicacao || 'ARQUIVO_COMPARTILHADO',
        ip_host: configuracoesJsonb.ip_host,
        porta: configuracoesJsonb.porta,
        porta_resultados: configuracoesJsonb.porta_resultados,
        usar_segunda_porta: configuracoesJsonb.usar_segunda_porta,
        modo_operacao: configuracoesJsonb.modo_operacao,
        timeout_conexao: configuracoesJsonb.timeout_conexao,
        diretorio_carga: configuracoesJsonb.diretorio_carga,
        diretorio_resultados: configuracoesJsonb.diretorio_resultados,
        configuracoes: configuracoesJsonb,
        ativo: equipamento.ativo !== undefined ? equipamento.ativo : true,
      };

      if (equipamento.id && equipamento.id.length > 20) {
        payload.id = equipamento.id;
      }

      // Salva no banco de dados com tratamento resiliente caso as colunas novas ainda nao existam
      let { data, error } = await supabaseBrowser
        .from('equipamentos')
        .upsert(payload)
        .select('*')
        .single();

      if (error && error.message && (error.message.includes('modo_operacao') || error.message.includes('porta_resultados') || error.message.includes('usar_segunda_porta') || error.message.includes('timeout_conexao'))) {
        console.warn('[EquipamentoService] Salvando campos essenciais enquanto as colunas novas sao criadas no Supabase.');
        const fallbackPayload = { ...payload };
        delete fallbackPayload.modo_operacao;
        delete fallbackPayload.porta_resultados;
        delete fallbackPayload.usar_segunda_porta;
        delete fallbackPayload.timeout_conexao;
        const retry = await supabaseBrowser.from('equipamentos').upsert(fallbackPayload).select('*').single();
        if (!retry.error && retry.data) {
          data = { ...retry.data, modo_operacao: payload.modo_operacao, porta_resultados: payload.porta_resultados, usar_segunda_porta: payload.usar_segunda_porta, timeout_conexao: payload.timeout_conexao };
          error = null;
        }
      }

      if (error) {
        console.warn('[EquipamentoService] Erro no Supabase upsert:', error.message);
        // Retorna o objeto gerado com id sintético caso a tabela ainda não tenha sido criada no Supabase remoto
        return {
          id: equipamento.id || `eq-${Date.now()}`,
          ...payload,
        } as IEquipamentoRecord;
      }

      let formato = (data as any).formato_arquivo;
      if (!formato && data.codigo_identificador && data.codigo_identificador.includes("FORMAT:")) {
        formato = data.codigo_identificador.split("FORMAT:")[1].trim();
      }
      return {
        ...data,
        formato_arquivo: formato || "JSON"
      } as IEquipamentoRecord;
    } catch (err: any) {
      console.error('[EquipamentoService] Falha ao salvar equipamento:', err);
      return null;
    }
  }

  /**
   * Remove um equipamento do sistema
   */
  static async removerEquipamento(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseBrowser
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[EquipamentoService] Erro ao deletar no Supabase:', error.message);
      }
      return true;
    } catch (err) {
      console.error('[EquipamentoService] Erro ao remover equipamento:', err);
      return false;
    }
  }
}
