import { supabaseBrowser } from '../lib/supabase-client';
import { CATALOGO_EQUIPAMENTOS_DOC, IEquipamentoCatalogDoc, IExameEquipamentoDoc } from '../data/equipamentos-catalog';

export interface IModeloEquipamentoRecord {
  id?: string;
  codigo_modelo: string;
  nome_completo: string;
  fabricante: string;
  tipo_analise: string;
  protocolo_comunicacao: string;
  descricao?: string;
  configuracoes: {
    tipo_comunicacao?: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' | 'API';
    formato_arquivo?: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV';
    porta?: number;
    ip_host?: string;
    baud_rate?: number;
    data_bits?: number;
    stop_bits?: number;
    parity?: 'none' | 'even' | 'odd';
    diretorio_carga?: string;
    diretorio_resultados?: string;
    [key: string]: any;
  };
  exames: IExameEquipamentoDoc[];
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ModelosEquipamentosService {
  /**
   * Lista todos os modelos de analisadores cadastrados no banco Supabase.
   * Se a tabela ainda estiver vazia ou offline, faz fallback seguro para o catálogo embutido.
   */
  static async listarModelos(): Promise<IModeloEquipamentoRecord[]> {
    try {
      const { data, error } = await supabaseBrowser
        .from('modelos_equipamentos')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          codigo_modelo: d.codigo_modelo,
          nome_completo: d.nome_completo,
          fabricante: d.fabricante,
          tipo_analise: d.tipo_analise,
          protocolo_comunicacao: d.protocolo_comunicacao,
          descricao: d.descricao || '',
          configuracoes: d.configuracoes || {},
          exames: Array.isArray(d.exames) ? d.exames : [],
          ativo: d.ativo !== undefined ? Boolean(d.ativo) : true,
          created_at: d.created_at,
          updated_at: d.updated_at
        }));
      }
    } catch (err) {
      console.warn('[ModelosEquipamentosService] Fallback para catalogo embutido:', err);
    }

    // Fallback: carregar dos 12 modelos embutidos
    return Object.values(CATALOGO_EQUIPAMENTOS_DOC).map((m: IEquipamentoCatalogDoc) => {
      let configs: any = { tipo_comunicacao: 'TCP_IP', formato_arquivo: 'ASTM' };
      if (m.protocoloComunicacao.includes('Serial') || m.protocoloComunicacao.includes('RS-232')) {
        configs = {
          tipo_comunicacao: 'SERIAL',
          baud_rate: 9600,
          data_bits: 8,
          stop_bits: 1,
          parity: 'none',
          formato_arquivo: m.protocoloComunicacao.includes('HL7') ? 'HL7' : (m.protocoloComunicacao.includes('CSV') ? 'CSV' : 'ASTM')
        };
      } else if (m.protocoloComunicacao.includes('Arquivo Compartilhado')) {
        configs = {
          tipo_comunicacao: 'ARQUIVO_COMPARTILHADO',
          formato_arquivo: 'JSON',
          diretorio_carga: 'C:\\Equipamentos\\Carga',
          diretorio_resultados: 'C:\\Equipamentos\\Resultados'
        };
      } else {
        configs = {
          tipo_comunicacao: 'TCP_IP',
          porta: 5100,
          formato_arquivo: m.protocoloComunicacao.includes('HL7') ? 'HL7' : 'ASTM'
        };
      }

      return {
        codigo_modelo: m.modelo,
        nome_completo: m.nomeCompleto,
        fabricante: m.fabricante,
        tipo_analise: m.tipoAnalise,
        protocolo_comunicacao: m.protocoloComunicacao,
        descricao: m.descricaoDoc,
        configuracoes: configs,
        exames: m.exames,
        ativo: true
      };
    });
  }

  /**
   * Salva ou atualiza um modelo de analisador no banco Supabase
   */
  static async salvarModelo(modelo: IModeloEquipamentoRecord): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const payload: any = {
        codigo_modelo: modelo.codigo_modelo.trim().toUpperCase(),
        nome_completo: modelo.nome_completo.trim(),
        fabricante: modelo.fabricante.trim(),
        tipo_analise: modelo.tipo_analise.trim(),
        protocolo_comunicacao: modelo.protocolo_comunicacao.trim(),
        descricao: modelo.descricao || '',
        configuracoes: modelo.configuracoes || {},
        exames: modelo.exames || [],
        ativo: modelo.ativo !== undefined ? modelo.ativo : true,
        updated_at: new Date().toISOString()
      };

      if (modelo.id && !modelo.id.startsWith('temp-')) {
        payload.id = modelo.id;
      }

      const { data, error } = await supabaseBrowser
        .from('modelos_equipamentos')
        .upsert(payload, { onConflict: 'codigo_modelo' })
        .select()
        .single();

      if (error) {
        console.error('[ModelosEquipamentosService] Erro ao gravar modelo:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('[ModelosEquipamentosService] Exceção ao gravar modelo:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Remove um modelo de analisador do banco
   */
  static async excluirModelo(idOuCodigo: string): Promise<boolean> {
    try {
      const { error } = await supabaseBrowser
        .from('modelos_equipamentos')
        .delete()
        .or(`id.eq.${idOuCodigo},codigo_modelo.eq.${idOuCodigo}`);

      return !error;
    } catch {
      return false;
    }
  }
}
