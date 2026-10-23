import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { supabase } from '../../../db/supabase';

export interface IPastaCriadaInfo {
  equipamentoId: string;
  equipamentoNome: string;
  modelo: string;
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  diretorioCarga: string;
  diretorioResultados: string;
  permissoesOk: boolean;
  erroPermissao?: string;
}

function testarPermissaoEscrita(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const testFile = path.join(dirPath, `.perm_test_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'MIDWAY_PERM_TEST_OK', 'utf8');
    fs.unlinkSync(testFile);
    return true;
  } catch (err) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, equipamentos, pastaRaiz } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    const baseDir = (pastaRaiz && pastaRaiz.trim().length > 0)
      ? pastaRaiz.trim()
      : 'C:\\MidwayLab';

    // Se não passou equipamentos, busca no banco
    let listaEquips = equipamentos;
    if (!listaEquips || !Array.isArray(listaEquips) || listaEquips.length === 0) {
      const { data: dbEquips, error: eqErr } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('tenant_id', tenantId);

      if (eqErr || !dbEquips || dbEquips.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Nenhum equipamento cadastrado para esta empresa.' },
          { status: 400 }
        );
      }
      listaEquips = dbEquips;
    }

    const resultados: IPastaCriadaInfo[] = [];

    // 1. Busca configurações atuais do tenant para atualizar
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('configuracoes')
      .eq('id', tenantId)
      .single();

    const existingConfigs = tenantData?.configuracoes || {};
    const existingEquipPastas = existingConfigs.equipamentos_pastas || {};
    const updatedEquipPastas = { ...existingEquipPastas };

    for (const eq of listaEquips) {
      const sanitizedName = String(eq.modelo || eq.nome || 'EQUIP')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toUpperCase();

      const dirEntrada = path.join(baseDir, 'Labfacil', sanitizedName, 'Entrada');
      const dirProcessados = path.join(baseDir, 'Labfacil', sanitizedName, 'Processados');
      const dirErros = path.join(baseDir, 'Labfacil', sanitizedName, 'Erros');
      const dirCarga = path.join(baseDir, 'Equipamentos', sanitizedName, 'Carga');
      const dirResultados = path.join(baseDir, 'Equipamentos', sanitizedName, 'Resultados');

      // Criação física e validação de permissão de escrita
      const okEntrada = testarPermissaoEscrita(dirEntrada);
      const okProcessados = testarPermissaoEscrita(dirProcessados);
      const okErros = testarPermissaoEscrita(dirErros);
      const okCarga = testarPermissaoEscrita(dirCarga);
      const okResultados = testarPermissaoEscrita(dirResultados);

      const todasOk = okEntrada && okProcessados && okErros && okCarga && okResultados;

      // 2. Atualiza na tabela equipamentos
      if (eq.id && eq.id.length > 20) {
        await supabase
          .from('equipamentos')
          .update({
            diretorio_carga: dirCarga,
            diretorio_resultados: dirResultados
          })
          .eq('id', eq.id);
      }

      // 3. Atualiza mapa do tenant
      const modeloKey = (eq.modelo || sanitizedName).toUpperCase().trim();
      updatedEquipPastas[modeloKey] = {
        ...(updatedEquipPastas[modeloKey] || {}),
        diretorio_entrada: dirEntrada,
        diretorio_processados: dirProcessados,
        diretorio_erros: dirErros,
        diretorio_carga: dirCarga,
        diretorio_resultados: dirResultados,
        equipamento_destino: modeloKey,
        monitor_ativo: true,
        atualizado_em: new Date().toISOString()
      };

      resultados.push({
        equipamentoId: eq.id,
        equipamentoNome: eq.nome,
        modelo: eq.modelo,
        diretorioEntrada: dirEntrada,
        diretorioProcessados: dirProcessados,
        diretorioErros: dirErros,
        diretorioCarga: dirCarga,
        diretorioResultados: dirResultados,
        permissoesOk: todasOk,
        erroPermissao: todasOk ? undefined : 'Falha de permissão no Windows em uma das pastas.'
      });
    }

    // 4. Salva a configuração atualizada no tenant
    await supabase
      .from('tenants')
      .update({
        configuracoes: {
          ...existingConfigs,
          equipamentos_pastas: updatedEquipPastas,
          pasta_raiz_instalacao: baseDir,
          instalacao_local: {
            instalado_em: new Date().toISOString(),
            pasta_raiz: baseDir,
            usuario_instalador: 'carloscleton',
            total_equipamentos: listaEquips.length
          }
        }
      })
      .eq('id', tenantId);

    // 5. Cria arquivo README de instruções na raiz C:\MidwayLab
    try {
      const readmePath = path.join(baseDir, 'COMO_FUNCIONA_O_ROBO_MIDWAY.txt');
      const readmeContent = [
        '========================================================================',
        '              MIDWAY LAB - ESTRUTURA DE PASTAS E ROBÔ                   ',
        '========================================================================',
        `Data da Instalação: ${new Date().toLocaleString('pt-BR')}`,
        `Pasta Raiz: ${baseDir}`,
        `Empresa: ${tenantId}`,
        '',
        'COMO FUNCIONA O FLUXO DE PEDIDOS:',
        '1. O sistema Labfácil grava os arquivos XML ou JSON na pasta:',
        '   -> C:\\MidwayLab\\Labfacil\\[MODELO]\\Entrada',
        '',
        '2. O Robô Midway detecta o novo arquivo instantaneamente.',
        '   - Faz o mapeamento DE-PARA dos exames cadastrados no sistema.',
        '   - Gera o arquivo no padrão do analisador (ASTM, HL7, JSON) em:',
        '   -> C:\\MidwayLab\\Equipamentos\\[MODELO]\\Carga',
        '',
        '3. O arquivo original é movido com segurança para:',
        '   -> C:\\MidwayLab\\Labfacil\\[MODELO]\\Processados',
        '',
        '4. Caso ocorra alguma inconsistência, é movido para:',
        '   -> C:\\MidwayLab\\Labfacil\\[MODELO]\\Erros',
        '========================================================================'
      ].join('\r\n');
      fs.writeFileSync(readmePath, readmeContent, 'utf8');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      pastaRaiz: baseDir,
      totalEquipamentos: resultados.length,
      resultados,
      message: `Estrutura de pastas criada com sucesso em ${baseDir}!`
    });
  } catch (error: any) {
    console.error('[API setup-local-folders] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro inesperado ao criar pastas locais' },
      { status: 500 }
    );
  }
}
