import axios from 'axios';
import { supabase, ITenantRecord } from '../db/supabase';
import { supabaseBrowser } from '../lib/supabase-client';
import { SoftlabClient } from '../clients/softlab-client';

export class TenantService {
  /**
   * Busca a empresa/tenant no Supabase pelo login enviado pelo Autolac (Identificação da entidade)
   */
  static async getTenantByIdentificacao(identificacaoEntidade: string): Promise<ITenantRecord | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('identificacao_entidade', identificacaoEntidade)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      console.warn(`[TenantService] Tenant não encontrado para identificação: '${identificacaoEntidade}'`);
      return null;
    }

    return data as ITenantRecord;
  }

  /**
   * Lista todos os tenants ativos no Supabase
   */
  static async listarTenants(): Promise<ITenantRecord[]> {
    try {
      const { data, error } = await supabaseBrowser
        .from('tenants')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error || !data) return [];
      return data as ITenantRecord[];
    } catch (e) {
      console.error('[TenantService] Erro ao listar tenants:', e);
      return [];
    }
  }

  /**
   * Salva ou atualiza um Tenant no Supabase
   */
  static async salvarTenant(tenant: Partial<ITenantRecord>): Promise<ITenantRecord | null> {
    const isCustomCatalog = tenant.usar_catalogo_proprio !== undefined ? Boolean(tenant.usar_catalogo_proprio) : false;
    const existingConfigs = tenant.configuracoes || {};

    const payload: any = {
      nome: tenant.nome,
      codigo_entidade: tenant.codigo_entidade || '1',
      identificacao_entidade: tenant.identificacao_entidade,
      configuracoes: {
        ...existingConfigs,
        autolac: {
          ws_url: (tenant as any).ws_url || (tenant as any).wsUrl || existingConfigs?.autolac?.ws_url || 'http://homolog.app.lifesys.com.br:5030',
          identificacao_entidade: tenant.identificacao_entidade,
          senha_ws: tenant.senha_ws || existingConfigs?.autolac?.senha_ws || ''
        },
        softlab: {
          base_url: tenant.softlab_base_url || existingConfigs?.softlab?.base_url || 'http://apoio.softlabsolucoes.com.br',
          login: tenant.softlab_login || existingConfigs?.softlab?.login || '',
          senha: tenant.softlab_senha || existingConfigs?.softlab?.senha || ''
        },
        usar_catalogo_proprio: isCustomCatalog
      },
      ativo: tenant.ativo !== undefined ? tenant.ativo : true
    };

    if (tenant.id && typeof tenant.id === 'string' && tenant.id.includes('-') && tenant.id.length >= 30) {
      payload.id = tenant.id;
    }

    try {
      // 1. Try saving with top-level column + configuracoes JSONB
      const fullPayload = { ...payload, usar_catalogo_proprio: isCustomCatalog };
      const { data, error } = await supabaseBrowser
        .from('tenants')
        .upsert(fullPayload)
        .select('*')
        .single();

      if (!error && data) {
        return data as ITenantRecord;
      }

      // 2. Fallback: If top-level column is missing in DB schema, save inside configuracoes JSONB
      const { data: fallbackData, error: fallbackError } = await supabaseBrowser
        .from('tenants')
        .upsert(payload)
        .select('*')
        .single();

      if (fallbackError) {
        console.warn('[TenantService] Erro ao salvar tenant no Supabase:', fallbackError);
        return null;
      }

      return fallbackData as ITenantRecord;
    } catch (err: any) {
      console.warn('[TenantService] Conexão com Supabase indisponível:', err?.message || err);
      return null;
    }
  }

  /**
   * Instancia um cliente Softlab parametrizado com as credenciais daquele Tenant
   */
  static createSoftlabClient(tenant: ITenantRecord): SoftlabClient {
    const baseUrl = tenant.softlab_base_url || tenant.configuracoes?.softlab?.base_url || 'http://apoio.softlabsolucoes.com.br';
    const login = tenant.softlab_login || tenant.configuracoes?.softlab?.login || '';
    const senha = tenant.softlab_senha || tenant.configuracoes?.softlab?.senha || '';
    return new SoftlabClient(baseUrl, login, senha);
  }

  /**
   * Valida em TEMPO REAL e INDIVIDUALMENTE as credenciais da API Softlab Apoio e a conectividade do WebService Autolac via Rota Server-Side
   */
  static async testarConexaoTenant(
    softlabLogin: string,
    softlabSenha: string,
    wsUrl: string,
    softlabBaseUrl?: string,
    identificacaoEntidade?: string,
    senhaWs?: string,
    targetService: 'softlab' | 'autolac' | 'both' = 'both'
  ): Promise<{
    softlabSuccess?: boolean;
    softlabMsg?: string;
    autolacSuccess?: boolean;
    autolacMsg?: string;
  }> {
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          softlabLogin,
          softlabSenha,
          softlabBaseUrl: softlabBaseUrl || 'http://apoio.softlabsolucoes.com.br',
          wsUrl,
          identificacaoEntidade,
          senhaWs,
          targetService
        })
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Servidor respondeu com status ${response.status}`);
    } catch (err: any) {
      console.error('[TenantService] Erro ao testar conexão via API route:', err);
      return {
        softlabSuccess: false,
        softlabMsg: `Erro ao executar teste individual: ${err.message}`,
        autolacSuccess: false,
        autolacMsg: `Erro ao executar teste individual: ${err.message}`
      };
    }
  }
}

