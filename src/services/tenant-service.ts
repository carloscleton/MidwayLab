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
   * Valida em TEMPO REAL as credenciais na API REST do Softlab Apoio e a conectividade do WebService Autolac
   */
  static async testarConexaoTenant(softlabLogin: string, softlabSenha: string, wsUrl: string): Promise<{
    softlabSuccess: boolean;
    softlabMsg: string;
    autolacSuccess: boolean;
    autolacMsg: string;
  }> {
    let softlabSuccess = false;
    let softlabMsg = "";

    // 1. TESTE REAL NA API REST DO SOFTLAB APOIO
    if (!softlabLogin || !softlabSenha) {
      softlabMsg = "Informe o login e a senha da API Softlab Apoio.";
    } else {
      try {
        const targetBaseUrl = (wsUrl && wsUrl.includes('softlabsolucoes.com.br'))
          ? 'http://apoio.softlabsolucoes.com.br'
          : (wsUrl && wsUrl.startsWith('http') ? wsUrl : 'http://apoio.softlabsolucoes.com.br');

        const client = new SoftlabClient(targetBaseUrl, softlabLogin, softlabSenha);
        const token = await client.authenticate();

        if (token) {
          softlabSuccess = true;
          softlabMsg = "✓ Softlab API 200 OK - Credenciais autenticadas com sucesso!";
        } else {
          softlabSuccess = false;
          softlabMsg = "Token JWT não retornado pela API Softlab.";
        }
      } catch (err: any) {
        softlabSuccess = false;
        const msg = err.message || "";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("autenticação")) {
          softlabMsg = "❌ Erro 401: Credenciais (Login/Senha) incorretas no Softlab Apoio.";
        } else if (msg.includes("404") || msg.includes("ENOTFOUND")) {
          softlabMsg = `❌ Domínio/Servidor Softlab inacessível. (${msg})`;
        } else {
          softlabMsg = `❌ Falha na autenticação Softlab: ${msg}`;
        }
      }
    }

    // 2. TESTE REAL DE CONECTIVIDADE NO WEBSERVICE AUTOLAC
    let autolacSuccess = false;
    let autolacMsg = "";

    if (!wsUrl || !wsUrl.startsWith("http")) {
      autolacMsg = "Informe uma URL válida iniciada com http:// ou https://.";
    } else {
      try {
        const cleanUrl = wsUrl.replace(/\/$/, '');
        await axios.get(cleanUrl, { timeout: 6000 });
        autolacSuccess = true;
        autolacMsg = `✓ WebService Autolac Respondendo OK em ${wsUrl}`;
      } catch (err: any) {
        if (err.response) {
          // Response received (even HTTP 405/404/500), proving host exists and responds
          autolacSuccess = true;
          autolacMsg = `✓ Servidor WebService Online em ${wsUrl} (Status HTTP ${err.response.status}).`;
        } else {
          autolacSuccess = false;
          const code = err.code || "";
          if (code === "ENOTFOUND" || code === "EAI_AGAIN" || err.message?.includes("ENOTFOUND") || err.message?.includes("Network Error")) {
            autolacMsg = `❌ Domínio ou IP inacessível: Servidor '${wsUrl}' não foi encontrado.`;
          } else if (code === "ECONNREFUSED") {
            autolacMsg = `❌ Conexão recusada pela porta em '${wsUrl}'.`;
          } else if (code === "ETIMEDOUT" || code === "ECONNABORTED") {
            autolacMsg = `❌ Timeout: O servidor em '${wsUrl}' não respondeu em 6 segundos.`;
          } else {
            autolacMsg = `❌ Erro de Conectividade: ${err.message || 'Servidor indisponível'}`;
          }
        }
      }
    }

    return {
      softlabSuccess,
      softlabMsg,
      autolacSuccess,
      autolacMsg
    };
  }
}

