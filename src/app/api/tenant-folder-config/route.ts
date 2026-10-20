import { NextResponse } from 'next/server';
import { supabase } from '../../../db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, configIngestao } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    if (!configIngestao || typeof configIngestao !== 'object') {
      return NextResponse.json(
        { success: false, error: 'configIngestao é obrigatório e deve ser um objeto' },
        { status: 400 }
      );
    }

    // 1. Busca configurações atuais do tenant diretamente no Supabase com Service Role Key
    const { data: tenant, error: fetchErr } = await supabase
      .from('tenants')
      .select('configuracoes')
      .eq('id', tenantId)
      .single();

    if (fetchErr) {
      console.error('[API tenant-folder-config] Erro ao buscar tenant:', fetchErr);
      return NextResponse.json(
        { success: false, error: `Tenant não encontrado: ${fetchErr.message}` },
        { status: 404 }
      );
    }

    const existingConfigs = tenant?.configuracoes || {};
    const updatedConfigs = {
      ...existingConfigs,
      ingestao_pastas: {
        ...(existingConfigs.ingestao_pastas || {}),
        ...configIngestao,
        atualizado_em: new Date().toISOString()
      }
    };

    // 2. Atualiza JSONB no Supabase com Service Role (Bypass RLS garantido)
    const { error: updateErr } = await supabase
      .from('tenants')
      .update({ configuracoes: updatedConfigs })
      .eq('id', tenantId);

    if (updateErr) {
      console.error('[API tenant-folder-config] Erro ao atualizar configuracoes:', updateErr);
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configuracoes: updatedConfigs,
      message: 'Configurações de pastas salvas com sucesso no banco de dados!'
    });
  } catch (error: any) {
    console.error('[API tenant-folder-config] Erro inesperado:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
