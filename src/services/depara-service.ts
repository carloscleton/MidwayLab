import { supabase, IDeparaExameRecord } from '../db/supabase';
import { supabaseBrowser } from '../lib/supabase-client';

export class DeparaService {
  /**
   * Traduz o código de exame do Autolac para o código do Softlab no banco Supabase
   */
  static async resolveExame(tenantId: string, codigoAutolac: string): Promise<{ codigoSoftlab: string; tipoResultado: string }> {
    const { data, error } = await supabase
      .from('depara_exames')
      .select('codigo_softlab, tipo_resultado')
      .eq('tenant_id', tenantId)
      .eq('codigo_autolac', codigoAutolac)
      .single();

    if (error || !data) {
      console.warn(`[DeparaService] Exame '${codigoAutolac}' não mapeado para tenant ${tenantId}. Usando fallback.`);
      return {
        codigoSoftlab: codigoAutolac, // Fallback se não mapeado
        tipoResultado: 'PDF',
      };
    }

    return {
      codigoSoftlab: data.codigo_softlab,
      tipoResultado: data.tipo_resultado || 'PDF',
    };
  }

  /**
   * Lista todos os mapeamentos DE-PARA de um determinado tenant no Supabase
   */
  static async listarMapeamentos(tenantId?: string): Promise<IDeparaExameRecord[]> {
    try {
      let query = supabaseBrowser.from('depara_exames').select('*');
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as IDeparaExameRecord[];
    } catch (e) {
      console.error('[DeparaService] Erro ao listar mapeamentos:', e);
      return [];
    }
  }

  /**
   * Traduz o código de exame do Softlab de volta para o código do Autolac
   */
  static async resolveExameInverso(tenantId: string, codigoSoftlab: string): Promise<string> {
    const { data, error } = await supabase
      .from('depara_exames')
      .select('codigo_autolac')
      .eq('tenant_id', tenantId)
      .eq('codigo_softlab', codigoSoftlab)
      .single();

    if (error || !data) {
      return codigoSoftlab;
    }

    return data.codigo_autolac;
  }

  /**
   * Cadastra ou atualiza um mapeamento DE-PARA
   */
  static async salvarMapeamento(record: IDeparaExameRecord): Promise<void> {
    const { error } = await supabaseBrowser.from('depara_exames').upsert(record, {
      onConflict: 'tenant_id,codigo_autolac',
    });

    if (error) {
      console.error('[DeparaService] Erro ao salvar mapeamento:', error);
      throw error;
    }
  }
}
