/**
 * Equipment Sniffer Service
 * Serviço para captura, leitura, decodificação e auto-aprendizado de linhas de resultado (analitos)
 * a partir de transmissões reais ou simuladas de equipamentos laboratoriais (ASTM, HL7, XML, JSON, CSV).
 */

export interface ILinhaResultadoDetectada {
  codigoEquipamento: string;
  descricao: string;
  parametroRetorno: string;
  enviaParaEquip: boolean;
  mascara: string;
  fatorMultiplicacao: string;
  valorExemplo?: string;
  unidade?: string;
  referencia?: string;
  statusAlerta?: string;
}

export interface IResultadoSniffer {
  sucesso: boolean;
  formatoDetectado: 'ASTM' | 'HL7' | 'XML' | 'JSON' | 'CSV' | 'DESCONHECIDO';
  totalDetectados: number;
  amostraLis?: string;
  linhas: ILinhaResultadoDetectada[];
  rawRecebido: string;
}

export class EquipmentSnifferService {
  // Dicionário inteligente de de-para para nomes legíveis e códigos de retorno usuais
  private static DICIONARIO_ANALITOS: Record<string, { nome: string; retorno?: string; mascara?: string }> = {
    // Sysmex Urinálise (UF-1500 / UF-5000 / UF-4000)
    WBC_MAINFORM: { nome: 'Leucócitos', retorno: 'RES12', mascara: '0.00' },
    WBC_MAINFORMAT: { nome: 'Leucócitos', retorno: 'RES12', mascara: '0.00' },
    RBC_MAINFORM: { nome: 'Hemácias na Urina', retorno: 'RES13', mascara: '0.00' },
    RBC_MAINFORMAT: { nome: 'Hemácias na Urina', retorno: 'RES13', mascara: '0.00' },
    EC_MAINFORMA: { nome: 'Células Epiteliais Escamosas', retorno: 'RES14', mascara: '0.00' },
    EC_MAINFORMAT: { nome: 'Células Epiteliais Escamosas', retorno: 'RES14', mascara: '0.00' },
    YLC_MAINFORM: { nome: 'Leveduras', retorno: 'RES16', mascara: '0.00' },
    YLC_MAINFORMAT: { nome: 'Leveduras', retorno: 'RES16', mascara: '0.00' },
    BACT_MAINFORM: { nome: 'Bactérias / Sumário de Urina', retorno: 'RES17', mascara: '0.00' },
    BACT_MAINFORMAT: { nome: 'Bactérias / Sumário de Urina', retorno: 'RES17', mascara: '0.00' },
    CAST_MAINFORM: { nome: 'Cilindros Hialinos', retorno: 'RES19', mascara: '0.00' },
    CAST_MAINFORMAT: { nome: 'Cilindros Hialinos', retorno: 'RES19', mascara: '0.00' },
    XTAL_MAINFORM: { nome: 'Cristais', retorno: 'RES20', mascara: '0.00' },
    XTAL_MAINFORMAT: { nome: 'Cristais', retorno: 'RES20', mascara: '0.00' },
    SRC_MAINFORM: { nome: 'Células Renais', retorno: 'RES21', mascara: '0.00' },
    MUCUS_MAINFORM: { nome: 'Filamentos de Muco', retorno: 'RES22', mascara: '0.00' },
    SPRM_MAINFORM: { nome: 'Espermatozoides', retorno: 'RES23', mascara: '0.00' },

    // Hematologia (Sysmex XN, Mindray BC, Horiba Yumizen)
    WBC: { nome: 'Leucócitos Totais', retorno: 'WBC', mascara: '0.00' },
    RBC: { nome: 'Hemácias', retorno: 'RBC', mascara: '0.00' },
    HGB: { nome: 'Hemoglobina', retorno: 'HGB', mascara: '0.0' },
    HB: { nome: 'Hemoglobina', retorno: 'HGB', mascara: '0.0' },
    HCT: { nome: 'Hematócrito', retorno: 'HCT', mascara: '0.0' },
    HT: { nome: 'Hematócrito', retorno: 'HCT', mascara: '0.0' },
    MCV: { nome: 'Volume Corpuscular Médio', retorno: 'VCM', mascara: '0.0' },
    VCM: { nome: 'Volume Corpuscular Médio', retorno: 'VCM', mascara: '0.0' },
    MCH: { nome: 'Hemoglobina Corpuscular Média', retorno: 'HCM', mascara: '0.0' },
    HCM: { nome: 'Hemoglobina Corpuscular Média', retorno: 'HCM', mascara: '0.0' },
    MCHC: { nome: 'Conc. Hemoglobina Corpuscular Média', retorno: 'CHCM', mascara: '0.0' },
    CHCM: { nome: 'Conc. Hemoglobina Corpuscular Média', retorno: 'CHCM', mascara: '0.0' },
    RDW: { nome: 'Anisocitose Eritrocitária', retorno: 'RDW', mascara: '0.0' },
    RDW_CV: { nome: 'Anisocitose (RDW-CV)', retorno: 'RDW', mascara: '0.0' },
    RDW_SD: { nome: 'Anisocitose (RDW-SD)', retorno: 'RDW_SD', mascara: '0.0' },
    PLT: { nome: 'Plaquetas', retorno: 'PLT', mascara: '0' },
    MPV: { nome: 'Volume Plaquetário Médio (VPM)', retorno: 'VPM', mascara: '0.0' },
    VPM: { nome: 'Volume Plaquetário Médio (VPM)', retorno: 'VPM', mascara: '0.0' },
    NEU: { nome: 'Neutrófilos', retorno: 'NEU', mascara: '0.0' },
    NEUT: { nome: 'Neutrófilos', retorno: 'NEU', mascara: '0.0' },
    LYM: { nome: 'Linfócitos', retorno: 'LYM', mascara: '0.0' },
    LYMPH: { nome: 'Linfócitos', retorno: 'LYM', mascara: '0.0' },
    MON: { nome: 'Monócitos', retorno: 'MON', mascara: '0.0' },
    MONO: { nome: 'Monócitos', retorno: 'MON', mascara: '0.0' },
    EOS: { nome: 'Eosinófilos', retorno: 'EOS', mascara: '0.0' },
    BAS: { nome: 'Basófilos', retorno: 'BAS', mascara: '0.0' },

    // Bioquímica (Mindray BS-240, Wiener CB350, Cobas, Beckman)
    GLI: { nome: 'Glicose', retorno: 'GLI', mascara: '0.0' },
    GLU: { nome: 'Glicose', retorno: 'GLI', mascara: '0.0' },
    URE: { nome: 'Ureia', retorno: 'URE', mascara: '0.0' },
    BUN: { nome: 'Ureia / Nitrogênio Ureico', retorno: 'URE', mascara: '0.0' },
    CRE: { nome: 'Creatinina', retorno: 'CRE', mascara: '0.00' },
    CREA: { nome: 'Creatinina', retorno: 'CRE', mascara: '0.00' },
    COL: { nome: 'Colesterol Total', retorno: 'COL', mascara: '0.0' },
    CHOL: { nome: 'Colesterol Total', retorno: 'COL', mascara: '0.0' },
    TRI: { nome: 'Triglicerídeos', retorno: 'TRI', mascara: '0.0' },
    TRIG: { nome: 'Triglicerídeos', retorno: 'TRI', mascara: '0.0' },
    HDL: { nome: 'Colesterol HDL', retorno: 'HDL', mascara: '0.0' },
    LDL: { nome: 'Colesterol LDL', retorno: 'LDL', mascara: '0.0' },
    VLDL: { nome: 'Colesterol VLDL', retorno: 'VLDL', mascara: '0.0' },
    TGO: { nome: 'Transaminase Oxalacética (AST)', retorno: 'TGO', mascara: '0.0' },
    AST: { nome: 'Transaminase Oxalacética (AST)', retorno: 'TGO', mascara: '0.0' },
    TGP: { nome: 'Transaminase Pirúvica (ALT)', retorno: 'TGP', mascara: '0.0' },
    ALT: { nome: 'Transaminase Pirúvica (ALT)', retorno: 'TGP', mascara: '0.0' },
    GGT: { nome: 'Gama Glutamiltransferase (GGT)', retorno: 'GGT', mascara: '0.0' },
    FAL: { nome: 'Fosfatase Alcalina', retorno: 'FAL', mascara: '0.0' },
    ALP: { nome: 'Fosfatase Alcalina', retorno: 'FAL', mascara: '0.0' },
    ACU: { nome: 'Ácido Úrico', retorno: 'ACU', mascara: '0.0' },
    UA: { nome: 'Ácido Úrico', retorno: 'ACU', mascara: '0.0' },
    PCR: { nome: 'Proteína C Reativa', retorno: 'PCR', mascara: '0.00' },
    CRP: { nome: 'Proteína C Reativa', retorno: 'PCR', mascara: '0.00' },
    TSH: { nome: 'Hormônio Tireoestimulante (TSH)', retorno: 'TSH', mascara: '0.000' },
    T4L: { nome: 'Tiroxina Livre (T4 Livre)', retorno: 'T4L', mascara: '0.00' },
    PSA: { nome: 'Antígeno Prostático Específico (PSA)', retorno: 'PSA', mascara: '0.00' },
    VITD: { nome: 'Vitamina D (25-Hidroxivitamina D)', retorno: 'VITD', mascara: '0.0' }
  };

  /**
   * Identifica o nome descritivo sugerido para um código de analito
   */
  public static sugerirDescricao(codigo: string): { nome: string; retorno: string; mascara: string } {
    const limpo = codigo.trim().toUpperCase().replace(/^(\^\^\^|\^)/, '');
    const direto = this.DICIONARIO_ANALITOS[limpo];
    if (direto) {
      return {
        nome: direto.nome,
        retorno: direto.retorno || limpo,
        mascara: direto.mascara || '0.00'
      };
    }

    // Busca por prefixo/iniciais
    for (const [k, v] of Object.entries(this.DICIONARIO_ANALITOS)) {
      if (limpo.startsWith(k) || k.startsWith(limpo)) {
        return {
          nome: v.nome,
          retorno: v.retorno || limpo,
          mascara: v.mascara || '0.00'
        };
      }
    }

    // Formata o código como nome amigável caso não esteja no dicionário
    const nomeFormatado = limpo
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());

    return {
      nome: nomeFormatado || limpo,
      retorno: limpo,
      mascara: '0.00'
    };
  }

  /**
   * Extrai linhas de resultado a partir de qualquer string bruta recebida do equipamento
   */
  public static extrairLinhasDeRetornoBruto(texto: string): IResultadoSniffer {
    if (!texto || !texto.trim()) {
      return {
        sucesso: false,
        formatoDetectado: 'DESCONHECIDO',
        totalDetectados: 0,
        linhas: [],
        rawRecebido: ''
      };
    }

    // Limpa caracteres especiais de transmissão serial/socket (STX, ETX, EOT, ENQ, ACK, NAK)
    const rawClean = texto
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();

    const linhasExtraidasMap = new Map<string, ILinhaResultadoDetectada>();
    let formatoDetectado: IResultadoSniffer['formatoDetectado'] = 'DESCONHECIDO';
    let amostraLis = '';

    const lines = rawClean.split(/\r\n|\r|\n/);

    // 1. TENTATIVA ASTM E1394 (Registros R|...)
    const isAstm = lines.some(l => l.startsWith('H|') || l.startsWith('R|') || l.startsWith('O|') || l.startsWith('P|'));
    if (isAstm) {
      formatoDetectado = 'ASTM';
      for (const line of lines) {
        const parts = line.split('|');
        const recordType = parts[0]?.trim();

        if (recordType === 'O') {
          // Extrai identificador da amostra / pedido se houver
          amostraLis = parts[2]?.trim() || parts[3]?.trim() || '';
        }

        if (recordType === 'R') {
          // Formato padrão ASTM: R|1|^^^WBC_MAINFORM|15.4|/uL|0.0-5.0|N||F||...
          const rawCode = parts[2]?.trim() || '';
          // Limpa separadores de componente ^^^ ou ^
          const subparts = rawCode.split('^').filter(Boolean);
          const codEq = (subparts[0] || rawCode).toUpperCase().trim();
          const nomeSecundario = subparts[1] || '';

          if (codEq && !linhasExtraidasMap.has(codEq)) {
            const valor = parts[3]?.trim();
            const unidade = parts[4]?.trim();
            const referencia = parts[5]?.trim();
            const status = parts[6]?.trim();

            const sugestao = this.sugerirDescricao(codEq);
            linhasExtraidasMap.set(codEq, {
              codigoEquipamento: codEq,
              descricao: nomeSecundario || sugestao.nome,
              parametroRetorno: sugestao.retorno,
              enviaParaEquip: true,
              mascara: sugestao.mascara,
              fatorMultiplicacao: '1',
              valorExemplo: valor,
              unidade: unidade,
              referencia: referencia,
              statusAlerta: status
            });
          }
        }
      }
    }

    // 2. TENTATIVA HL7 v2 (Segmentos OBX|...)
    if (formatoDetectado === 'DESCONHECIDO' && lines.some(l => l.startsWith('MSH|') || l.startsWith('OBX|') || l.startsWith('OBR|'))) {
      formatoDetectado = 'HL7';
      for (const line of lines) {
        const parts = line.split('|');
        const segment = parts[0]?.trim();

        if (segment === 'OBR') {
          amostraLis = parts[2]?.trim() || parts[3]?.trim() || '';
        }

        if (segment === 'OBX') {
          // Formato padrão HL7: OBX|1|NM|WBC_MAINFORM^Leucocitos|1|15.4|/uL|0-5|N|||F
          const rawCode = parts[3]?.trim() || '';
          const subparts = rawCode.split('^').filter(Boolean);
          const codEq = (subparts[0] || rawCode).toUpperCase().trim();
          const nomeSecundario = subparts[1] || '';

          if (codEq && !linhasExtraidasMap.has(codEq)) {
            const valor = parts[5]?.trim();
            const unidade = parts[6]?.trim();
            const referencia = parts[7]?.trim();
            const status = parts[8]?.trim();

            const sugestao = this.sugerirDescricao(codEq);
            linhasExtraidasMap.set(codEq, {
              codigoEquipamento: codEq,
              descricao: nomeSecundario || sugestao.nome,
              parametroRetorno: sugestao.retorno,
              enviaParaEquip: true,
              mascara: sugestao.mascara,
              fatorMultiplicacao: '1',
              valorExemplo: valor,
              unidade: unidade,
              referencia: referencia,
              statusAlerta: status
            });
          }
        }
      }
    }

    // 3. TENTATIVA JSON (Resultados estruturados)
    if (formatoDetectado === 'DESCONHECIDO' && (rawClean.startsWith('{') || rawClean.startsWith('['))) {
      try {
        const obj = JSON.parse(rawClean);
        formatoDetectado = 'JSON';

        const listaCandidata: any[] = Array.isArray(obj)
          ? obj
          : (obj.resultados || obj.tests || obj.results || obj.exames || obj.itens || []);

        amostraLis = obj.pedido || obj.lis_code || obj.sample || obj.amostra || '';

        for (const item of listaCandidata) {
          const cod = String(item.parametro || item.test_code || item.codigo || item.code || item.id || '').toUpperCase().trim();
          if (cod && !linhasExtraidasMap.has(cod)) {
            const sugestao = this.sugerirDescricao(cod);
            linhasExtraidasMap.set(cod, {
              codigoEquipamento: cod,
              descricao: item.nome || item.descricao || item.test_name || sugestao.nome,
              parametroRetorno: item.retorno || sugestao.retorno,
              enviaParaEquip: true,
              mascara: sugestao.mascara,
              fatorMultiplicacao: '1',
              valorExemplo: String(item.valor ?? item.value ?? ''),
              unidade: item.unidade || item.unit || ''
            });
          }
        }
      } catch (_) {}
    }

    // 4. TENTATIVA XML (<Exame>, <Resultado>, <Secao>)
    if (formatoDetectado === 'DESCONHECIDO' && rawClean.includes('<') && rawClean.includes('>')) {
      formatoDetectado = 'XML';
      const tagRegex = /<(CodExame|Codigo|Code|Parametro|TestCode)>([^<]+)<\/\1>/gi;
      let match;
      while ((match = tagRegex.exec(rawClean)) !== null) {
        const cod = match[2]?.trim().toUpperCase();
        if (cod && cod.length >= 2 && !linhasExtraidasMap.has(cod)) {
          const sugestao = this.sugerirDescricao(cod);
          linhasExtraidasMap.set(cod, {
            codigoEquipamento: cod,
            descricao: sugestao.nome,
            parametroRetorno: sugestao.retorno,
            enviaParaEquip: true,
            mascara: sugestao.mascara,
            fatorMultiplicacao: '1'
          });
        }
      }
    }

    // 5. TENTATIVA CSV / LINHAS DE TEXTO LIVRE COM SEPARADOR
    if (formatoDetectado === 'DESCONHECIDO') {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const parts = trimmed.split(/[,;\t]/).map(p => p.trim());
        if (parts.length >= 2) {
          const cod = parts[0].toUpperCase();
          if (cod && cod.length >= 2 && !cod.includes(' ') && !linhasExtraidasMap.has(cod)) {
            formatoDetectado = 'CSV';
            const sugestao = this.sugerirDescricao(cod);
            linhasExtraidasMap.set(cod, {
              codigoEquipamento: cod,
              descricao: parts[1] || sugestao.nome,
              parametroRetorno: parts[2] || sugestao.retorno,
              enviaParaEquip: true,
              mascara: sugestao.mascara,
              fatorMultiplicacao: '1'
            });
          }
        }
      }
    }

    const linhasArray = Array.from(linhasExtraidasMap.values());

    return {
      sucesso: linhasArray.length > 0,
      formatoDetectado,
      totalDetectados: linhasArray.length,
      amostraLis,
      linhas: linhasArray,
      rawRecebido: rawClean
    };
  }

  /**
   * Gera um payload de teste representativo de retorno de máquina para testes no sandbox
   */
  public static gerarExemploRetornoEquipamento(modelo: string): { formato: 'ASTM' | 'HL7' | 'XML' | 'JSON'; raw: string } {
    const modUpper = (modelo || '').toUpperCase();
    const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    if (modUpper.includes('UF') || modUpper.includes('SYSMEX') || modUpper.includes('ACCESS') || modUpper.includes('YUMIZEN')) {
      return {
        formato: 'ASTM',
        raw: [
          `H|\\^&|||${modelo || 'SYSMEX_UF_1500'}|||||||P|1|${ts}`,
          `P|1||||PACIENTE TESTE QA|||U`,
          `O|1|0142215202||^^^SUMA2|||||||||||||||||||||F`,
          `R|1|^^^WBC_MAINFORM|12.50|/uL|0.0-5.0|H||F||||${ts}`,
          `R|2|^^^RBC_MAINFORM|4.20|/uL|0.0-3.0|H||F||||${ts}`,
          `R|3|^^^EC_MAINFORMA|1.00|/uL|0.0-5.0|N||F||||${ts}`,
          `R|4|^^^YLC_MAINFORM|0.00|/uL|0.0-0.0|N||F||||${ts}`,
          `R|5|^^^BACT_MAINFORM|350.00|/uL|0.0-130.0|H||F||||${ts}`,
          `R|6|^^^CAST_MAINFORM|0.00|/uL|0.0-1.0|N||F||||${ts}`,
          `R|7|^^^XTAL_MAINFORM|0.00|/uL|0.0-0.0|N||F||||${ts}`,
          `R|8|^^^SRC_MAINFORM|0.00|/uL|0.0-1.0|N||F||||${ts}`,
          `L|1|N`
        ].join('\r\n')
      };
    }

    if (modUpper.includes('BS') || modUpper.includes('BC') || modUpper.includes('MINDRAY')) {
      return {
        formato: 'HL7',
        raw: [
          `MSH|^~\\&|${modelo || 'MINDRAY_BS_240'}|LAB|MIDWAY|LIS|${ts}||ORU^R01|MSG${Date.now()}|P|2.3.1`,
          `PID|1||0142215202||PACIENTE TESTE QA^^^|||U`,
          `OBR|1|0142215202|0142215202|SUMA2^Sumario de Urina|||${ts}|||||||||||||||||F`,
          `OBX|1|NM|WBC_MAINFORM^Leucocitos|1|12.5|/uL|0-5|H|||F`,
          `OBX|2|NM|RBC_MAINFORM^Hemacias|1|4.2|/uL|0-3|H|||F`,
          `OBX|3|NM|EC_MAINFORMA^Celulas Epiteliais|1|1.0|/uL|0-5|N|||F`,
          `OBX|4|NM|BACT_MAINFORM^Bacterias|1|350.0|/uL|0-130|H|||F`,
          `OBX|5|NM|CAST_MAINFORM^Cilindros|1|0.0|/uL|0-1|N|||F`,
          `OBX|6|NM|XTAL_MAINFORM^Cristais|1|0.0|/uL|0-0|N|||F`
        ].join('\r\n')
      };
    }

    // Default Bioquímica CB350 / JSON
    return {
      formato: 'JSON',
      raw: JSON.stringify({
        equipamento: modelo || 'CB350',
        amostra: '0142215202',
        gerado_em: new Date().toISOString(),
        resultados: [
          { parametro: 'GLI', descricao: 'Glicose', valor: '92.5', unidade: 'mg/dL' },
          { parametro: 'URE', descricao: 'Ureia', valor: '35.0', unidade: 'mg/dL' },
          { parametro: 'CRE', descricao: 'Creatinina', valor: '0.90', unidade: 'mg/dL' },
          { parametro: 'COL', descricao: 'Colesterol Total', valor: '185.0', unidade: 'mg/dL' },
          { parametro: 'TRI', descricao: 'Triglicerídeos', valor: '130.0', unidade: 'mg/dL' }
        ]
      }, null, 2)
    };
  }
}
