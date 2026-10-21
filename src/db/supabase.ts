import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://iibwbufbshqiaeorwoja.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYndidWZic2hxaWFlb3J3b2phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4ODkyOSwiZXhwIjoyMTA1NjY0OTI5fQ.ATJTk9yL22oU2953OB0I956RlxUu2AtW5tdotehyhj0';

const isConfigured = Boolean(supabaseUrl && !supabaseUrl.includes('seu-projeto') && !supabaseUrl.includes('iibwbufbshpiaeonwoja'));

function createDummySupabaseClient(): any {
  const createChainable = (): any => {
    const fn: any = function () {
      return createChainable();
    };

    fn.then = function (onFulfilled: any) {
      return Promise.resolve({ data: [], error: null, count: 0 }).then(onFulfilled);
    };

    return new Proxy(fn, {
      get(target, prop) {
        if (prop === 'then') return target.then;
        return createChainable();
      }
    });
  };

  return createChainable();
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        storageKey: 'midway_server_auth',
      },
    })
  : createDummySupabaseClient();

export interface ITenantRecord {
  id: string;
  nome: string;
  codigo_entidade: string;
  identificacao_entidade: string;
  configuracoes?: {
    autolac?: {
      ws_url?: string;
      identificacao_entidade?: string;
      senha_ws?: string;
    };
    labfacil?: {
      base_url?: string;
      login?: string;
      senha?: string;
    };
    softlab?: {
      base_url?: string;
      login?: string;
      senha?: string;
    };
    [key: string]: any;
  };
  senha_ws?: string;
  ws_url?: string;
  labfacil_base_url?: string;
  labfacil_login?: string;
  labfacil_senha?: string;
  softlab_base_url?: string;
  softlab_login?: string;
  softlab_senha?: string;
  usar_catalogo_proprio?: boolean;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IEquipamentoRecord {
  id?: string;
  tenant_id: string;
  nome: string;               // Ex: "Bioquímica Central", "Hematologia Bancada"
  modelo: string;             // Ex: "CB350", "YUMIZEN", "HORIBA_YUMIZEN", "GENERICO"
  codigo_identificador?: string; // Ex: "CB350-01"
  fabricante?: string;        // Ex: "Cormay", "Horiba"
  formato_arquivo?: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV';
  tipo_comunicacao?: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' | 'API';
  ip_host?: string;
  porta?: number;
  diretorio_carga?: string;   // Pasta de entrada onde o equipamento lê JSON/XML/ASTM
  diretorio_resultados?: string; // Pasta onde o equipamento cospe resultados
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IDeparaExameRecord {
  id?: string;
  tenant_id: string;
  equipamento_id?: string | null;
  codigo_autolac?: string;
  descricao_autolac?: string;
  codigo_labfacil: string;
  descricao_labfacil?: string;
  codigo_softlab?: string;     // alias de compatibilidade
  descricao_softlab?: string;  // alias de compatibilidade
  codigo_equipamento?: string; // Código correspondente no analisador (CB350 / Yumizen)
  canal_equipamento?: string;  // Canal/parâmetro no analisador
  tipo_resultado?: string;
}

export interface ICatalogoLabfacilRecord {
  id?: string;
  tenant_id?: string | null;
  codigo: string;
  descricao: string;
  abreviacao?: string;
  tipo_resultado?: string;
  updated_at?: string;
}

// Alias legado de compatibilidade
export type ICatalogoSoftlabRecord = ICatalogoLabfacilRecord;

export interface ICatalogoAutolacRecord {
  id?: string;
  codigo: string;
  nome: string;
  tenant_id?: string | null;
}

export interface IPedidoRecord {
  id?: string;
  tenant_id: string;
  equipamento_id?: string | null;
  codigo_lote_autolac?: string;
  local_autolac?: string;
  protocolo_autolac?: string;
  numero_solicitacao?: string;
  codigo_pedido_labfacil?: string;
  codigo_pedido_softlab?: string; // alias
  paciente_nome?: string;
  paciente_cpf?: string;
  paciente_sexo?: string;
  paciente_nascimento?: string;
  origem_arquivo?: 'LABFACIL_JSON' | 'LABFACIL_XML' | 'AUTOLAC_SOAP' | 'MANUAL';
  status: string;
  mensagem_erro?: string;
  payload_autolac_xml?: string;
  payload_labfacil_json?: string;
  payload_softlab_json?: string; // alias
  arquivo_nome?: string;
  created_at?: string;
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
