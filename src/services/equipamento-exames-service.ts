// src/services/equipamento-exames-service.ts
// Gerenciamento (CRUD) de exames homologados por equipamento na tabela public.depara_exames (Supabase)
// com fallback para a documentação técnica nativa do aparelho.
//
// Mapeamento de colunas (depara_exames):
//   codigoEquipamento       -> codigo_equipamento
//   codigoLabfacilSugerido  -> codigo_labfacil / codigo_softlab
//   nomeExame               -> descricao_labfacil / descricao_softlab / descricao_autolac
//   categoria               -> categoria            (sql/depara_exames_catalogo_aparelho.sql)
//   metodoOuPrincipio       -> metodo_ou_principio  (sql/depara_exames_catalogo_aparelho.sql)
//   amostraSugerida         -> amostra_sugerida     (sql/depara_exames_catalogo_aparelho.sql)
//   unidadePadrao           -> unidade_padrao       (sql/depara_exames_catalogo_aparelho.sql)
//   ativo                   -> ativo                (sql/depara_exames_catalogo_aparelho.sql)
//   (marcador do catálogo)  -> catalogo_aparelho = true

import { supabaseBrowser } from '../lib/supabase-client';
import { CATALOGO_EQUIPAMENTOS_DOC, IExameEquipamentoDoc } from '../data/equipamentos-catalog';

export interface ILinhaResultado {
  codigoEquipamento: string;
  descricao: string;
  parametroRetorno: string;
  enviaParaEquip: boolean;
  mascara: string;
  fatorMultiplicacao: string;
}

export interface ICalculadoExame {
  codigo: string;
  descricao: string;
  parametroRetorno: string;
  formula: string;
  global: boolean;
  mascara: string;
  /** true = o sistema calcula sozinho ao receber os resultados; false = apenas cadastro da fórmula */
  calcularAutomaticamente: boolean;
}

export interface IExameEquipamentoRecord extends IExameEquipamentoDoc {
  id?: string;
  equipamento_id?: string | null;
  modelo_equipamento: string;
  tenant_id?: string | null;
  ativo: boolean;
  origem: 'BANCO' | 'DOC_APARELHO';
  linhasResultado?: ILinhaResultado[];
  calculados?: ICalculadoExame[];
}

export interface ISalvarExamesResultado {
  ok: boolean;
  erro?: string;
}

const TABELA = 'depara_exames';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isIdReal(id?: string): id is string {
  return Boolean(id && UUID_REGEX.test(id));
}

export class EquipamentoExamesService {
  /**
   * codigo_autolac é NOT NULL e único por (tenant_id, codigo_autolac).
   * Para o mesmo código poder existir em aparelhos distintos do tenant, prefixamos com o id do equipamento.
   */
  private static chaveAutolac(equipamentoId: string, codigoEquipamento: string): string {
    return `${equipamentoId.slice(0, 8)}:${codigoEquipamento}`.slice(0, 100);
  }

  private static toRow(e: IExameEquipamentoRecord, equipamentoId: string, tenantId: string) {
    const codigo = (e.codigoEquipamento || '').trim().toUpperCase();
    const codLab = (e.codigoLabfacilSugerido || '').trim().toUpperCase();
    const nome = (e.nomeExame || '').trim();
    return {
      tenant_id: tenantId,
      equipamento_id: equipamentoId,
      codigo_equipamento: codigo,
      codigo_autolac: this.chaveAutolac(equipamentoId, codigo),
      descricao_autolac: nome,
      codigo_labfacil: codLab || null,
      descricao_labfacil: nome,
      codigo_softlab: codLab || codigo,
      descricao_softlab: nome,
      categoria: e.categoria,
      metodo_ou_principio: e.metodoOuPrincipio,
      amostra_sugerida: e.amostraSugerida,
      unidade_padrao: e.unidadePadrao,
      ativo: e.ativo,
      linhas_resultado: e.linhasResultado || [],
      calculados: e.calculados || [],
      catalogo_aparelho: true
    };
  }

  private static fromRow(d: any, modelo: string): IExameEquipamentoRecord {
    return {
      id: d.id,
      equipamento_id: d.equipamento_id,
      modelo_equipamento: modelo,
      tenant_id: d.tenant_id,
      codigoEquipamento: d.codigo_equipamento || '',
      nomeExame: d.descricao_labfacil || d.descricao_autolac || d.descricao_softlab || '',
      metodoOuPrincipio: d.metodo_ou_principio || '-',
      amostraSugerida: d.amostra_sugerida || 'Soro',
      unidadePadrao: d.unidade_padrao || '-',
      codigoLabfacilSugerido: d.codigo_labfacil || '',
      categoria: d.categoria || 'Geral',
      ativo: d.ativo !== undefined && d.ativo !== null ? Boolean(d.ativo) : true,
      linhasResultado: Array.isArray(d.linhas_resultado) ? d.linhas_resultado : [],
      calculados: Array.isArray(d.calculados) ? d.calculados : [],
      origem: 'BANCO'
    };
  }

  /**
   * Obtém os exames padrão/recomendados de um modelo a partir da tabela
   * modelos_equipamentos ou do catálogo estático da documentação técnica.
   */
  static async obterExamesPadraoDoModelo(
    modelo: string,
    equipamentoId?: string | null,
    tenantId?: string | null
  ): Promise<IExameEquipamentoRecord[]> {
    try {
      const { data: modeloDb } = await supabaseBrowser
        .from('modelos_equipamentos')
        .select('*')
        .or(`codigo_modelo.eq.${modelo},codigo_modelo.ilike.${modelo},nome_completo.ilike.%${modelo}%`)
        .limit(1)
        .maybeSingle();

      if (modeloDb && Array.isArray(modeloDb.exames) && modeloDb.exames.length > 0) {
        return (modeloDb.exames as IExameEquipamentoDoc[]).map((ex, idx) => ({
          id: `modelo-${modeloDb.codigo_modelo}-${idx}-${ex.codigoEquipamento}`,
          equipamento_id: equipamentoId || null,
          modelo_equipamento: modelo,
          tenant_id: tenantId || null,
          ...ex,
          ativo: true,
          linhasResultado: (ex as any).linhasResultado || [],
          calculados: (ex as any).calculados || [],
          origem: 'DOC_APARELHO' as const
        }));
      }
    } catch (e) {
      console.warn('[EquipamentoExamesService] Erro ao buscar modelo em modelos_equipamentos:', e);
    }

    // Fallback: documentação técnica nativa do aparelho
    const docInfo = CATALOGO_EQUIPAMENTOS_DOC[modelo] || CATALOGO_EQUIPAMENTOS_DOC.CB350;
    return docInfo.exames.map((ex, idx) => ({
      id: `doc-${modelo}-${idx}-${ex.codigoEquipamento}`,
      equipamento_id: equipamentoId || null,
      modelo_equipamento: modelo,
      tenant_id: tenantId || null,
      ...ex,
      ativo: true,
      origem: 'DOC_APARELHO' as const
    }));
  }

  private static aplicarOrdemSalva(
    lista: IExameEquipamentoRecord[],
    modelo: string,
    equipamentoId?: string
  ): IExameEquipamentoRecord[] {
    if (typeof window === 'undefined') return lista;
    try {
      const saved = (equipamentoId && localStorage.getItem(`ordem_exames_${equipamentoId}`)) ||
                    localStorage.getItem(`ordem_exames_${modelo}`);
      if (saved) {
        const codigos: string[] = JSON.parse(saved);
        if (Array.isArray(codigos) && codigos.length > 0) {
          const mapaPosicoes = new Map<string, number>();
          codigos.forEach((cod, i) => mapaPosicoes.set(cod.toUpperCase(), i));
          return [...lista].sort((a, b) => {
            const pA = mapaPosicoes.has(a.codigoEquipamento.toUpperCase()) ? mapaPosicoes.get(a.codigoEquipamento.toUpperCase())! : 9999;
            const pB = mapaPosicoes.has(b.codigoEquipamento.toUpperCase()) ? mapaPosicoes.get(b.codigoEquipamento.toUpperCase())! : 9999;
            return pA - pB;
          });
        }
      }
    } catch (e) {
      console.warn('[EquipamentoExamesService] Erro ao aplicar ordem:', e);
    }
    return lista;
  }

  /**
   * Obtém os exames do equipamento: busca primeiro no banco (depara_exames).
   * Se não houver nenhum exame de catálogo gravado, carrega os exames nativos da documentação do aparelho / modelo.
   */
  static async obterExamesDoAparelho(
    modelo: string,
    equipamentoId?: string,
    tenantId?: string
  ): Promise<{ exames: IExameEquipamentoRecord[]; origem: 'BANCO' | 'DOC_APARELHO' }> {
    try {
      if (equipamentoId) {
        const { data, error } = await supabaseBrowser
          .from(TABELA)
          .select('*')
          .eq('equipamento_id', equipamentoId)
          .eq('catalogo_aparelho', true);

        if (error) {
          console.warn('[EquipamentoExamesService] Erro na busca no banco:', error.message);
        } else if (data && data.length > 0) {
          const exames = this.aplicarOrdemSalva(
            data.map((d: any) => this.fromRow(d, modelo)),
            modelo,
            equipamentoId
          );
          return { origem: 'BANCO', exames };
        }
      }
    } catch (e) {
      console.warn('[EquipamentoExamesService] Erro na busca no banco:', e);
    }

    // FALLBACK: busca no modelo da tabela modelos_equipamentos ou documentação técnica nativa
    const examesPadrao = await this.obterExamesPadraoDoModelo(modelo, equipamentoId, tenantId);

    // Se temos equipamentoId e tenantId, já persiste no banco para evitar perda de sincronia
    if (equipamentoId && tenantId && examesPadrao.length > 0) {
      this.salvarExamesNoBanco(examesPadrao, modelo, equipamentoId, tenantId).catch(err => {
        console.warn('[EquipamentoExamesService] Erro ao sincronizar exames do modelo com banco:', err);
      });
    }

    return { origem: 'DOC_APARELHO', exames: this.aplicarOrdemSalva(examesPadrao, modelo, equipamentoId) };
  }

  /**
   * Grava a lista inteira de exames (insere os novos e atualiza os existentes).
   */
  static async salvarExamesNoBanco(
    exames: IExameEquipamentoRecord[],
    modelo: string,
    equipamentoId?: string,
    tenantId?: string
  ): Promise<ISalvarExamesResultado> {
    if (!equipamentoId || !tenantId) {
      return { ok: false, erro: 'Equipamento/tenant não identificado para gravar.' };
    }

    try {
      // Remove duplicados (mesmo código no aparelho): o último vence
      const porCodigo = new Map<string, IExameEquipamentoRecord>();
      exames.forEach(e => {
        const cod = (e.codigoEquipamento || '').trim().toUpperCase();
        if (cod) porCodigo.set(cod, e);
      });
      const lista = Array.from(porCodigo.values());

      const existentes = lista.filter(e => isIdReal(e.id));
      const novos = lista.filter(e => !isIdReal(e.id));

      if (existentes.length > 0) {
        const rows = existentes.map(e => ({ id: e.id as string, ...this.toRow(e, equipamentoId, tenantId) }));
        const { error } = await supabaseBrowser.from(TABELA).upsert(rows);
        if (error) {
          console.error('[EquipamentoExamesService] Erro ao atualizar exames:', error);
          return { ok: false, erro: error.message };
        }
      }

      if (novos.length > 0) {
        const rows = novos.map(e => this.toRow(e, equipamentoId, tenantId));
        const { error } = await supabaseBrowser
          .from(TABELA)
          .upsert(rows, { onConflict: 'tenant_id,codigo_autolac' });
        if (error) {
          console.error('[EquipamentoExamesService] Erro ao inserir exames:', error);
          return { ok: false, erro: error.message };
        }
      }

      return { ok: true };
    } catch (err: any) {
      console.error('[EquipamentoExamesService] Falha ao persistir no Supabase:', err);
      return { ok: false, erro: err?.message || 'Falha inesperada' };
    }
  }

  /**
   * Exclui um exame da tabela public.depara_exames no Supabase.
   * Remove por ID real (UUID), por (equipamento_id, codigo_equipamento) e por codigo_autolac.
   */
  static async excluirExame(
    exameOuId: string | IExameEquipamentoRecord,
    equipamentoId?: string | null,
    tenantId?: string | null
  ): Promise<{ ok: boolean; erro?: string }> {
    try {
      const isString = typeof exameOuId === 'string';
      const id = isString ? exameOuId : exameOuId?.id;
      const exame = isString ? null : exameOuId;
      const equipId = equipamentoId || exame?.equipamento_id || null;
      const tId = tenantId || exame?.tenant_id || null;
      const codEq = exame?.codigoEquipamento?.trim().toUpperCase();

      // 1. Se tem id UUID real, remove diretamente pelo id
      if (id && isIdReal(id)) {
        const { error: errId } = await supabaseBrowser.from(TABELA).delete().eq('id', id);
        if (errId) {
          console.error('[EquipamentoExamesService] Erro ao deletar por id:', errId);
        }
      }

      // 2. Remove por equipamento_id + codigo_equipamento e codigo_autolac
      if (equipId && codEq) {
        const { error: err1 } = await supabaseBrowser
          .from(TABELA)
          .delete()
          .eq('equipamento_id', equipId)
          .ilike('codigo_equipamento', codEq);

        if (err1) {
          console.error('[EquipamentoExamesService] Erro ao deletar por equipamento_id + codigo_equipamento:', err1);
        }

        const chaveAutolac = this.chaveAutolac(equipId, codEq);
        const { error: err2 } = await supabaseBrowser
          .from(TABELA)
          .delete()
          .eq('codigo_autolac', chaveAutolac);

        if (err2) {
          console.error('[EquipamentoExamesService] Erro ao deletar por codigo_autolac:', err2);
        }
      }

      // 3. Fallback adicional por tenant_id e codigo_equipamento
      if (tId && codEq) {
        await supabaseBrowser
          .from(TABELA)
          .delete()
          .eq('tenant_id', tId)
          .ilike('codigo_equipamento', codEq);
      }

      // 4. Limpa do localStorage para o código não voltar pela ordenação
      if (typeof window !== 'undefined' && codEq) {
        try {
          const chaves = [];
          if (equipId) chaves.push(`ordem_exames_${equipId}`);
          if (exame?.modelo_equipamento) chaves.push(`ordem_exames_${exame.modelo_equipamento}`);
          for (const k of chaves) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list: string[] = JSON.parse(raw);
              if (Array.isArray(list)) {
                localStorage.setItem(k, JSON.stringify(list.filter(c => c.toUpperCase() !== codEq)));
              }
            }
          }
        } catch (e) {
          // ignore localStorage error
        }
      }

      return { ok: true };
    } catch (e: any) {
      console.error('[EquipamentoExamesService] Erro ao excluir exame:', e);
      return { ok: false, erro: e?.message || 'Falha ao excluir exame do Supabase' };
    }
  }
}
