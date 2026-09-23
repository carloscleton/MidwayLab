import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://iibwbufbshqiaeorwoja.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYndidWZic2hxaWFlb3J3b2phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4ODkyOSwiZXhwIjoyMTA1NjY0OTI5fQ.ATJTk9yL22oU2953OB0I956RlxUu2AtW5tdotehyhj0';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface ITenantRecord {
  id: string;
  nome: string;
  codigo_entidade: string;
  identificacao_entidade: string;
  senha_ws: string;
  softlab_base_url: string;
  softlab_login: string;
  softlab_senha: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IDeparaExameRecord {
  id?: string;
  tenant_id: string;
  codigo_autolac: string;
  descricao_autolac?: string;
  codigo_softlab: string;
  descricao_softlab?: string;
  tipo_resultado?: string;
}

export interface IPedidoRecord {
  id?: string;
  tenant_id: string;
  codigo_lote_autolac?: string;
  local_autolac: string;
  protocolo_autolac: string;
  numero_solicitacao?: string;
  codigo_pedido_softlab?: string;
  paciente_nome?: string;
  paciente_cpf?: string;
  status: string;
  mensagem_erro?: string;
  payload_autolac_xml?: string;
  payload_softlab_json?: string;
}

export interface IUsuarioRecord {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  role: 'admin' | 'tenant';
  tenant_id?: string | null;
  status: 'ativo' | 'pendente' | 'bloqueado';
  created_at?: string;
}

