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
      return data.map((t: any) => ({
        ...t,
        cnpj: t.cnpj || t.configuracoes?.cnpj || '',
        nome_responsavel: t.nome_responsavel || t.configuracoes?.nome_responsavel || '',
        email: t.email || t.configuracoes?.email || (t.identificacao_entidade?.includes('@') ? t.identificacao_entidade : '')
      })) as ITenantRecord[];
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
    const cnpj = tenant.cnpj || (tenant as any).cnpj || existingConfigs?.cnpj || '';
    const nomeResponsavel = tenant.nome_responsavel || (tenant as any).nomeResponsavel || existingConfigs?.nome_responsavel || '';
    const email = tenant.email || (tenant as any).email || existingConfigs?.email || '';
    const identificacaoEntidade = tenant.identificacao_entidade || email || cnpj || (tenant.nome ? tenant.nome.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : 'entidade_padrao');
    const apiToken = existingConfigs?.api_token || `mw_agt_${identificacaoEntidade.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}_${Math.random().toString(36).substring(2, 10)}`;

    const basePayload: any = {
      nome: tenant.nome,
      identificacao_entidade: identificacaoEntidade,
      usar_catalogo_proprio: isCustomCatalog,
      ativo: tenant.ativo !== undefined ? tenant.ativo : true,
      configuracoes: {
        ...existingConfigs,
        api_token: apiToken,
        usar_catalogo_proprio: isCustomCatalog,
        cnpj,
        nome_responsavel: nomeResponsavel,
        email
      }
    };

    if (tenant.id && typeof tenant.id === 'string' && tenant.id.includes('-') && tenant.id.length >= 30) {
      basePayload.id = tenant.id;
    }

    try {
      // 1. Tenta salvar incluindo as novas colunas dedicadas (cnpj, nome_responsavel, email)
      const fullPayload = {
        ...basePayload,
        ...(cnpj ? { cnpj } : {}),
        ...(nomeResponsavel ? { nome_responsavel: nomeResponsavel } : {}),
        ...(email ? { email } : {})
      };

      const { data, error } = await supabaseBrowser
        .from('tenants')
        .upsert(fullPayload, { onConflict: basePayload.id ? 'id' : 'identificacao_entidade' })
        .select('*')
        .single();

      if (!error && data) {
        return {
          ...data,
          cnpj: data.cnpj || data.configuracoes?.cnpj || cnpj,
          nome_responsavel: data.nome_responsavel || data.configuracoes?.nome_responsavel || nomeResponsavel,
          email: data.email || data.configuracoes?.email || email
        } as ITenantRecord;
      }

      // 2. Fallback caso as novas colunas ainda não tenham sido criadas no banco (ficam salvas em configuracoes JSONB)
      const { data: fallbackData, error: fallbackError } = await supabaseBrowser
        .from('tenants')
        .upsert(basePayload, { onConflict: basePayload.id ? 'id' : 'identificacao_entidade' })
        .select('*')
        .single();

      if (fallbackError) {
        console.warn('[TenantService] Erro ao salvar tenant no Supabase:', fallbackError);
        return null;
      }

      return {
        ...fallbackData,
        cnpj: fallbackData.cnpj || fallbackData.configuracoes?.cnpj || cnpj,
        nome_responsavel: fallbackData.nome_responsavel || fallbackData.configuracoes?.nome_responsavel || nomeResponsavel,
        email: fallbackData.email || fallbackData.configuracoes?.email || email
      } as ITenantRecord;
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
