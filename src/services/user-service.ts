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
   * Autentica um usuário contra a tabela public.usuarios no Supabase
   */
  static async autenticar(email: string, senha: string): Promise<IUsuarioRecord | null> {
    try {
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
