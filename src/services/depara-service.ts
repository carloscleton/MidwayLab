import { supabase, IDeparaExameRecord } from '../db/supabase';

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
    const { error } = await supabase.from('depara_exames').upsert(record, {
      onConflict: 'tenant_id,codigo_autolac',
    });

    if (error) {
      console.error('[DeparaService] Erro ao salvar mapeamento:', error);
      throw error;
    }
  }
}
