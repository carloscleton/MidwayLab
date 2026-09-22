import { supabase, ITenantRecord } from '../db/supabase';
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
   * Instancia um cliente Softlab parametrizado com as credenciais daquele Tenant
   */
  static createSoftlabClient(tenant: ITenantRecord): SoftlabClient {
    return new SoftlabClient(
      tenant.softlab_base_url || 'http://apoio.softlabsolucoes.com.br',
      tenant.softlab_login,
      tenant.softlab_senha
    );
  }
}
