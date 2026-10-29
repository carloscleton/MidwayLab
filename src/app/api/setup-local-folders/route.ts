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

    // 5. Cria a pasta do Robô (C:\MidwayLab\Robo) e coloca os arquivos de execução dentro
    const dirRobo = path.join(baseDir, 'Robo');
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    const appUrl = `${protocol}://${host}`;
    const agentToken = existingConfigs.api_token || '';
    const primeiroModelo = resultados[0]?.modelo || 'SYSMEX_UF_1500';

    try {
      if (!fs.existsSync(dirRobo)) {
        fs.mkdirSync(dirRobo, { recursive: true });
      }

      // 5.1 Arquivo .env
      const envPath = path.join(dirRobo, '.env');
      const envContent = [
        '# =====================================================================',
        '# MIDWAYLAB - CONFIGURACAO AUTOMATICA DO ROBO AGENTE',
        '# =====================================================================',
        `MIDWAY_API_URL=${appUrl}`,
        `MIDWAY_AGENT_TOKEN=${agentToken}`,
        `EQUIPAMENTO=${primeiroModelo}`,
        `PASTA_RAIZ=${baseDir}`,
        ''
      ].join('\r\n');
      fs.writeFileSync(envPath, envContent, 'utf8');

      // 5.2 Copia / grava os scripts do robô na pasta C:\MidwayLab\Robo
      const srcTrayPs1 = path.join(process.cwd(), 'midwaylab-robo-tray.ps1');
      const dstTrayPs1 = path.join(dirRobo, 'midwaylab-robo-tray.ps1');
      if (fs.existsSync(srcTrayPs1)) {
        fs.copyFileSync(srcTrayPs1, dstTrayPs1);
      }

      const dstTrayBat = path.join(dirRobo, 'iniciar-robo-tray.bat');
      const trayBatContent = [
        '@echo off',
        'title MidwayLab - Agente de Bandeja',
        'cd /d "%~dp0"',
        'powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0midwaylab-robo-tray.ps1"',
        'exit'
      ].join('\r\n');
      fs.writeFileSync(dstTrayBat, trayBatContent, 'utf8');

      // 5.3 Atalho para iniciar com o Windows
      try {
        const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
        const startupDir = path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
        if (fs.existsSync(startupDir)) {
          const startupBat = path.join(startupDir, 'MidwayLab_Robo.bat');
          const startupCmd = [
            '@echo off',
            `start "" "${dstTrayBat}"`,
            'exit'
          ].join('\r\n');
          fs.writeFileSync(startupBat, startupCmd, 'utf8');
        }
      } catch (_) {}

    } catch (roboErr: any) {
      console.warn('[API setup-local-folders] Aviso ao preparar pasta Robo:', roboErr.message);
    }

    // 5.4 Cria arquivo README de instruções na raiz C:\MidwayLab se o disco permitir
    try {
      const readmePath = path.join(baseDir, 'COMO_FUNCIONA_O_ROBO_MIDWAY.txt');
      const readmeContent = [
        '========================================================================',
        '              MIDWAY LAB - ESTRUTURA DE PASTAS E ROBÔ                   ',
        '========================================================================',
        `Data da Instalação: ${new Date().toLocaleString('pt-BR')}`,
        `Pasta Raiz: ${baseDir}`,
        `Pasta do Robô: ${dirRobo}`,
        `Empresa: ${tenantId}`,
        '',
        'PASTA DO ROBÔ (EXECUÇÃO 24H JUNTO AO RELÓGIO):',
        `-> ${dirRobo}\\iniciar-robo-tray.bat`,
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

    // 6. Monta script Batch para execução no Windows (instalador de 1 clique)
    const batCommands: string[] = [
      '@echo off',
      'title MIDWAY LAB - INSTALADOR DE PASTAS E ROBO DE BANDEJA',
      'color 0A',
      'echo ========================================================',
      'echo     MIDWAY LAB - INSTALADOR DE PASTAS E ROBO 24 HORAS   ',
      'echo ========================================================',
      'echo.',
      `echo [1/3] Criando a estrutura oficial de pastas em ${baseDir}...`,
      'echo.'
    ];

    for (const r of resultados) {
      batCommands.push(`if not exist "${r.diretorioEntrada}" mkdir "${r.diretorioEntrada}"`);
      batCommands.push(`if not exist "${r.diretorioProcessados}" mkdir "${r.diretorioProcessados}"`);
      batCommands.push(`if not exist "${r.diretorioErros}" mkdir "${r.diretorioErros}"`);
      batCommands.push(`if not exist "${r.diretorioCarga}" mkdir "${r.diretorioCarga}"`);
      batCommands.push(`if not exist "${r.diretorioResultados}" mkdir "${r.diretorioResultados}"`);
    }

    batCommands.push(`if not exist "${dirRobo}" mkdir "${dirRobo}"`);
    batCommands.push('echo.');
    batCommands.push('echo [2/3] Configurando o Robo do MidwayLab com Token de seguranca...');
    batCommands.push(`(echo MIDWAY_API_URL=${appUrl}& echo MIDWAY_AGENT_TOKEN=${agentToken}& echo EQUIPAMENTO=${primeiroModelo}& echo PASTA_RAIZ=${baseDir}) > "${path.join(dirRobo, '.env')}"`);
    batCommands.push(`(echo @echo off & echo title MidwayLab - Agente de Bandeja & echo cd /d "%%~dp0" & echo powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%%~dp0midwaylab-robo-tray.ps1" & echo exit) > "${path.join(dirRobo, 'iniciar-robo-tray.bat')}"`);
    batCommands.push(`powershell -Command "try { Invoke-WebRequest -Uri '${appUrl}/midwaylab-robo-tray.ps1' -OutFile '${path.join(dirRobo, 'midwaylab-robo-tray.ps1')}' } catch {}"`);
    batCommands.push('echo.');
    batCommands.push('echo [3/3] Configurando inicializacao automatica com o Windows...');
    batCommands.push(`set STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup`);
    batCommands.push(`(echo @echo off & echo start "" "${path.join(dirRobo, 'iniciar-robo-tray.bat')}" & echo exit) > "%STARTUP_DIR%\\MidwayLab_Robo.bat"`);
    batCommands.push('echo.');
    batCommands.push(`echo [OK] Instalacao concluida! Iniciando o robo na bandeja do relogio...`);
    batCommands.push(`start "" "${path.join(dirRobo, 'iniciar-robo-tray.bat')}"`);
    batCommands.push('timeout /t 3 >nul');
    batCommands.push('exit');

    const batScript = batCommands.join('\r\n');
    const todasCriadasNoDisco = resultados.every(r => r.permissoesOk);

    return NextResponse.json({
      success: true,
      pastaRaiz: baseDir,
      totalEquipamentos: resultados.length,
      resultados,
      todasCriadasNoDisco,
      batScript,
      message: todasCriadasNoDisco
        ? `Estrutura de pastas criada com sucesso em ${baseDir}!`
        : `Configurações salvas! Baixe e execute o script gerador para criar as pastas no Windows.`
    });
  } catch (error: any) {
    console.error('[API setup-local-folders] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro inesperado ao criar pastas locais' },
      { status: 500 }
    );
  }
}
