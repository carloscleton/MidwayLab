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
    const { data, error } = await supabaseBrowser
      .from('tenants')
      .upsert({
        id: tenant.id,
        nome: tenant.nome,
        codigo_entidade: tenant.codigo_entidade || '1',
        identificacao_entidade: tenant.identificacao_entidade,
        senha_ws: tenant.senha_ws || 'Soft@2026',
        softlab_base_url: tenant.softlab_base_url || 'http://apoio.softlabsolucoes.com.br',
        softlab_login: tenant.softlab_login,
        softlab_senha: tenant.softlab_senha,
        ativo: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('[TenantService] Erro ao salvar tenant:', error);
      throw error;
    }

    return data as ITenantRecord;
  }

  /**
   * Instancia um cliente Softlab parametrizado com as credenciais daquele Tenant
   */
  static createSoftlabClient(tenant: ITenantRecord): SoftlabClient {
    return new SoftlabClient(
      tenant.softlab_base_url || 'http://apoio.softlabsolucoes.com.br',
      tenant.softlab_login,
      tenant.softlab_senha
    );
  }

  /**
   * Valida em TEMPO REAL e INDIVIDUALMENTE as credenciais da API Softlab Apoio e a conectividade do WebService Autolac via Rota Server-Side
   */
  static async testarConexaoTenant(softlabLogin: string, softlabSenha: string, wsUrl: string, softlabBaseUrl?: string): Promise<{
    softlabSuccess: boolean;
    softlabMsg: string;
    autolacSuccess: boolean;
    autolacMsg: string;
  }> {
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          softlabLogin,
          softlabSenha,
          softlabBaseUrl: softlabBaseUrl || 'http://apoio.softlabsolucoes.com.br',
          wsUrl
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

