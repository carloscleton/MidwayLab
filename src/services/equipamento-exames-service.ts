// src/services/equipamento-exames-service.ts
// Gerenciamento (CRUD) de exames homologados por equipamento no Supabase com fallback para a documentação técnica nativa

import { supabaseBrowser } from '../lib/supabase-client';
import { CATALOGO_EQUIPAMENTOS_DOC, IExameEquipamentoDoc } from '../data/equipamentos-catalog';

export interface IExameEquipamentoRecord extends IExameEquipamentoDoc {
  id?: string;
  equipamento_id?: string | null;
  modelo_equipamento: string;
  tenant_id?: string | null;
  ativo: boolean;
  origem: 'BANCO' | 'DOC_APARELHO';
}

export class EquipamentoExamesService {
  /**
   * Obtém os exames do equipamento: busca primeiro no banco Supabase.
   * Se não houver nenhum exame gravado no banco para o modelo/equipamento,
   * carrega os exames nativos da documentação do aparelho!
   */
  static async obterExamesDoAparelho(
    modelo: string,
    equipamentoId?: string,
    tenantId?: string
  ): Promise<{ exames: IExameEquipamentoRecord[]; origem: 'BANCO' | 'DOC_APARELHO' }> {
    try {
      let query = supabaseBrowser
        .from('equipamento_exames_catalogo')
        .select('*');

      if (equipamentoId) {
        query = query.eq('equipamento_id', equipamentoId);
      } else if (tenantId) {
        query = query.eq('tenant_id', tenantId).eq('modelo_equipamento', modelo);
      } else {
        query = query.eq('modelo_equipamento', modelo);
      }

      const { data, error } = await query.order('nomeExame', { ascending: true });

      if (!error && data && data.length > 0) {
        return {
          origem: 'BANCO',
          exames: data.map((d: any) => ({
            id: d.id,
            equipamento_id: d.equipamento_id,
            modelo_equipamento: d.modelo_equipamento || modelo,
            tenant_id: d.tenant_id,
            codigoEquipamento: d.codigo_equipamento || d.codigoEquipamento,
            nomeExame: d.nome_exame || d.nomeExame,
            metodoOuPrincipio: d.metodo_ou_principio || d.metodoOuPrincipio || '-',
            amostraSugerida: d.amostra_sugerida || d.amostraSugerida || 'Soro',
            unidadePadrao: d.unidade_padrao || d.unidadePadrao || '-',
            codigoLabfacilSugerido: d.codigo_labfacil_sugerido || d.codigoLabfacilSugerido || '',
            categoria: d.categoria || 'Geral',
            ativo: d.ativo !== undefined ? Boolean(d.ativo) : true,
            origem: 'BANCO' as const
          }))
        };
      }
    } catch (e) {
      console.warn('[EquipamentoExamesService] Tabela não criada ou erro na busca no banco:', e);
    }

    // FALLBACK: Se não tiver no banco, busca na documentação técnica nativa do aparelho
    const docInfo = CATALOGO_EQUIPAMENTOS_DOC[modelo] || CATALOGO_EQUIPAMENTOS_DOC.CB350;
    const examesPadrao: IExameEquipamentoRecord[] = docInfo.exames.map((ex, idx) => ({
      id: `doc-${modelo}-${idx}-${ex.codigoEquipamento}`,
      equipamento_id: equipamentoId || null,
      modelo_equipamento: modelo,
      tenant_id: tenantId || null,
      ...ex,
      ativo: true,
      origem: 'DOC_APARELHO' as const
    }));

    return {
      origem: 'DOC_APARELHO',
      exames: examesPadrao
    };
  }

  /**
   * Salva a lista inteira de exames no banco Supabase
   */
  static async salvarExamesNoBanco(
    exames: IExameEquipamentoRecord[],
    modelo: string,
    equipamentoId?: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const recordsToUpsert = exames.map(e => ({
        ...(e.id && !e.id.startsWith('doc-') ? { id: e.id } : {}),
        equipamento_id: equipamentoId || null,
        modelo_equipamento: modelo,
        tenant_id: tenantId || null,
        codigo_equipamento: e.codigoEquipamento,
        nome_exame: e.nomeExame,
        categoria: e.categoria,
        metodo_ou_principio: e.metodoOuPrincipio,
        amostra_sugerida: e.amostraSugerida,
        unidade_padrao: e.unidadePadrao,
        codigo_labfacil_sugerido: e.codigoLabfacilSugerido,
        ativo: e.ativo
      }));

      const { error } = await supabaseBrowser
        .from('equipamento_exames_catalogo')
        .upsert(recordsToUpsert);

      if (error) {
        console.warn('[EquipamentoExamesService] Erro ao gravar exames no Supabase:', error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('[EquipamentoExamesService] Falha ao persistir no Supabase:', err);
      return false;
    }
  }

  /**
   * Salva ou atualiza um único exame
   */
  static async salvarExameIndividual(
    exame: IExameEquipamentoRecord,
    modelo: string,
    equipamentoId?: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const payload: any = {
        ...(exame.id && !exame.id.startsWith('doc-') ? { id: exame.id } : {}),
        equipamento_id: equipamentoId || null,
        modelo_equipamento: modelo,
        tenant_id: tenantId || null,
        codigo_equipamento: exame.codigoEquipamento,
        nome_exame: exame.nomeExame,
        categoria: exame.categoria,
        metodo_ou_principio: exame.metodoOuPrincipio,
        amostra_sugerida: exame.amostraSugerida,
        unidade_padrao: exame.unidadePadrao,
        codigo_labfacil_sugerido: exame.codigoLabfacilSugerido,
        ativo: exame.ativo
      };

      const { error } = await supabaseBrowser
        .from('equipamento_exames_catalogo')
        .upsert(payload);

      if (error) {
        console.warn('[EquipamentoExamesService] Falha ao salvar exame individual:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Exclui um exame da tabela
   */
  static async excluirExame(id: string): Promise<boolean> {
    try {
      if (id.startsWith('doc-')) return true;
      const { error } = await supabaseBrowser
        .from('equipamento_exames_catalogo')
        .delete()
        .eq('id', id);
      return !error;
    } catch (e) {
      return false;
    }
  }
}
