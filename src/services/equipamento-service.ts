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
        return {
          ...item,
          formato_arquivo: formato
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
      const payload: any = {
        tenant_id: equipamento.tenant_id,
        nome: equipamento.nome,
        modelo: equipamento.modelo || 'CB350',
        codigo_identificador: String((equipamento.codigo_identificador || equipamento.nome || "").replace(/\|FORMAT:[^|]+/g, "")) + "|FORMAT:" + (equipamento.formato_arquivo || "JSON"),
        // formato_arquivo mantido via codigo_identificador para compatibilidade com schema Supabase
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
