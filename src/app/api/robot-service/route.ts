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
    const { acao, tenantId, pastaRaiz } = body;

    const baseDir = pastaRaiz || 'C:\\MidwayLab';

    if (acao === 'iniciar') {
      // Se informou tenantId, sincroniza as pastas do tenant
      if (tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('configuracoes')
          .eq('id', tenantId)
          .single();

        const equipPastas = tenant?.configuracoes?.equipamentos_pastas;
        if (equipPastas) {
          const primeiroModelo = Object.keys(equipPastas)[0];
          if (primeiroModelo) {
            const p = equipPastas[primeiroModelo];
            FolderWatcherService.atualizarConfiguracao({
              diretorioEntrada: p.diretorio_entrada || path.join(baseDir, 'Labfacil', primeiroModelo, 'Entrada'),
              diretorioProcessados: p.diretorio_processados || path.join(baseDir, 'Labfacil', primeiroModelo, 'Processados'),
              diretorioErros: p.diretorio_erros || path.join(baseDir, 'Labfacil', primeiroModelo, 'Erros'),
              equipamentoDestino: primeiroModelo,
              tenantId: tenantId,
              ativo: true
            });
          }
        }
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
      // Gera o arquivo .bat no disco local C:\MidwayLab
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      const batPath = path.join(baseDir, 'INICIAR_ROBO_MIDWAY.bat');
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
        `curl -X POST http://localhost:3000/api/robot-service -H "Content-Type: application/json" -d "{\\"acao\\":\\"iniciar\\",\\"tenantId\\":\\"${tenantId || ''}\\"}"`,
        'echo.',
        'echo [OK] Robo ativado em segundo plano com sucesso!',
        'timeout /t 5 >nul',
        'exit'
      ].join('\r\n');

      fs.writeFileSync(batPath, batContent, 'utf8');

      // Tenta copiar também para a pasta de Inicializar (Startup) do Windows do usuário
      let startupPathCriado = false;
      try {
        const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
        const startupDir = path.join(userProfile, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
        if (fs.existsSync(startupDir)) {
          const startupBat = path.join(startupDir, 'MidwayLab_Robo_Startup.bat');
          fs.writeFileSync(startupBat, batContent, 'utf8');
          startupPathCriado = true;
        }
      } catch (_) {}

      return NextResponse.json({
        success: true,
        batPath,
        autoStartupWindows: startupPathCriado,
        message: `Script de inicialização gerado com sucesso em ${batPath}${startupPathCriado ? ' e configurado no Inicializar do Windows!' : ''}`
      });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida' }, { status: 400 });
  } catch (error: any) {
    console.error('[API robot-service] Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
