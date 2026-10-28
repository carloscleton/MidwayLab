import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { FolderWatcherService } from '../../../services/folder-watcher-service';
import { supabase } from '../../../db/supabase';

export async function GET() {
  try {
    const status = FolderWatcherService.obterStatus();
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acao, tenantId, pastaRaiz, modelo, equipamentoDestino } = body;

    const baseDir = pastaRaiz || 'C:\\MidwayLab';

    if (acao === 'iniciar') {
      let modeloEscolhido = (modelo || equipamentoDestino || '').trim();

      // Se informou tenantId, sincroniza as configurações do tenant
      if (tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('configuracoes')
          .eq('id', tenantId)
          .single();

        const equipPastas = tenant?.configuracoes?.equipamentos_pastas;
        if (!modeloEscolhido && equipPastas) {
          modeloEscolhido = Object.keys(equipPastas)[0] || '';
        }

        if (!modeloEscolhido) {
          modeloEscolhido = 'SYSMEX_UF_1500';
        }

        const p = equipPastas?.[modeloEscolhido] || {};
        FolderWatcherService.atualizarConfiguracao({
          diretorioEntrada: p.diretorio_entrada || path.join(baseDir, 'Labfacil', modeloEscolhido, 'Entrada'),
          diretorioProcessados: p.diretorio_processados || path.join(baseDir, 'Labfacil', modeloEscolhido, 'Processados'),
          diretorioErros: p.diretorio_erros || path.join(baseDir, 'Labfacil', modeloEscolhido, 'Erros'),
          diretorioCarga: p.diretorio_carga || path.join(baseDir, 'Equipamentos', modeloEscolhido, 'Carga'),
          diretorioResultados: p.diretorio_resultados || path.join(baseDir, 'Equipamentos', modeloEscolhido, 'Resultados'),
          equipamentoDestino: modeloEscolhido,
          tenantId: tenantId,
          ativo: true
        });
      } else {
        if (!modeloEscolhido) modeloEscolhido = 'SYSMEX_UF_1500';
        FolderWatcherService.atualizarConfiguracao({
          diretorioEntrada: path.join(baseDir, 'Labfacil', modeloEscolhido, 'Entrada'),
          diretorioProcessados: path.join(baseDir, 'Labfacil', modeloEscolhido, 'Processados'),
          diretorioErros: path.join(baseDir, 'Labfacil', modeloEscolhido, 'Erros'),
          diretorioCarga: path.join(baseDir, 'Equipamentos', modeloEscolhido, 'Carga'),
          diretorioResultados: path.join(baseDir, 'Equipamentos', modeloEscolhido, 'Resultados'),
          equipamentoDestino: modeloEscolhido,
          ativo: true
        });
      }
      FolderWatcherService.iniciar();
      return NextResponse.json({
        success: true,
        message: 'Robô de monitoramento iniciado em segundo plano com sucesso!',
        status: FolderWatcherService.obterStatus()
      });
    }

    if (acao === 'parar') {
      FolderWatcherService.parar();
      return NextResponse.json({
        success: true,
        message: 'Robô de monitoramento pausado.',
        status: FolderWatcherService.obterStatus()
      });
    }

    if (acao === 'varrer_agora') {
      const processados = await FolderWatcherService.executarVarredura();
      return NextResponse.json({
        success: true,
        processadosAgora: processados,
        status: FolderWatcherService.obterStatus()
      });
    }

    if (acao === 'gerar_script_windows') {
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      const appUrl = `${protocol}://${host}`;

      const batContent = [
        '@echo off',
        'title MIDWAY LAB - ROBO DE PRODUCAO 24H',
        'color 0A',
        'echo ========================================================',
        'echo        MIDWAY LAB - ROBO DE INTEGRACAO LABORATORIAL      ',
        'echo ========================================================',
        'echo Monitorando pastas de pedidos e gerando cargas 24 horas.',
        'echo Nao feche esta janela para manter a integracao ativa.',
        'echo ========================================================',
        '',
        'cd /d "%~dp0"',
        `curl -X POST ${appUrl}/api/robot-service -H "Content-Type: application/json" -d "{\\"acao\\":\\"iniciar\\",\\"tenantId\\":\\"${tenantId || ''}\\",\\"modelo\\":\\"${modelo || ''}\\"}"`,
        'echo.',
        'echo [OK] Robo ativado em segundo plano com sucesso!',
        'timeout /t 5 >nul',
        'exit'
      ].join('\r\n');

      const vbsContent = [
        'Set WshShell = CreateObject("WScript.Shell")',
        `WshShell.Run "cmd /c ""${path.join(baseDir, 'INICIAR_ROBO_MIDWAY.bat')}""", 0, False`,
        'Set WshShell = Nothing'
      ].join('\r\n');

      let gravadoNoDisco = false;
      let startupPathCriado = false;
      const batPath = path.join(baseDir, 'INICIAR_ROBO_MIDWAY.bat');

      // Tenta gravar no disco local se o ambiente permitir (ex: máquina local com Node.js)
      try {
        if (!fs.existsSync(baseDir)) {
          fs.mkdirSync(baseDir, { recursive: true });
        }
        fs.writeFileSync(batPath, batContent, 'utf8');
        gravadoNoDisco = true;

        // Tenta copiar também para a pasta de Inicializar (Startup) do Windows do usuário
        try {
          const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
          const startupDir = path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
          if (fs.existsSync(startupDir)) {
            const startupBat = path.join(startupDir, 'MidwayLab_Robo_Startup.bat');
            fs.writeFileSync(startupBat, batContent, 'utf8');
            startupPathCriado = true;
          }
        } catch (_) {}
      } catch (diskErr) {
        // Ambiente serverless / nuvem (ex: Vercel): filesystem C: não existe no servidor
        console.warn('[API robot-service] Disco local C: não disponível no servidor:', diskErr);
      }

      return NextResponse.json({
        success: true,
        gravadoNoDisco,
        batPath,
        batContent,
        vbsContent,
        autoStartupWindows: startupPathCriado,
        message: gravadoNoDisco
          ? `Script de inicialização gerado com sucesso em ${batPath}${startupPathCriado ? ' e configurado no Inicializar do Windows!' : ''}`
          : `Script de inicialização gerado para download direto no seu Windows!`
      });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API robot-service] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
