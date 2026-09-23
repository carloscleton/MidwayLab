import { supabaseBrowser } from '../lib/supabase-client';
import { IUsuarioRecord } from '../db/supabase';

export interface ISolicitacaoAcessoRecord {
  id?: string;
  nome_lab: string;
  nome_responsavel: string;
  email: string;
  cnpj: string;
  status?: string;
  created_at?: string;
}

export class UserService {
  /**
   * Autentica um usuário usando o Supabase Auth NATIVO (auth.users)
   */
  static async autenticar(email: string, senha: string): Promise<IUsuarioRecord | null> {
    try {
      // 1. Tenta login no Supabase Auth Nativo (auth.users)
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (!authError && authData.user) {
        const meta = authData.user.user_metadata || {};
        return {
          id: authData.user.id,
          nome: meta.nome || authData.user.email?.split('@')[0] || 'Usuário Supabase',
          email: authData.user.email || email,
          role: meta.role === 'admin' || email.toLowerCase() === 'carloscleton.nat@gmail.com' ? 'admin' : 'tenant',
          tenant_id: meta.tenant_id || null,
          status: 'ativo'
        };
      }

      // 2. Fallback: Tabela public.usuarios
      const { data, error } = await supabaseBrowser
        .from('usuarios')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('senha', senha)
        .eq('status', 'ativo')
        .single();

      if (error || !data) {
        return null;
      }

      return data as IUsuarioRecord;
    } catch (err) {
      console.error('[UserService] Erro ao autenticar:', err);
      return null;
    }
  }

  /**
   * Criar novo usuário no Supabase Auth NATIVO (auth.users) e no public.usuarios
   */
  static async criarUsuarioNatito(nome: string, email: string, senha: string, role: 'admin' | 'tenant', tenantId?: string): Promise<void> {
    try {
      // Cria no Supabase Auth Nativo (auth.users)
      const { data, error } = await supabaseBrowser.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        options: {
          data: {
            nome,
            role,
            tenant_id: tenantId || null
          }
        }
      });

      if (error) {
        console.warn('[UserService] Aviso ao criar usuario no Supabase Auth:', error.message);
      }

      // Insere também em public.usuarios para garantir compatibilidade
      await supabaseBrowser.from('usuarios').upsert({
        id: data.user?.id || undefined,
        nome,
        email: email.trim().toLowerCase(),
        senha,
        role,
        tenant_id: tenantId || null,
        status: 'ativo'
      }, { onConflict: 'email' });
    } catch (err) {
      console.error('[UserService] Erro ao criar usuario nativo:', err);
    }
  }

  /**
   * Lista todos os usuários cadastrados no Supabase
   */
  static async listarUsuarios(): Promise<IUsuarioRecord[]> {
    try {
      const { data, error } = await supabaseBrowser
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data as IUsuarioRecord[];
    } catch (err) {
      console.error('[UserService] Erro ao listar usuarios:', err);
      return [];
    }
  }

  /**
   * Envia uma nova solicitação de acesso para a tabela solicitacoes_acesso
   */
  static async solicitarAcesso(solicitacao: ISolicitacaoAcessoRecord): Promise<void> {
    const { error } = await supabaseBrowser
      .from('solicitacoes_acesso')
      .insert({
        nome_lab: solicitacao.nome_lab,
        nome_responsavel: solicitacao.nome_responsavel,
        email: solicitacao.email.toLowerCase().trim(),
        cnpj: solicitacao.cnpj,
        status: 'PENDENTE'
      });

    if (error) {
      console.error('[UserService] Erro ao solicitar acesso:', error);
      throw error;
    }
  }

  /**
   * Lista solicitações de acesso pendentes
   */
  static async listarSolicitacoesPendentes(): Promise<ISolicitacaoAcessoRecord[]> {
    try {
      const { data, error } = await supabaseBrowser
        .from('solicitacoes_acesso')
        .select('*')
        .eq('status', 'PENDENTE')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as ISolicitacaoAcessoRecord[];
    } catch (err) {
      console.error('[UserService] Erro ao listar solicitacoes:', err);
      return [];
    }
  }
}
