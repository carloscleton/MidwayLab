import fs from 'fs';
import path from 'path';
import { LabfacilParserService } from './labfacil-parser-service';
import { supabase } from '../db/supabase';

export interface IWatcherConfig {
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  diretorioCarga?: string;
  diretorioResultados?: string;
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
    diretorioEntrada: 'C:\\MidwayLab\\Labfacil\\SYSMEX_UF_1500\\Entrada',
    diretorioProcessados: 'C:\\MidwayLab\\Labfacil\\SYSMEX_UF_1500\\Processados',
    diretorioErros: 'C:\\MidwayLab\\Labfacil\\SYSMEX_UF_1500\\Erros',
    diretorioCarga: 'C:\\MidwayLab\\Equipamentos\\SYSMEX_UF_1500\\Carga',
    diretorioResultados: 'C:\\MidwayLab\\Equipamentos\\SYSMEX_UF_1500\\Resultados',
    equipamentoDestino: 'SYSMEX_UF_1500',
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
    
    // Calcula base e pastas de Carga / Resultados se não fornecidas explicitamente
    let baseMidway = 'C:\\MidwayLab';
    if (this.config.diretorioEntrada && this.config.diretorioEntrada.toLowerCase().includes('labfacil')) {
      const partes = this.config.diretorioEntrada.split(/[\\/]labfacil/i);
      if (partes[0] && partes[0].trim().length > 0) {
        baseMidway = partes[0].trim();
      }
    }

    const equip = this.config.equipamentoDestino || 'EQUIPAMENTO_PADRAO';
    if (!this.config.diretorioCarga) {
      this.config.diretorioCarga = path.join(baseMidway, 'Equipamentos', equip, 'Carga');
    }
    if (!this.config.diretorioResultados) {
      this.config.diretorioResultados = path.join(baseMidway, 'Equipamentos', equip, 'Resultados');
    }

    // Assegura criação das 5 pastas configuradas
    if (this.config.diretorioEntrada) this.assegurarDiretorio(this.config.diretorioEntrada);
    if (this.config.diretorioProcessados) this.assegurarDiretorio(this.config.diretorioProcessados);
    if (this.config.diretorioErros) this.assegurarDiretorio(this.config.diretorioErros);
    if (this.config.diretorioCarga) this.assegurarDiretorio(this.config.diretorioCarga);
    if (this.config.diretorioResultados) this.assegurarDiretorio(this.config.diretorioResultados);

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

    // Assegura que todos os diretórios existam
    this.assegurarDiretorio(this.config.diretorioEntrada);
    this.assegurarDiretorio(this.config.diretorioProcessados);
    this.assegurarDiretorio(this.config.diretorioErros);
    if (this.config.diretorioCarga) this.assegurarDiretorio(this.config.diretorioCarga);
    if (this.config.diretorioResultados) this.assegurarDiretorio(this.config.diretorioResultados);

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

        // Carrega o DE-PARA do Supabase para a empresa e equipamento
        const mapaDePara = new Map<string, string>();
        if (this.config.tenantId) {
          try {
            const { data: deparaRows } = await supabase
              .from('depara_exames')
              .select('codigo_labfacil, codigo_equipamento, codigo_softlab')
              .eq('tenant_id', this.config.tenantId);

            if (deparaRows) {
              deparaRows.forEach((r: any) => {
                const eqCod = (r.codigo_equipamento || '').trim().toUpperCase();
                if (r.codigo_labfacil && eqCod) mapaDePara.set(r.codigo_labfacil.trim().toUpperCase(), eqCod);
                if (r.codigo_softlab && eqCod) mapaDePara.set(r.codigo_softlab.trim().toUpperCase(), eqCod);
              });
            }
          } catch (_) {}
        }

        // Carrega o formato configurado para o analisador
        let formatoAlvo: 'ASTM' | 'HL7' | 'JSON' | 'XML' | 'CSV' | undefined = undefined;
        if (this.config.tenantId) {
          try {
            const { data: equipRows } = await supabase
              .from('equipamentos')
              .select('id, nome, modelo, formato_arquivo')
              .eq('tenant_id', this.config.tenantId);

            if (equipRows && equipRows.length > 0) {
              const modNorm = (this.config.equipamentoDestino || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
              const match = equipRows.find((e: any) => {
                const eMod = (e.modelo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                const eNome = (e.nome || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                return (eMod && modNorm.includes(eMod)) || (eNome && modNorm.includes(eNome)) || (eMod && eMod.includes(modNorm));
              }) || equipRows[0];

              if (match?.formato_arquivo) {
                formatoAlvo = match.formato_arquivo.toUpperCase() as any;
              }
            }
          } catch (_) {}
        }

        for (const order of parsedOrders) {
          // Geração da carga para o equipamento no formato configurado (Sysmex UF -> ASTM, Mindray -> HL7, etc)
          const result = LabfacilParserService.gerarCargaEquipamento(
            order,
            this.config.equipamentoDestino,
            mapaDePara,
            formatoAlvo
          );

          // Extrai a pasta raiz do MidwayLab (ex: C:\MidwayLab) a partir da pasta de entrada configurada
          let baseMidway = 'C:\\MidwayLab';
          if (this.config.diretorioEntrada && this.config.diretorioEntrada.toLowerCase().includes('labfacil')) {
            const partes = this.config.diretorioEntrada.split(/[\\/]labfacil/i);
            if (partes[0] && partes[0].trim().length > 0) {
              baseMidway = partes[0].trim();
            }
          }

          // A pasta oficial onde o analisador busca a worklist é SEMPRE em Equipamentos/<MODELO>/Carga
          const equipDir = path.join(
            baseMidway,
            'Equipamentos',
            this.config.equipamentoDestino,
            'Carga'
          );

          this.assegurarDiretorio(equipDir);

          // Remove/migra qualquer pasta legada 'Cargas_...' criada indevidamente dentro de Processados
          try {
            const pastaEspuria = path.join(
              this.config.diretorioProcessados,
              'Cargas_' + this.config.equipamentoDestino
            );
            if (fs.existsSync(pastaEspuria)) {
              const arqsEspurios = fs.readdirSync(pastaEspuria);
              for (const a of arqsEspurios) {
                const src = path.join(pastaEspuria, a);
                const dst = path.join(equipDir, a);
                if (!fs.existsSync(dst)) {
                  fs.renameSync(src, dst);
                } else {
                  fs.unlinkSync(src);
                }
              }
              fs.rmdirSync(pastaEspuria);
            }
          } catch (_) {}

          const outputFilePath = path.join(equipDir, result.nomeArquivoSugerido);
          fs.writeFileSync(outputFilePath, result.conteudoArquivo, 'utf8');

          // Grava o pedido com status NA_CARGA no Supabase para acompanhamento na Web
          if (this.config.tenantId) {
            try {
              await supabase.from('pedidos').insert({
                tenant_id: this.config.tenantId,
                codigo_pedido_labfacil: order.numeroPedido,
                numero_solicitacao: order.numeroPedido,
                protocolo_autolac: `${order.numeroPedido}_${Date.now().toString().slice(-4)}`,
                paciente_nome: order.cliente.nome,
                total_exames: order.exames.length,
                status: 'NA_CARGA',
                origem_arquivo: fileName,
                arquivo_nome: fileName,
                modelo_equipamento: this.config.equipamentoDestino,
                codigo_lote_autolac: `LOTE-${this.config.equipamentoDestino}`,
                payload_labfacil_json: JSON.stringify({
                  modelo_equipamento: this.config.equipamentoDestino,
                  arquivo_origem: fileName,
                  arquivo_carga: outputFilePath,
                  arquivo_processado: path.join(this.config.diretorioProcessados, `${path.parse(fileName).name}_${Date.now()}${path.extname(fileName)}`),
                  processado_em: new Date().toISOString(),
                  status: 'NA_CARGA',
                  exames: order.exames,
                  paciente: order.cliente
                }),
                created_at: new Date().toISOString()
              });
            } catch (err: any) {
              console.error('[FolderWatcher] Erro ao gravar pedido no Supabase:', err.message);
            }
          }

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
