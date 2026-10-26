import { supabase, IDeparaExameRecord, ICatalogoLabfacilRecord, ICatalogoAutolacRecord } from '../db/supabase';
import { supabaseBrowser } from '../lib/supabase-client';

export class DeparaService {
  /**
   * Traduz o código de exame do Labfacil para o código do Equipamento ou Autolac
   */
  static async resolveExame(
    tenantId: string,
    codigoOrigem: string,
    equipamentoId?: string
  ): Promise<{ codigoDestino: string; tipoResultado: string; codigoEquipamento?: string }> {
    try {
      let query = supabase
        .from('depara_exames')
        .select('*')
        .eq('tenant_id', tenantId);

      if (equipamentoId) {
        query = query.eq('equipamento_id', equipamentoId);
      }

      // Procura primeiro por codigo_labfacil ou codigo_autolac
      const { data, error } = await query
        .or(`codigo_labfacil.eq.${codigoOrigem},codigo_softlab.eq.${codigoOrigem},codigo_autolac.eq.${codigoOrigem}`)
        .maybeSingle();

      if (error || !data) {
        console.warn(`[DeparaService] Exame '${codigoOrigem}' não mapeado para tenant ${tenantId}. Usando código direto.`);
        return {
          codigoDestino: codigoOrigem,
          codigoEquipamento: codigoOrigem,
          tipoResultado: 'PADRAO',
        };
      }

      const codigoEq = data.codigo_equipamento || data.codigo_labfacil || data.codigo_softlab || codigoOrigem;
      return {
        codigoDestino: data.codigo_labfacil || data.codigo_softlab || codigoOrigem,
        codigoEquipamento: codigoEq,
        tipoResultado: data.tipo_resultado || 'PADRAO',
      };
    } catch (e) {
      return {
        codigoDestino: codigoOrigem,
        codigoEquipamento: codigoOrigem,
        tipoResultado: 'PADRAO',
      };
    }
  }

  /**
   * Lista todos os mapeamentos DE-PARA de um determinado tenant no Supabase
   */
  static async listarMapeamentos(tenantId?: string, equipamentoId?: string): Promise<IDeparaExameRecord[]> {
    try {
      let query = supabaseBrowser.from('depara_exames').select('*');
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (equipamentoId) {
        query = query.eq('equipamento_id', equipamentoId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) return [];
      
      // Normaliza campos para garantir que codigo_labfacil esteja preenchido
      return (data as any[]).map(item => ({
        ...item,
        codigo_labfacil: item.codigo_labfacil || item.codigo_softlab || '',
        descricao_labfacil: item.descricao_labfacil || item.descricao_softlab || '',
      })) as IDeparaExameRecord[];
    } catch (e) {
      console.error('[DeparaService] Erro ao listar mapeamentos:', e);
      return [];
    }
  }

  /**
   * Traduz o código de exame de volta para o código do Labfacil
   */
  static async resolveExameInverso(tenantId: string, codigoEquipamento: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('depara_exames')
        .select('codigo_labfacil, codigo_softlab')
        .eq('tenant_id', tenantId)
        .or(`codigo_equipamento.eq.${codigoEquipamento},codigo_labfacil.eq.${codigoEquipamento},codigo_softlab.eq.${codigoEquipamento}`)
        .maybeSingle();

      if (error || !data) {
        return codigoEquipamento;
      }

      return data.codigo_labfacil || data.codigo_softlab || codigoEquipamento;
    } catch (e) {
      return codigoEquipamento;
    }
  }

  /**
   * Cadastra ou atualiza um mapeamento DE-PARA garantindo equipamento_id preenchido
   */
  static async salvarMapeamento(record: IDeparaExameRecord): Promise<void> {
    let equipId = record.equipamento_id || null;
    const tenantId = record.tenant_id;
    const codEquip = record.codigo_equipamento || record.codigo_autolac || record.codigo_labfacil;

    // Se equipamento_id não veio no record, busca o primeiro equipamento do tenant
    if (!equipId && tenantId) {
      try {
        const { data: equips } = await supabaseBrowser
          .from('equipamentos')
          .select('id')
          .eq('tenant_id', tenantId)
          .limit(1);
        if (equips && equips.length > 0) {
          equipId = equips[0].id;
        }
      } catch (e) {
        // Fallback silencioso
      }
    }

    let chaveAutolac = record.codigo_autolac || codEquip;
    if (equipId && chaveAutolac && !chaveAutolac.includes(':')) {
      chaveAutolac = `${equipId.slice(0, 8)}:${chaveAutolac}`.slice(0, 100);
    }

    const payload = {
      ...record,
      equipamento_id: equipId,
      codigo_equipamento: codEquip,
      codigo_autolac: chaveAutolac,
      codigo_labfacil: record.codigo_labfacil || record.codigo_softlab,
      descricao_labfacil: record.descricao_labfacil || record.descricao_softlab,
      codigo_softlab: record.codigo_labfacil || record.codigo_softlab,
      descricao_softlab: record.descricao_labfacil || record.descricao_softlab,
      catalogo_aparelho: true,
    };

    const { error } = await supabaseBrowser.from('depara_exames').upsert(payload, { onConflict: 'tenant_id,codigo_autolac' });

    if (error) {
      console.error('[DeparaService] Erro ao salvar mapeamento:', error);
      throw error;
    }
  }

  /**
   * Remove um mapeamento DE-PARA do Supabase
   */
  static async removerMapeamento(tenantId: string, codigoLabfacil: string): Promise<void> {
    try {
      await supabaseBrowser
        .from('depara_exames')
        .delete()
        .eq('tenant_id', tenantId)
        .or(`codigo_labfacil.eq.${codigoLabfacil},codigo_softlab.eq.${codigoLabfacil}`);
    } catch (e) {
      console.error('[DeparaService] Erro ao remover mapeamento:', e);
    }
  }

  /**
   * Cadastra ou atualiza uma lista de mapeamentos DE-PARA em Lote no Supabase garantindo equipamento_id
   */
  static async salvarMapeamentoEmLote(records: IDeparaExameRecord[]): Promise<void> {
    if (!records || records.length === 0) return;

    // Se algum record estiver sem equipamento_id, descobre pelos tenants
    const tenantIdsSemEquip = Array.from(new Set(records.filter(r => !r.equipamento_id && r.tenant_id).map(r => r.tenant_id)));
    const equipMapPorTenant = new Map<string, string>();
    if (tenantIdsSemEquip.length > 0) {
      try {
        const { data: equips } = await supabaseBrowser
          .from('equipamentos')
          .select('id, tenant_id')
          .in('tenant_id', tenantIdsSemEquip);
        if (equips) {
          equips.forEach((eq) => {
            if (!equipMapPorTenant.has(eq.tenant_id)) {
              equipMapPorTenant.set(eq.tenant_id, eq.id);
            }
          });
        }
      } catch (e) {
        // Fallback silencioso
      }
    }

    const normalizedRecords = records.map(r => {
      const equipId = r.equipamento_id || (r.tenant_id ? equipMapPorTenant.get(r.tenant_id) : null) || null;
      const codEquip = r.codigo_equipamento || r.codigo_autolac || r.codigo_labfacil;
      let chaveAutolac = r.codigo_autolac || codEquip;
      if (equipId && chaveAutolac && !chaveAutolac.includes(':')) {
        chaveAutolac = `${equipId.slice(0, 8)}:${chaveAutolac}`.slice(0, 100);
      }

      return {
        ...r,
        equipamento_id: equipId,
        codigo_equipamento: codEquip,
        codigo_autolac: chaveAutolac,
        codigo_labfacil: r.codigo_labfacil || r.codigo_softlab,
        descricao_labfacil: r.descricao_labfacil || r.descricao_softlab,
        codigo_softlab: r.codigo_labfacil || r.codigo_softlab,
        descricao_softlab: r.descricao_labfacil || r.descricao_softlab,
        catalogo_aparelho: true,
      };
    });

    const { error } = await supabaseBrowser.from('depara_exames').upsert(normalizedRecords, { onConflict: 'tenant_id,codigo_autolac' });

    if (error) {
      console.error('[DeparaService] Erro ao salvar mapeamentos em lote:', error);
      throw error;
    }
  }

  /**
   * Busca o Catálogo de Exames do Labfacil salvo no banco Supabase
   */
  static async listarCatalogoLabfacil(tenantId?: string): Promise<ICatalogoLabfacilRecord[]> {
    try {
      const PAGE_SIZE = 1000;
      let allData: ICatalogoLabfacilRecord[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        // Tenta catalogo_labfacil_exames ou catalogo_softlab_exames por compatibilidade
        let query = supabaseBrowser
          .from('catalogo_labfacil_exames')
          .select('*');

        if (tenantId) {
          query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
        }

        const { data, error } = await query
          .order('descricao', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error || !data) {
          // Fallback para catalogo_softlab_exames
          const fallbackRes = await supabaseBrowser
            .from('catalogo_softlab_exames')
            .select('*')
            .range(from, from + PAGE_SIZE - 1);
          
          if (fallbackRes.data && fallbackRes.data.length > 0) {
            allData = [...allData, ...(fallbackRes.data as ICatalogoLabfacilRecord[])];
            hasMore = fallbackRes.data.length === PAGE_SIZE;
            from += PAGE_SIZE;
            continue;
          }
          break;
        }

        allData = [...allData, ...(data as ICatalogoLabfacilRecord[])];
        hasMore = data.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      return allData;
    } catch (e) {
      console.error('[DeparaService] Erro ao listar catálogo Labfacil:', e);
      return [];
    }
  }

  // Mantém alias para compatibilidade com chamadas existentes
  static async listarCatalogoSoftlab(tenantId?: string): Promise<ICatalogoLabfacilRecord[]> {
    return this.listarCatalogoLabfacil(tenantId);
  }

  /**
   * Limpa integralmente a tabela de Catálogo do Labfacil no Supabase
   */
  static async limparCatalogoLabfacil(tenantId?: string): Promise<void> {
    try {
      let query = supabaseBrowser.from('catalogo_labfacil_exames').delete();
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        query = query.is('tenant_id', null);
      }
      await query;
    } catch (e) {
      // Ignora erro se tabela nova não existir ainda
    }

    try {
      let querySoft = supabaseBrowser.from('catalogo_softlab_exames').delete();
      if (tenantId) {
        querySoft = querySoft.eq('tenant_id', tenantId);
      } else {
        querySoft = querySoft.is('tenant_id', null);
      }
      await querySoft;
    } catch (e) {
      console.error('[DeparaService] Erro ao limpar catálogo:', e);
    }
  }

  static async limparCatalogoSoftlab(tenantId?: string): Promise<void> {
    return this.limparCatalogoLabfacil(tenantId);
  }

  /**
   * Limpa exames antigos e cadastra a lista limpa do Labfacil no Supabase
   */
  static async limparECadastrarLimpoLabfacil(records: ICatalogoLabfacilRecord[], tenantId?: string): Promise<void> {
    await this.limparCatalogoLabfacil(tenantId);
    await this.salvarCatalogoLabfacil(records, tenantId);
  }

  static async limparECadastrarLimpoSoftlab(records: ICatalogoLabfacilRecord[], tenantId?: string): Promise<void> {
    return this.limparECadastrarLimpoLabfacil(records, tenantId);
  }

  /**
   * Salva ou atualiza a tabela de Catálogo de Exames do Labfacil no Supabase
   */
  static async salvarCatalogoLabfacil(records: ICatalogoLabfacilRecord[], tenantId?: string): Promise<void> {
    if (!records || records.length === 0) return;
    const recordsWithTenant = records.map(r => ({
      ...r,
      ...(tenantId ? { tenant_id: tenantId } : {})
    }));

    const CHUNK_SIZE = 100;
    for (let i = 0; i < recordsWithTenant.length; i += CHUNK_SIZE) {
      const chunk = recordsWithTenant.slice(i, i + CHUNK_SIZE);
      
      const { error } = await supabaseBrowser
        .from('catalogo_labfacil_exames')
        .upsert(chunk);

      if (error) {
        // Fallback para tabela anterior
        await supabaseBrowser
          .from('catalogo_softlab_exames')
          .upsert(chunk);
      }
    }
  }

  static async salvarCatalogoSoftlab(records: ICatalogoLabfacilRecord[], tenantId?: string): Promise<void> {
    return this.salvarCatalogoLabfacil(records, tenantId);
  }

  /**
   * Busca o Catálogo de Exames do Autolac
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
   * Salva ou atualiza o Catálogo de Exames do Autolac
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
