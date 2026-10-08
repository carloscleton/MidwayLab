import { supabase, IDeparaExameRecord, ICatalogoSoftlabRecord, ICatalogoAutolacRecord } from '../db/supabase';
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

  /**
   * Remove/Apaga um mapeamento DE-PARA do Supabase
   */
  static async removerMapeamento(tenantId: string, codigoSoftlab: string): Promise<void> {
    try {
      await supabaseBrowser
        .from('depara_exames')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('codigo_softlab', codigoSoftlab);
    } catch (e) {
      console.error('[DeparaService] Erro ao remover mapeamento:', e);
    }
  }

  /**
   * Cadastra ou atualiza uma lista de mapeamentos DE-PARA em Lote no Supabase
   */
  static async salvarMapeamentoEmLote(records: IDeparaExameRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    const { error } = await supabaseBrowser.from('depara_exames').upsert(records, {
      onConflict: 'tenant_id,codigo_autolac',
    });

    if (error) {
      console.error('[DeparaService] Erro ao salvar mapeamentos em lote:', error);
      throw error;
    }
  }

  /**
   * Busca o Catálogo de Exames do Softlab salvo no banco Supabase (Cache de Catálogo)
   * Usa paginação para superar o limite padrão de 1000 linhas do Supabase
  /**
   * Busca o Catálogo de Exames do Softlab salvo no banco Supabase (Cache de Catálogo por Tenant/Global)
   */
  static async listarCatalogoSoftlab(tenantId?: string): Promise<ICatalogoSoftlabRecord[]> {
    try {
      const PAGE_SIZE = 1000;
      let allData: ICatalogoSoftlabRecord[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabaseBrowser
          .from('catalogo_softlab_exames')
          .select('*');

        if (tenantId) {
          query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
        }

        const { data, error } = await query
          .order('descricao', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error || !data) break;
        allData = [...allData, ...(data as ICatalogoSoftlabRecord[])];
        hasMore = data.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      return allData;
    } catch (e) {
      console.error('[DeparaService] Erro ao listar catálogo Softlab:', e);
      return [];
    }
  }


  /**
   * Limpa integralmente a tabela de Catálogo do Softlab no Supabase
   */
  static async limparCatalogoSoftlab(tenantId?: string): Promise<void> {
    try {
      let query = supabaseBrowser.from('catalogo_softlab_exames').delete();
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      await query;
    } catch (e) {
      console.error('[DeparaService] Erro ao limpar catálogo Softlab:', e);
    }
  }

  /**
   * Limpa exames antigos/fakes duplicados e cadastra a lista limpa e oficial do Softlab no Supabase
   */
  static async limparECadastrarLimpoSoftlab(records: ICatalogoSoftlabRecord[], tenantId?: string): Promise<void> {
    await this.limparCatalogoSoftlab(tenantId);
    await this.salvarCatalogoSoftlab(records, tenantId);
  }

  /**
   * Salva ou atualiza a tabela de Catálogo de Exames do Softlab no Supabase em lotes fracionados
   */
  static async salvarCatalogoSoftlab(records: ICatalogoSoftlabRecord[], tenantId?: string): Promise<void> {
    if (!records || records.length === 0) return;
    const recordsWithTenant = records.map(r => ({
      ...r,
      ...(tenantId ? { tenant_id: tenantId } : {})
    }));

    const CHUNK_SIZE = 100;
    for (let i = 0; i < recordsWithTenant.length; i += CHUNK_SIZE) {
      const chunk = recordsWithTenant.slice(i, i + CHUNK_SIZE);
      const { error } = await supabaseBrowser
        .from('catalogo_softlab_exames')
        .upsert(chunk);

      if (error) {
        console.error(`[DeparaService] Erro ao salvar lote de exames Softlab (${i}..${i + chunk.length}):`, error);
      }
    }
  }

  /**
   * Busca o Catálogo de Exames do Autolac salvo no banco Supabase (Cache de Catálogo por Tenant/Global)
   */
  static async listarCatalogoAutolac(tenantId?: string): Promise<ICatalogoAutolacRecord[]> {
    try {
      let query = supabaseBrowser
        .from('catalogo_autolac_exames')
        .select('*');

      if (tenantId) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }

      const { data, error } = await query.order('nome', { ascending: true });

      if (error || !data) return [];
      return data as ICatalogoAutolacRecord[];
    } catch (e) {
      console.error('[DeparaService] Erro ao listar catálogo Autolac:', e);
      return [];
    }
  }

  /**
   * Salva ou atualiza o Catálogo de Exames do Autolac no Supabase em lotes fracionados
   */
  static async salvarCatalogoAutolac(records: ICatalogoAutolacRecord[], tenantId?: string): Promise<void> {
    if (!records || records.length === 0) return;
    const recordsWithTenant = records.map(r => ({
      ...r,
      ...(tenantId ? { tenant_id: tenantId } : {})
    }));

    const CHUNK_SIZE = 100;
    for (let i = 0; i < recordsWithTenant.length; i += CHUNK_SIZE) {
      const chunk = recordsWithTenant.slice(i, i + CHUNK_SIZE);
      const { error } = await supabaseBrowser
        .from('catalogo_autolac_exames')
        .upsert(chunk);

      if (error) {
        console.error(`[DeparaService] Erro ao salvar lote de exames Autolac (${i}..${i + chunk.length}):`, error);
      }
    }
  }
}
