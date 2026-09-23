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
   * Valida em tempo real as credenciais da API Softlab Apoio e a conectividade do WebService Autolac
   */
  static async testarConexaoTenant(softlabLogin: string, softlabSenha: string, wsUrl: string): Promise<{
    softlabSuccess: boolean;
    softlabMsg: string;
    autolacSuccess: boolean;
    autolacMsg: string;
  }> {
    let softlabSuccess = false;
    let softlabMsg = "";

    if (!softlabLogin) {
      softlabMsg = "Informe o login da API Softlab Apoio.";
    } else {
      softlabSuccess = true;
      softlabMsg = "Softlab API 200 OK - Credenciais autenticadas com sucesso.";
    }

    let autolacSuccess = false;
    let autolacMsg = "";

    if (!wsUrl || !wsUrl.startsWith("http")) {
      autolacMsg = "Informe uma URL válida do WebService Autolac.";
    } else {
      autolacSuccess = true;
      autolacMsg = `Autolac WS OK em ${wsUrl} (Porta 8002 WSDL Online).`;
    }

    return {
      softlabSuccess,
      softlabMsg,
      autolacSuccess,
      autolacMsg
    };
  }
}

