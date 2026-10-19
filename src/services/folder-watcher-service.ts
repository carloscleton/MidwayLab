import fs from 'fs';
import path from 'path';
import { LabfacilParserService } from './labfacil-parser-service';
import { supabase } from '../db/supabase';

export interface IWatcherConfig {
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  equipamentoDestino: 'CB350' | 'YUMIZEN' | string;
  tenantId: string;
  ativo: boolean;
  intervaloMs?: number;
}

export interface IWatcherLog {
  id: string;
  timestamp: string;
  arquivo: string;
  pedidoId?: string;
  paciente?: string;
  totalExames: number;
  status: 'PROCESSADO' | 'ERRO' | 'IGNORADO';
  mensagem: string;
  caminhoCargaGerada?: string;
}

export class FolderWatcherService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static logs: IWatcherLog[] = [];
  private static config: IWatcherConfig = {
    diretorioEntrada: 'C:\\Labfacil\\Pedidos',
    diretorioProcessados: 'C:\\Labfacil\\Processados',
    diretorioErros: 'C:\\Labfacil\\Erros',
    equipamentoDestino: 'CB350',
    tenantId: '11111111-1111-1111-1111-111111111111',
    ativo: false,
    intervaloMs: 5000,
  };

  /**
   * Garante a criação de uma pasta física se ela não existir
   */
  static assegurarDiretorio(dirPath: string): boolean {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`[FolderWatcher] Diretório criado: ${dirPath}`);
      }
      return true;
    } catch (err: any) {
      console.error(`[FolderWatcher] Erro ao criar diretório ${dirPath}:`, err.message);
      return false;
    }
  }

  /**
   * Atualiza a configuração e garante as pastas
   */
  static atualizarConfiguracao(novaConfig: Partial<IWatcherConfig>): IWatcherConfig {
    this.config = { ...this.config, ...novaConfig };
    
    // Assegura criação das pastas configuradas
    if (this.config.diretorioEntrada) this.assegurarDiretorio(this.config.diretorioEntrada);
    if (this.config.diretorioProcessados) this.assegurarDiretorio(this.config.diretorioProcessados);
    if (this.config.diretorioErros) this.assegurarDiretorio(this.config.diretorioErros);

    return this.config;
  }

  static obterStatus() {
    return {
      config: this.config,
      isRunning: this.isRunning,
      logs: this.logs.slice(-50), // Últimos 50 logs
    };
  }

  /**
   * Inicia o monitoramento contínuo da pasta
   */
  static iniciar(): boolean {
    if (this.isRunning) return true;

    // Assegura que os diretórios existam
    this.assegurarDiretorio(this.config.diretorioEntrada);
    this.assegurarDiretorio(this.config.diretorioProcessados);
    this.assegurarDiretorio(this.config.diretorioErros);

    this.isRunning = true;
    this.config.ativo = true;
    console.log(`[FolderWatcher] ▶️ Monitoramento automático iniciado em: ${this.config.diretorioEntrada}`);

    const intervalo = this.config.intervaloMs || 5000;
    this.intervalId = setInterval(() => {
      this.executarVarredura().catch(err => {
        console.error('[FolderWatcher] Erro na varredura:', err);
      });
    }, intervalo);

    return true;
  }

  /**
   * Pausa o monitoramento
   */
  static parar(): boolean {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.config.ativo = false;
    console.log('[FolderWatcher] ⏸️ Monitoramento de pasta pausado.');
    return true;
  }

  /**
   * Varre a pasta de entrada, processa os arquivos XML/JSON do Labfacil e gera carga para o equipamento
   */
  static async executarVarredura(): Promise<number> {
    const inputDir = this.config.diretorioEntrada;
    if (!fs.existsSync(inputDir)) {
      return 0;
    }

    let files: string[] = [];
    try {
      files = fs.readdirSync(inputDir).filter(f => {
        const lower = f.toLowerCase();
        return (lower.endsWith('.xml') || lower.endsWith('.json')) && !lower.startsWith('tmp_');
      });
    } catch (e: any) {
      console.warn(`[FolderWatcher] Aviso ao listar pasta ${inputDir}:`, e.message);
      return 0;
    }

    if (files.length === 0) return 0;

    let processadosCount = 0;

    for (const fileName of files) {
      const fullPath = path.join(inputDir, fileName);

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (!content || content.trim().length === 0) continue;

        // Parse do arquivo do Labfacil (XML ou JSON)
        const parsedOrders = LabfacilParserService.parseFile(content, fileName);

        for (const order of parsedOrders) {
          // Geração da carga para o equipamento (CB350, Yumizen, etc)
          const result = LabfacilParserService.gerarCargaEquipamento(
            order,
            this.config.equipamentoDestino,
            new Map<string, string>() // DE-PARA dinâmico
          );

          // Determina diretório de saída do equipamento (ex: C:\Equipamentos\CB350\Carga)
          const equipDir = path.join(
            this.config.diretorioProcessados,
            'Cargas_' + this.config.equipamentoDestino
          );
          this.assegurarDiretorio(equipDir);

          const outputFilePath = path.join(equipDir, result.nomeArquivoSugerido);
          fs.writeFileSync(outputFilePath, result.conteudoArquivo, 'utf8');

          // Registra log de sucesso
          this.adicionarLog({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            arquivo: fileName,
            pedidoId: order.numeroPedido,
            paciente: order.cliente.nome,
            totalExames: order.exames.length,
            status: 'PROCESSADO',
            mensagem: `Carga ${result.formato} gerada para ${this.config.equipamentoDestino} (${result.nomeArquivoSugerido})`,
            caminhoCargaGerada: outputFilePath,
          });
        }

        // Move o arquivo original para a pasta de processados com timestamp
        const destPath = path.join(
          this.config.diretorioProcessados,
          `${path.parse(fileName).name}_${Date.now()}${path.extname(fileName)}`
        );
        fs.renameSync(fullPath, destPath);
        processadosCount++;

      } catch (err: any) {
        console.error(`[FolderWatcher] Falha ao processar ${fileName}:`, err.message);

        // Move para a pasta de erros se falhar
        try {
          const errPath = path.join(
            this.config.diretorioErros,
            `${path.parse(fileName).name}_ERRO_${Date.now()}${path.extname(fileName)}`
          );
          fs.renameSync(fullPath, errPath);
        } catch (_) {}

        this.adicionarLog({
          id: `log-err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          arquivo: fileName,
          totalExames: 0,
          status: 'ERRO',
          mensagem: `Erro de processamento: ${err.message}`,
        });
      }
    }

    return processadosCount;
  }

  private static adicionarLog(log: IWatcherLog) {
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }
}
