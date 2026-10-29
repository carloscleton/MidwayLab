import { supabaseBrowser } from '../lib/supabase-client';
import { IUsuarioRecord } from '../db/supabase';

export interface ISolicitacaoAcessoRecord {
  id?: string;
  nome_lab: string;
  nome_responsavel: string;
  email: string;
  cnpj: string;
  senha?: string;
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
    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Cria ou sincroniza no Supabase Auth Nativo (auth.users)
      let authUserId: string | undefined = undefined;
      try {
        const { data, error } = await supabaseBrowser.auth.signUp({
          email: cleanEmail,
          password: senha,
          options: {
            data: {
              nome,
              role,
              tenant_id: tenantId || null
            }
          }
        });
        if (data?.user?.id) {
          authUserId = data.user.id;
        }
        if (error) {
          console.warn('[UserService] Aviso Supabase Auth signUp:', error.message);
        }
      } catch (authErr) {
        console.warn('[UserService] Erro auth signUp:', authErr);
      }

      // 2. Insere/atualiza em public.usuarios com status 'ativo'
      const userPayload: any = {
        nome,
        email: cleanEmail,
        senha,
        role,
        tenant_id: tenantId || null,
        status: 'ativo'
      };

      if (authUserId) {
        userPayload.id = authUserId;
      }

      const { error: upsertErr } = await supabaseBrowser
        .from('usuarios')
        .upsert(userPayload, { onConflict: 'email' });

      if (upsertErr) {
        console.error('[UserService] Erro ao gravar usuário em public.usuarios:', upsertErr);
      }
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
   * Envia uma nova solicitação de acesso para a tabela solicitacoes_acesso e armazena credenciais
   */
  static async solicitarAcesso(solicitacao: ISolicitacaoAcessoRecord): Promise<ISolicitacaoAcessoRecord | null> {
    const cleanEmail = solicitacao.email.toLowerCase().trim();
    const cnpjComSenha = solicitacao.senha 
      ? `${solicitacao.cnpj || ''}:::${solicitacao.senha}`
      : (solicitacao.cnpj || '');

    // 1. Limpa solicitação anterior para o mesmo e-mail (caso exista)
    try {
      await supabaseBrowser.from('solicitacoes_acesso').delete().eq('email', cleanEmail);
    } catch (delErr) {
      console.warn('[UserService] Aviso ao limpar anterior:', delErr);
    }

    // 2. Insere na tabela solicitacoes_acesso
    const { data, error } = await supabaseBrowser
      .from('solicitacoes_acesso')
      .insert({
        nome_lab: solicitacao.nome_lab,
        nome_responsavel: solicitacao.nome_responsavel,
        email: cleanEmail,
        cnpj: cnpjComSenha,
        status: 'PENDENTE'
      })
      .select()
      .single();

    if (error) {
      console.error('[UserService] Erro ao solicitar acesso:', error);
      throw error;
    }

    // 3. Cria/atualiza o usuário com status 'pendente' na tabela public.usuarios para garantir persistência da senha
    try {
      await supabaseBrowser.from('usuarios').upsert({
        nome: solicitacao.nome_responsavel,
        email: cleanEmail,
        senha: solicitacao.senha || '123456',
        role: 'tenant',
        tenant_id: null,
        status: 'pendente'
      }, { onConflict: 'email' });
    } catch (userErr) {
      console.warn('[UserService] Aviso ao salvar usuário pendente:', userErr);
    }

    return {
      id: data?.id,
      nome_lab: solicitacao.nome_lab,
      nome_responsavel: solicitacao.nome_responsavel,
      email: cleanEmail,
      cnpj: solicitacao.cnpj,
      senha: solicitacao.senha,
      status: 'PENDENTE',
      created_at: data?.created_at
    };
  }

  /**
   * Lista solicitações de acesso pendentes com dados decodificados
   */
  static async listarSolicitacoesPendentes(): Promise<ISolicitacaoAcessoRecord[]> {
    try {
      const { data, error } = await supabaseBrowser
        .from('solicitacoes_acesso')
        .select('*')
        .eq('status', 'PENDENTE')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      // Carrega senhas gravadas na tabela public.usuarios como fallback
      const emails = data.map((r: any) => r.email?.toLowerCase().trim()).filter(Boolean);
      const usuariosMap = new Map<string, string>();
      if (emails.length > 0) {
        try {
          const { data: dbUsers } = await supabaseBrowser
            .from('usuarios')
            .select('email, senha')
            .in('email', emails);
          if (dbUsers) {
            dbUsers.forEach((u: any) => {
              if (u.email && u.senha) usuariosMap.set(u.email.toLowerCase().trim(), u.senha);
            });
          }
        } catch (uErr) {
          console.warn('[UserService] Aviso ao buscar senhas dos usuarios pendentes:', uErr);
        }
      }

      return data.map((r: any) => {
        const parts = (r.cnpj || '').split(':::');
        const cnpjLimpo = parts[0] || '';
        const senhaFromCnpj = parts[1] || '';
        const emailClean = (r.email || '').toLowerCase().trim();
        const senhaFinal = senhaFromCnpj || usuariosMap.get(emailClean) || '';

        return {
          id: r.id,
          nome_lab: r.nome_lab,
          nome_responsavel: r.nome_responsavel,
          email: r.email,
          cnpj: cnpjLimpo,
          senha: senhaFinal,
          status: r.status,
          created_at: r.created_at
        };
      });
    } catch (err) {
      console.error('[UserService] Erro ao listar solicitacoes:', err);
      return [];
    }
  }

  /**
   * Atualiza a solicitação para APROVADO no banco de dados
   */
  static async aprovarSolicitacao(idOuEmail: string): Promise<void> {
    try {
      const clean = idOuEmail.trim().toLowerCase();
      await supabaseBrowser
        .from('solicitacoes_acesso')
        .update({ status: 'APROVADO' })
        .or(`id.eq.${idOuEmail},email.eq.${clean}`);
    } catch (err) {
      console.error('[UserService] Erro ao aprovar solicitacao no banco:', err);
    }
  }

  /**
   * Desaprova / Rejeita uma solicitação de acesso no banco de dados
   */
  static async rejeitarSolicitacao(idOuEmail: string): Promise<void> {
    try {
      const clean = idOuEmail.trim().toLowerCase();
      await supabaseBrowser
        .from('solicitacoes_acesso')
        .update({ status: 'REJEITADO' })
        .or(`id.eq.${idOuEmail},email.eq.${clean}`);

      await supabaseBrowser
        .from('usuarios')
        .update({ status: 'desaprovado' })
        .eq('email', clean);
    } catch (err) {
      console.error('[UserService] Erro ao desaprovar solicitacao:', err);
    }
  }

  /**
   * Altera o status de acesso de um usuário (ativo, bloqueado, desaprovado)
   */
  static async alterarStatusUsuario(email: string, novoStatus: 'ativo' | 'bloqueado' | 'desaprovado'): Promise<boolean> {
    try {
      const clean = email.trim().toLowerCase();
      const { error } = await supabaseBrowser
        .from('usuarios')
        .update({ status: novoStatus })
        .eq('email', clean);

      if (error) {
        console.error('[UserService] Erro ao alterar status do usuario:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[UserService] Erro geral ao alterar status do usuario:', err);
      return false;
    }
  }

  /**
   * Atualiza a senha de um usuário no Supabase Auth NATIVO (auth.users) e no public.usuarios
   */
  static async atualizarSenha(email: string, novaSenha: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Tenta atualizar no Supabase Auth Nativo
      try {
        await supabaseBrowser.auth.updateUser({ password: novaSenha });
      } catch (authErr) {
        console.warn('[UserService] Update auth.users warning:', authErr);
      }

      // 2. Atualiza na tabela public.usuarios
      const { error } = await supabaseBrowser
        .from('usuarios')
        .update({ senha: novaSenha })
        .eq('email', cleanEmail);

      if (error) {
        console.error('[UserService] Erro ao atualizar senha em public.usuarios:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[UserService] Erro geral ao atualizar senha:', err);
      return false;
    }
  }
}
