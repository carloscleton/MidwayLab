import { NextResponse } from 'next/server';
import { FolderWatcherService } from '../../../services/folder-watcher-service';

export async function GET() {
  try {
    const status = FolderWatcherService.obterStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { acao, config } = body;

    if (config) {
      FolderWatcherService.atualizarConfiguracao(config);
    }

    if (acao === 'iniciar') {
      FolderWatcherService.iniciar();
    } else if (acao === 'parar') {
      FolderWatcherService.parar();
    } else if (acao === 'varrer_agora') {
      const processados = await FolderWatcherService.executarVarredura();
      return NextResponse.json({
        ...FolderWatcherService.obterStatus(),
        processadosAgora: processados,
      });
    }

    return NextResponse.json(FolderWatcherService.obterStatus());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
