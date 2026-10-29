import axios from 'axios';
import { supabase, ITenantRecord } from '../db/supabase';
import { supabaseBrowser } from '../lib/supabase-client';
import { LabfacilClient } from '../clients/labfacil-client';

export class TenantService {
  /**
   * Busca a empresa/tenant no Supabase pelo login enviado (Identificação da entidade)
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
    const apiToken = existingConfigs?.api_token || `mw_agt_${(tenant.identificacao_entidade || "agt").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`;
    
    const baseUrl = tenant.labfacil_base_url || tenant.softlab_base_url || existingConfigs?.labfacil?.base_url || existingConfigs?.softlab?.base_url || 'http://apoio.softlabsolucoes.com.br';
    const login = tenant.labfacil_login || tenant.softlab_login || existingConfigs?.labfacil?.login || existingConfigs?.softlab?.login || '';
    const senha = tenant.labfacil_senha || tenant.softlab_senha || existingConfigs?.labfacil?.senha || existingConfigs?.softlab?.senha || '';

    const payload: any = {
      nome: tenant.nome,
      codigo_entidade: tenant.codigo_entidade || '1',
      identificacao_entidade: tenant.identificacao_entidade,
      configuracoes: {
        ...existingConfigs,
        api_token: apiToken,
        autolac: {
          ws_url: (tenant as any).ws_url || (tenant as any).wsUrl || existingConfigs?.autolac?.ws_url || 'http://homolog.app.lifesys.com.br:5030',
          identificacao_entidade: tenant.identificacao_entidade,
          senha_ws: tenant.senha_ws || existingConfigs?.autolac?.senha_ws || ''
        },
        labfacil: {
          base_url: baseUrl,
          login: login,
          senha: senha
        },
        softlab: {
          base_url: baseUrl,
          login: login,
          senha: senha
        },
        usar_catalogo_proprio: isCustomCatalog
      },
      ativo: tenant.ativo !== undefined ? tenant.ativo : true
    };

    if (tenant.id && typeof tenant.id === 'string' && tenant.id.includes('-') && tenant.id.length >= 30) {
      payload.id = tenant.id;
    }

    try {
      const fullPayload = {
        ...payload,
        labfacil_base_url: baseUrl,
        labfacil_login: login,
        labfacil_senha: senha,
        softlab_base_url: baseUrl,
        softlab_login: login,
        softlab_senha: senha,
        usar_catalogo_proprio: isCustomCatalog
      };
      
      const { data, error } = await supabaseBrowser
        .from('tenants')
        .upsert(fullPayload, { onConflict: payload.id ? 'id' : 'identificacao_entidade' })
        .select('*')
        .single();

      if (!error && data) {
        return data as ITenantRecord;
      }

      const { data: fallbackData, error: fallbackError } = await supabaseBrowser
        .from('tenants')
        .upsert(payload, { onConflict: payload.id ? 'id' : 'identificacao_entidade' })
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
   * Instancia um cliente Labfacil parametrizado com as credenciais daquele Tenant
   */
  static createLabfacilClient(tenant: ITenantRecord): LabfacilClient {
    const baseUrl = tenant.labfacil_base_url || tenant.softlab_base_url || tenant.configuracoes?.labfacil?.base_url || tenant.configuracoes?.softlab?.base_url || 'http://apoio.softlabsolucoes.com.br';
    const login = tenant.labfacil_login || tenant.softlab_login || tenant.configuracoes?.labfacil?.login || tenant.configuracoes?.softlab?.login || '';
    const senha = tenant.labfacil_senha || tenant.softlab_senha || tenant.configuracoes?.labfacil?.senha || tenant.configuracoes?.softlab?.senha || '';
    return new LabfacilClient(baseUrl, login, senha);
  }

  // Alias para retrocompatibilidade
  static createSoftlabClient(tenant: ITenantRecord): LabfacilClient {
    return this.createLabfacilClient(tenant);
  }

  /**
   * Valida em TEMPO REAL e INDIVIDUALMENTE as credenciais da API Labfacil e conectividade
   */
  static async testarConexaoTenant(
    labfacilLogin: string,
    labfacilSenha: string,
    wsUrl: string,
    labfacilBaseUrl?: string,
    identificacaoEntidade?: string,
    senhaWs?: string,
    targetService: 'labfacil' | 'softlab' | 'autolac' | 'both' = 'both'
  ): Promise<{
    labfacilSuccess?: boolean;
    labfacilMsg?: string;
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
          labfacilLogin,
          labfacilSenha,
          labfacilBaseUrl: labfacilBaseUrl || 'http://apoio.softlabsolucoes.com.br',
          softlabLogin: labfacilLogin,
          softlabSenha: labfacilSenha,
          softlabBaseUrl: labfacilBaseUrl,
          wsUrl,
          identificacaoEntidade,
          senhaWs,
          targetService: targetService === 'softlab' ? 'labfacil' : targetService
        })
      });

      if (response.ok) {
        const json = await response.json();
        return {
          ...json,
          labfacilSuccess: json.labfacilSuccess ?? json.softlabSuccess,
          labfacilMsg: json.labfacilMsg ?? json.softlabMsg,
        };
      }
      throw new Error(`Servidor respondeu com status ${response.status}`);
    } catch (err: any) {
      console.error('[TenantService] Erro ao testar conexão via API route:', err);
      return {
        labfacilSuccess: false,
        labfacilMsg: `Erro ao executar teste individual: ${err.message}`,
        softlabSuccess: false,
        softlabMsg: `Erro ao executar teste individual: ${err.message}`,
        autolacSuccess: false,
        autolacMsg: `Erro ao executar teste individual: ${err.message}`
      };
    }
  }
  /**
   * Salva configurações específicas de Ingestão de Pastas no JSONB da empresa (Tenant)
   * Suporta separação por equipamento selecionado (ex: CB350, YUMIZEN, ACCESS, etc.)
   */
  static async salvarConfigIngestaoPastas(tenantId: string, configIngestao: any, modeloEquipamento?: string): Promise<boolean> {
    try {
      const equipModelo = (modeloEquipamento || configIngestao.equipamento_destino || 'CB350').toUpperCase().trim();

      // 1. Tenta salvar via API Route do backend (Garante bypass de RLS e Service Role)
      try {
        const response = await fetch('/api/tenant-folder-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, configIngestao, modeloEquipamento: equipModelo })
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            return true;
          }
        }
      } catch (apiErr) {
        console.warn("[TenantService] API route /api/tenant-folder-config falhou, tentando fallback direto:", apiErr);
      }

      // 2. Fallback: Salva diretamente via supabaseBrowser
      const { data: tenant } = await supabaseBrowser
        .from("tenants")
        .select("configuracoes")
        .eq("id", tenantId)
        .single();

      const existingConfigs = tenant?.configuracoes || {};
      const existingEquipPastas = existingConfigs.equipamentos_pastas || {};

      const updatedEquipPastas = {
        ...existingEquipPastas,
        [equipModelo]: {
          ...(existingEquipPastas[equipModelo] || {}),
          ...configIngestao,
          equipamento_destino: equipModelo,
          atualizado_em: new Date().toISOString()
        }
      };

      const updatedConfigs = {
        ...existingConfigs,
        equipamentos_pastas: updatedEquipPastas,
        ingestao_pastas: {
          ...(existingConfigs.ingestao_pastas || {}),
          ...configIngestao,
          equipamento_destino: equipModelo,
          atualizado_em: new Date().toISOString()
        }
      };

      const { error: updateErr } = await supabaseBrowser
        .from("tenants")
        .update({ configuracoes: updatedConfigs })
        .eq("id", tenantId);

      if (updateErr) {
        console.warn("[TenantService] Erro ao salvar configuracoes.ingestao_pastas via fallback:", updateErr.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("[TenantService] Falha ao atualizar configuracao JSONB:", err.message);
      return false;
    }
  }
}
