import { XMLParser } from 'fast-xml-parser';

export interface ILabfacilExameItem {
  codigo: string;
  descricao?: string;
  codigoEquipamento?: string; // Código no analisador (ex: CB350 / Yumizen)
  statusMapeamento?: 'MAPEADO' | 'NAO_MAPEADO';
}

export interface ILabfacilPedidoParsed {
  numeroPedido: string;
  atendimento?: string;
  dataSolicitacao?: string;
  origem: 'JSON' | 'XML';
  cliente: {
    id?: string;
    nome: string;
    cpf?: string;
    dataNascimento?: string;
    sexo?: 'M' | 'F' | 'O';
    convenio?: string;
    medico?: string;
  };
  exames: ILabfacilExameItem[];
  rawContent: string;
}

export class LabfacilParserService {
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
    trimValues: true,
  });

  /**
   * Processa o conteúdo de um arquivo (JSON ou XML) originário do Labfacil
   */
  static parseFile(fileContent: string, fileName: string): ILabfacilPedidoParsed[] {
    const isXml = fileName.toLowerCase().endsWith('.xml') || fileContent.trim().startsWith('<');
    
    if (isXml) {
      return this.parseXml(fileContent);
    } else {
      return this.parseJson(fileContent);
    }
  }

  /**
   * Parser robusto para arquivos JSON do Labfacil
   */
  static parseJson(jsonString: string): ILabfacilPedidoParsed[] {
    try {
      const parsed = JSON.parse(jsonString);
      const orders = Array.isArray(parsed) ? parsed : (parsed.pedidos || parsed.solicitacoes || parsed.itens || [parsed]);

      return orders.map((item: any, index: number) => {
        const clienteObj = item.cliente || item.paciente || item;
        const rawExames = item.exames || item.solicitacoes || item.itens || item.procedimentos || [];
        const examesList: ILabfacilExameItem[] = (Array.isArray(rawExames) ? rawExames : [rawExames]).map((e: any) => {
          if (typeof e === 'string') {
            return { codigo: e.trim().toUpperCase(), descricao: e.trim().toUpperCase() };
          }
          return {
            codigo: String(e.codigo || e.codExame || e.codigoLabfacil || e.id || 'EXAME').trim().toUpperCase(),
            descricao: String(e.descricao || e.nome || e.nomeExame || e.codigo || '').trim(),
            codigoEquipamento: e.codigoEquipamento || e.codEquipamento || '',
          };
        });

        return {
          numeroPedido: String(item.numeroPedido || item.pedido || item.protocolo || item.atendimento || `PED-${Date.now()}-${index + 1}`),
          atendimento: String(item.atendimento || item.numeroAtendimento || item.protocolo || ''),
          dataSolicitacao: item.dataSolicitacao || item.data || new Date().toISOString(),
          origem: 'JSON',
          cliente: {
            id: String(clienteObj.id || clienteObj.codigo || ''),
            nome: String(clienteObj.nome || clienteObj.nomePaciente || clienteObj.paciente || 'PACIENTE NÃO INFORMADO').toUpperCase(),
            cpf: String(clienteObj.cpf || ''),
            dataNascimento: clienteObj.dataNascimento || clienteObj.nascimento || '',
            sexo: clienteObj.sexo ? String(clienteObj.sexo).toUpperCase().charAt(0) as any : 'M',
            convenio: clienteObj.convenio || clienteObj.plano || '',
            medico: clienteObj.medico || clienteObj.solicitante || '',
          },
          exames: examesList,
          rawContent: typeof item === 'object' ? JSON.stringify(item) : String(item),
        };
      });
    } catch (e: any) {
      console.error('[LabfacilParserService] Erro ao analisar JSON:', e);
      throw new Error(`Falha no formato JSON do Labfacil: ${e.message}`);
    }
  }

  /**
   * Parser robusto para arquivos XML do Labfacil
   */
  static parseXml(xmlString: string): ILabfacilPedidoParsed[] {
    try {
      const parsed = this.xmlParser.parse(xmlString);
      // Suporte a múltiplas tags raiz possíveis
      const root = parsed.pedidos || parsed.solicitacoes || parsed.labfacil || parsed.root || parsed.ProcessaApoioApoiado || parsed;
      const rawOrders = root.pedido || root.solicitacao || root.atendimento || (Array.isArray(root) ? root : [root]);
      const ordersArray = Array.isArray(rawOrders) ? rawOrders : [rawOrders];

      return ordersArray.map((item: any, index: number) => {
        const cabecalho = item.cabecalho || item;
        const clienteObj = item.cliente || item.paciente || cabecalho.paciente || {};
        
        let examesRaw = item.exames?.exame || item.exames || item.solicitacao?.exame || item.itens?.item || [];
        if (!Array.isArray(examesRaw)) {
          examesRaw = examesRaw ? [examesRaw] : [];
        }

        const examesList: ILabfacilExameItem[] = examesRaw.map((e: any) => {
          if (typeof e === 'string') {
            return { codigo: e.trim().toUpperCase(), descricao: e.trim().toUpperCase() };
          }
          return {
            codigo: String(e.codigo || e.codExame || e.codigoLabfacil || e.idExame || 'EXAME').trim().toUpperCase(),
            descricao: String(e.descricao || e.nome || e.nomeExame || e.codigo || '').trim(),
            codigoEquipamento: e.codigoEquipamento || e.codEquipamento || '',
          };
        });

        return {
          numeroPedido: String(item.numero || item.numeroPedido || item.protocolo || cabecalho.identificacaoLab?.protocolo || `XML-PED-${index + 1}`),
          atendimento: String(item.atendimento || cabecalho.atendimento || ''),
          dataSolicitacao: item.data || item.dataHora || new Date().toISOString(),
          origem: 'XML',
          cliente: {
            id: String(clienteObj.id || clienteObj.codigo || ''),
            nome: String(clienteObj.nome || clienteObj.nomePaciente || 'PACIENTE XML').toUpperCase(),
            cpf: String(clienteObj.cpf || ''),
            dataNascimento: clienteObj.dataNascimento || clienteObj.nascimento || '',
            sexo: clienteObj.sexo ? String(clienteObj.sexo).toUpperCase().charAt(0) as any : 'M',
            convenio: clienteObj.convenio || '',
            medico: clienteObj.medico || clienteObj.solicitante || '',
          },
          exames: examesList,
          rawContent: xmlString,
        };
      });
    } catch (e: any) {
      console.error('[LabfacilParserService] Erro ao analisar XML:', e);
      throw new Error(`Falha no formato XML do Labfacil: ${e.message}`);
    }
  }

  /**
   * Converte o pedido do Labfacil para o formato de carga de trabalho do equipamento selecionado
   * Ex: CB350 (Bioquímica) ou YUMIZEN (Hematologia)
   */
  static gerarCargaEquipamento(
    pedido: ILabfacilPedidoParsed,
    modeloEquipamento: 'CB350' | 'YUMIZEN' | string,
    mapeamentos: Map<string, string> // codigoLabfacil -> codigoEquipamento
  ): {
    conteudoArquivo: string;
    formato: 'JSON' | 'ASTM' | 'HL7' | 'CSV';
    nomeArquivoSugerido: string;
    examesMapeadosCount: number;
    examesNaoMapeadosCount: number;
  } {
    const modeloUpper = modeloEquipamento.toUpperCase();
    const examesEquipamento: Array<{ codigoLabfacil: string; codigoEquipamento: string }> = [];
    let naoMapeados = 0;

    for (const ex of pedido.exames) {
      const codEq = mapeamentos.get(ex.codigo) || ex.codigoEquipamento || ex.codigo;
      if (!mapeamentos.has(ex.codigo) && !ex.codigoEquipamento) {
        naoMapeados++;
      }
      examesEquipamento.push({
        codigoLabfacil: ex.codigo,
        codigoEquipamento: codEq,
      });
    }

    if (modeloUpper.includes('CB350')) {
      // Formato para analisador de Bioquímica CB350 (Worklist estruturada)
      const worklistCb350 = {
        equipamento: 'CB350',
        sample_id: pedido.numeroPedido,
        patient: {
          id: pedido.cliente.cpf || pedido.cliente.id || pedido.numeroPedido,
          name: pedido.cliente.nome,
          gender: pedido.cliente.sexo,
          birthdate: pedido.cliente.dataNascimento,
        },
        tests: examesEquipamento.map(e => e.codigoEquipamento),
        generated_at: new Date().toISOString(),
      };

      return {
        conteudoArquivo: JSON.stringify(worklistCb350, null, 2),
        formato: 'JSON',
        nomeArquivoSugerido: `CB350_WORKLIST_${pedido.numeroPedido}.json`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
      };
    } else if (modeloUpper.includes('YUMIZEN')) {
      // Formato para analisador de Hematologia Horiba Yumizen (Ex: ASTM / Worklist)
      const dateFormatted = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const astmLines = [
        `H|\\^&|||YUMIZEN|||||||P|1|${dateFormatted}`,
        `P|1|||${pedido.cliente.cpf || pedido.numeroPedido}||${pedido.cliente.nome.replace(/\s+/g, '^')}|||${pedido.cliente.sexo || 'U'}|||||||||||||||`,
        `O|1|${pedido.numeroPedido}||^^^${examesEquipamento.map(e => e.codigoEquipamento).join('\\^^^')}|||||||A||||||||||||||Q`,
        `L|1|N`,
      ];

      return {
        conteudoArquivo: astmLines.join('\r\n'),
        formato: 'ASTM',
        nomeArquivoSugerido: `YUMIZEN_${pedido.numeroPedido}.astm`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
      };
    } else {
      // Carga Genérica JSON
      const genericPayload = {
        equipamento: modeloEquipamento,
        pedido: pedido.numeroPedido,
        cliente: pedido.cliente,
        exames: examesEquipamento,
        gerado_em: new Date().toISOString(),
      };

      return {
        conteudoArquivo: JSON.stringify(genericPayload, null, 2),
        formato: 'JSON',
        nomeArquivoSugerido: `EQUIP_${modeloEquipamento}_${pedido.numeroPedido}.json`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
      };
    }
  }
}
