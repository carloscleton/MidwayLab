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
      return data as IEquipamentoRecord[];
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
      const payload: any = {
        tenant_id: equipamento.tenant_id,
        nome: equipamento.nome,
        modelo: equipamento.modelo || 'CB350',
        codigo_identificador: equipamento.codigo_identificador || equipamento.nome,
        fabricante: equipamento.fabricante || (equipamento.modelo?.includes('YUMIZEN') ? 'Horiba' : 'Cormay'),
        tipo_comunicacao: equipamento.tipo_comunicacao || 'ARQUIVO_COMPARTILHADO',
        ip_host: equipamento.ip_host || '',
        porta: equipamento.porta || null,
        diretorio_carga: equipamento.diretorio_carga || 'C:\\Equipamentos\\Carga',
        diretorio_resultados: equipamento.diretorio_resultados || 'C:\\Equipamentos\\Resultados',
        ativo: equipamento.ativo !== undefined ? equipamento.ativo : true,
      };

      if (equipamento.id && equipamento.id.length > 20) {
        payload.id = equipamento.id;
      }

      const { data, error } = await supabaseBrowser
        .from('equipamentos')
        .upsert(payload)
        .select('*')
        .single();

      if (error) {
        console.warn('[EquipamentoService] Erro no Supabase upsert:', error.message);
        // Retorna o objeto gerado com id sintético caso a tabela ainda não tenha sido criada no Supabase remoto
        return {
          id: equipamento.id || `eq-${Date.now()}`,
          ...payload,
        } as IEquipamentoRecord;
      }

      return data as IEquipamentoRecord;
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
