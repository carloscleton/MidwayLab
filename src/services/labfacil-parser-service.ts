import { XMLParser } from 'fast-xml-parser';

export interface ILabfacilExameItem {
  codigo: string;
  descricao?: string;
  amostra?: string;
  material?: string;
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
    codPac?: string;
    nome: string;
    cpf?: string;
    dataNascimento?: string;
    idade?: string | number;
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
            codigo: String(e.codigo || e.Codigo || e.codExame || e.codigoLabfacil || e.id || 'EXAME').trim().toUpperCase(),
            descricao: String(e.descricao || e.Descricao || e.nome || e.nomeExame || e.codigo || '').trim(),
            amostra: String(e.amostra || e.Amostra || ''),
            material: String(e.material || e.Material || ''),
            codigoEquipamento: e.codigoEquipamento || e.codEquipamento || '',
          };
        });

        return {
          numeroPedido: String(item.numeroPedido || item.pedido || item.protocolo || item.atendimento || item.CodigoLis || `PED-${Date.now()}-${index + 1}`),
          atendimento: String(item.atendimento || item.numeroAtendimento || item.protocolo || ''),
          dataSolicitacao: item.dataSolicitacao || item.data || new Date().toISOString(),
          origem: 'JSON',
          cliente: {
            id: String(clienteObj.id || clienteObj.codigo || clienteObj.CodigoLis || ''),
            codPac: String(clienteObj.codPac || clienteObj.CodPac || ''),
            nome: String(clienteObj.nome || clienteObj.Nome || clienteObj.nomePaciente || clienteObj.paciente || 'PACIENTE NÃO INFORMADO').toUpperCase(),
            cpf: String(clienteObj.cpf || ''),
            dataNascimento: clienteObj.dataNascimento || clienteObj.Nascimento || clienteObj.nascimento || '',
            idade: clienteObj.idade || clienteObj.Idade || '',
            sexo: (clienteObj.sexo || clienteObj.Sexo) ? String(clienteObj.sexo || clienteObj.Sexo).toUpperCase().charAt(0) as any : 'M',
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
   * Suporta <Principal><Paciente> (formato oficial de pedidos Labfacil) e formatos derivados
   */
  static parseXml(xmlString: string): ILabfacilPedidoParsed[] {
    try {
      const parsed = this.xmlParser.parse(xmlString);
      
      // Suporte direto para <Principal><Paciente> do Labfacil
      let rawOrders: any[] = [];
      if (parsed.Principal?.Paciente) {
        rawOrders = Array.isArray(parsed.Principal.Paciente) ? parsed.Principal.Paciente : [parsed.Principal.Paciente];
      } else if (parsed.Principal?.paciente) {
        rawOrders = Array.isArray(parsed.Principal.paciente) ? parsed.Principal.paciente : [parsed.Principal.paciente];
      } else {
        const root = parsed.pedidos || parsed.solicitacoes || parsed.labfacil || parsed.root || parsed.ProcessaApoioApoiado || parsed;
        const candidates = root.pedido || root.solicitacao || root.atendimento || root.Paciente || root.paciente || (Array.isArray(root) ? root : [root]);
        rawOrders = Array.isArray(candidates) ? candidates : [candidates];
      }

      return rawOrders.map((item: any, index: number) => {
        const cabecalho = item.cabecalho || item;
        const clienteObj = item.cliente || item.paciente || item.Paciente || cabecalho.paciente || item;
        
        let examesRaw = item.Exames?.Exame || item.exames?.exame || item.Exames || item.exames || item.solicitacao?.exame || item.itens?.item || [];
        if (!Array.isArray(examesRaw)) {
          examesRaw = examesRaw ? [examesRaw] : [];
        }

        const examesList: ILabfacilExameItem[] = examesRaw.map((e: any) => {
          if (typeof e === 'string') {
            return { codigo: e.trim().toUpperCase(), descricao: e.trim().toUpperCase() };
          }
          return {
            codigo: String(e.Codigo || e.codigo || e.codExame || e.codigoLabfacil || e.idExame || 'EXAME').trim().toUpperCase(),
            descricao: String(e.Descricao || e.descricao || e.nome || e.nomeExame || e.Codigo || '').trim(),
            amostra: String(e.Amostra || e.amostra || ''),
            material: String(e.Material || e.material || ''),
            codigoEquipamento: e.codigoEquipamento || e.codEquipamento || '',
          };
        });

        // Identificadores de pedido
        const codigoLis = String(item.CodigoLis || item.codigoLis || item.numero || item.numeroPedido || item.protocolo || cabecalho.identificacaoLab?.protocolo || `PED-${index + 1}`);

        return {
          numeroPedido: codigoLis,
          atendimento: String(item.atendimento || cabecalho.atendimento || codigoLis),
          dataSolicitacao: item.data || item.dataHora || new Date().toISOString(),
          origem: 'XML',
          cliente: {
            id: String(clienteObj.CodPac || clienteObj.codPac || clienteObj.id || clienteObj.codigo || codigoLis),
            codPac: String(clienteObj.CodPac || clienteObj.codPac || ''),
            nome: String(clienteObj.Nome || clienteObj.nome || clienteObj.nomePaciente || 'PACIENTE NÃO INFORMADO').toUpperCase(),
            cpf: String(clienteObj.cpf || clienteObj.Cpf || ''),
            dataNascimento: clienteObj.Nascimento || clienteObj.dataNascimento || clienteObj.nascimento || '',
            idade: clienteObj.Idade || clienteObj.idade || '',
            sexo: (clienteObj.Sexo || clienteObj.sexo) ? String(clienteObj.Sexo || clienteObj.sexo).toUpperCase().charAt(0) as any : 'M',
            convenio: clienteObj.convenio || clienteObj.Convenio || '',
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
   * Suporta ASTM E1394 (Sysmex, Yumizen, Access), HL7 v2.x (Mindray), JSON (CB350) e XML
   */
  static gerarCargaEquipamento(
    pedido: ILabfacilPedidoParsed,
    modeloEquipamento: 'CB350' | 'YUMIZEN' | string,
    mapeamentos: Map<string, string>, // codigoLabfacil -> codigoEquipamento
    formatoForcado?: 'JSON' | 'ASTM' | 'HL7' | 'XML' | 'CSV'
  ): {
    conteudoArquivo: string;
    formato: 'JSON' | 'ASTM' | 'HL7' | 'XML' | 'CSV';
    nomeArquivoSugerido: string;
    examesMapeadosCount: number;
    examesNaoMapeadosCount: number;
    examesDetalhes: Array<{ codigoLabfacil: string; codigoEquipamento: string; mapeado: boolean }>;
  } {
    const modeloUpper = modeloEquipamento.toUpperCase();
    const examesEquipamento: Array<{ codigoLabfacil: string; codigoEquipamento: string; amostra?: string; material?: string; mapeado: boolean }> = [];
    let naoMapeados = 0;

    for (const ex of pedido.exames) {
      const temMapeamento = mapeamentos.has(ex.codigo) || Boolean(ex.codigoEquipamento);
      const codEq = mapeamentos.get(ex.codigo) || ex.codigoEquipamento || ex.codigo;
      if (!temMapeamento) {
        naoMapeados++;
      }
      examesEquipamento.push({
        codigoLabfacil: ex.codigo,
        codigoEquipamento: codEq,
        amostra: ex.amostra,
        material: ex.material,
        mapeado: temMapeamento
      });
    }

    const examesDetalhes = examesEquipamento.map(e => ({
      codigoLabfacil: e.codigoLabfacil,
      codigoEquipamento: e.codigoEquipamento,
      mapeado: e.mapeado
    }));

    const dateFormatted = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const sampleId = pedido.exames[0]?.amostra || pedido.numeroPedido;
    const patientNameAstm = (pedido.cliente.nome || 'PACIENTE').trim().replace(/\s+/g, '^');

    // Determina o formato alvo
    const isAstm = formatoForcado === 'ASTM' || (!formatoForcado && (
      modeloUpper.includes('YUMIZEN') ||
      modeloUpper.includes('SYSMEX') ||
      modeloUpper.includes('UF') ||
      modeloUpper.includes('ACCESS') ||
      modeloUpper.includes('COBAS')
    ));

    const isHl7 = formatoForcado === 'HL7' || (!formatoForcado && (
      modeloUpper.includes('MINDRAY') ||
      modeloUpper.includes('BS_240') ||
      modeloUpper.includes('BC_5380')
    ));

    const isXml = formatoForcado === 'XML';

    if (isAstm) {
      // ASTM E1394 Padrão Internacional (Sysmex UF, Horiba Yumizen, Beckman Access)
      const testCodesAstm = examesEquipamento.map(e => `^^^${e.codigoEquipamento}`).join('\\');
      const astmLines = [
        `H|\\^&|||${modeloEquipamento}|||||||P|1|${dateFormatted}`,
        `P|1|||${pedido.cliente.codPac || pedido.numeroPedido}||${patientNameAstm}|||${pedido.cliente.sexo || 'U'}|||||||||||||||`,
        `O|1|${sampleId}||${testCodesAstm}|||||||A||||||||||||||Q`,
        `L|1|N`,
      ];

      return {
        conteudoArquivo: astmLines.join('\r\n'),
        formato: 'ASTM',
        nomeArquivoSugerido: `${modeloEquipamento}_${pedido.numeroPedido}.astm`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
        examesDetalhes
      };
    } else if (isHl7) {
      // HL7 v2.3.1 Padrão Internacional (Mindray BS-240 / BC-5380)
      const testCodesHl7 = examesEquipamento.map(e => e.codigoEquipamento).join('~');
      const hl7Lines = [
        `MSH|^~\\&|MIDWAYLAB|LAB|${modeloEquipamento}|EQUIP|${dateFormatted}||ORM^O01|MSG${Date.now()}|P|2.3.1`,
        `PID|1||${pedido.cliente.codPac || pedido.numeroPedido}||${patientNameAstm}|||${pedido.cliente.sexo || 'U'}`,
        `ORC|NW|${sampleId}|||||${dateFormatted}`,
        `OBR|1|${sampleId}||${testCodesHl7}|||${dateFormatted}|||||||||||||||||O`,
      ];

      return {
        conteudoArquivo: hl7Lines.join('\r\n'),
        formato: 'HL7',
        nomeArquivoSugerido: `${modeloEquipamento}_${pedido.numeroPedido}.hl7`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
        examesDetalhes
      };
    } else if (isXml) {
      // XML Estruturado
      const examesXml = examesEquipamento.map(e => `      <Exame>
        <Codigo>${e.codigoEquipamento}</Codigo>
        <CodigoLabfacil>${e.codigoLabfacil}</CodigoLabfacil>
        <Material>${e.material || 'SORO'}</Material>
      </Exame>`).join('\n');

      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Principal>
  <Equipamento>${modeloEquipamento}</Equipamento>
  <Paciente>
    <Amostra>${sampleId}</Amostra>
    <CodigoLis>${pedido.numeroPedido}</CodigoLis>
    <Nome>${pedido.cliente.nome}</Nome>
    <Sexo>${pedido.cliente.sexo || 'U'}</Sexo>
    <Exames>
${examesXml}
    </Exames>
  </Paciente>
</Principal>`;

      return {
        conteudoArquivo: xmlContent,
        formato: 'XML',
        nomeArquivoSugerido: `${modeloEquipamento}_${pedido.numeroPedido}.xml`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
        examesDetalhes
      };
    } else if (modeloUpper.includes('CB350') || formatoForcado === 'JSON') {
      // Formato para analisador de Bioquímica CB350 / Wiener (Worklist estruturada por Amostra)
      const worklistCb350 = {
        equipamento: modeloEquipamento,
        lis_code: pedido.numeroPedido,
        patient: {
          id: pedido.cliente.codPac || pedido.cliente.cpf || pedido.numeroPedido,
          name: pedido.cliente.nome,
          gender: pedido.cliente.sexo,
          birthdate: pedido.cliente.dataNascimento,
          age: pedido.cliente.idade,
        },
        tests: examesEquipamento.map(e => ({
          test_code: e.codigoEquipamento,
          labfacil_code: e.codigoLabfacil,
          sample_tube: e.amostra || sampleId,
          sample_material: e.material || 'SORO',
        })),
        generated_at: new Date().toISOString(),
      };

      return {
        conteudoArquivo: JSON.stringify(worklistCb350, null, 2),
        formato: 'JSON',
        nomeArquivoSugerido: `${modeloEquipamento}_WORKLIST_${pedido.numeroPedido}.json`,
        examesMapeadosCount: examesEquipamento.length - naoMapeados,
        examesNaoMapeadosCount: naoMapeados,
        examesDetalhes
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
        examesDetalhes
      };
    }
  }
}
