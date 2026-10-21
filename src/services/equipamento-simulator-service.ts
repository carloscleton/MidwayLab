// src/services/equipamento-simulator-service.ts
// Serviço para Simular Ida (recebimento de carga de exames) e Retorno (liberação de resultados simulados)

export interface ISimulatedResultItem {
  codigoEquipamento: string;
  codigoLabfacil?: string;
  nomeExame: string;
  valor: string | number;
  unidade: string;
  valoresReferencia: string;
  status: 'NORMAL' | 'ALTERADO' | 'CRITICO';
}

export interface ISimulatedSampleRelease {
  numeroPedido: string;
  pacienteNome: string;
  equipamentoModelo: string;
  dataHoraLiberacao: string;
  formato: 'JSON' | 'ASTM' | 'HL7' | 'XML' | 'CSV';
  resultados: ISimulatedResultItem[];
  rawOutputPayload: string;
}

export class EquipamentoSimulatorService {
  /**
   * Valores de referência e geradores de resultados clínicos plausíveis por exame
   */
  private static MOCK_VALORES_PADRAO: Record<string, { valMin: number; valMax: number; unidade: string; ref: string }> = {
    // Bioquímica
    GLI: { valMin: 70, valMax: 99, unidade: 'mg/dL', ref: '70 a 99 mg/dL' },
    GLU: { valMin: 70, valMax: 99, unidade: 'mg/dL', ref: '70 a 99 mg/dL' },
    URE: { valMin: 15, valMax: 40, unidade: 'mg/dL', ref: '15 a 40 mg/dL' },
    UREA: { valMin: 15, valMax: 40, unidade: 'mg/dL', ref: '15 a 40 mg/dL' },
    CRE: { valMin: 0.6, valMax: 1.2, unidade: 'mg/dL', ref: '0.6 a 1.2 mg/dL' },
    CREA: { valMin: 0.6, valMax: 1.2, unidade: 'mg/dL', ref: '0.6 a 1.2 mg/dL' },
    ACU: { valMin: 3.5, valMax: 7.2, unidade: 'mg/dL', ref: '3.5 a 7.2 mg/dL' },
    UA: { valMin: 3.5, valMax: 7.2, unidade: 'mg/dL', ref: '3.5 a 7.2 mg/dL' },
    COL: { valMin: 140, valMax: 190, unidade: 'mg/dL', ref: '< 190 mg/dL' },
    CHOL: { valMin: 140, valMax: 190, unidade: 'mg/dL', ref: '< 190 mg/dL' },
    CHO: { valMin: 140, valMax: 190, unidade: 'mg/dL', ref: '< 190 mg/dL' },
    HDL: { valMin: 40, valMax: 65, unidade: 'mg/dL', ref: '> 40 mg/dL' },
    'HDL-C': { valMin: 40, valMax: 65, unidade: 'mg/dL', ref: '> 40 mg/dL' },
    LDL: { valMin: 70, valMax: 129, unidade: 'mg/dL', ref: '< 130 mg/dL' },
    'LDL-C': { valMin: 70, valMax: 129, unidade: 'mg/dL', ref: '< 130 mg/dL' },
    TRI: { valMin: 80, valMax: 145, unidade: 'mg/dL', ref: '< 150 mg/dL' },
    TRIG: { valMin: 80, valMax: 145, unidade: 'mg/dL', ref: '< 150 mg/dL' },
    TG: { valMin: 80, valMax: 145, unidade: 'mg/dL', ref: '< 150 mg/dL' },
    AST: { valMin: 15, valMax: 35, unidade: 'U/L', ref: 'Até 35 U/L' },
    ALT: { valMin: 12, valMax: 40, unidade: 'U/L', ref: 'Até 40 U/L' },
    GGT: { valMin: 12, valMax: 50, unidade: 'U/L', ref: '8 a 50 U/L' },
    ALP: { valMin: 40, valMax: 120, unidade: 'U/L', ref: '40 a 120 U/L' },
    BT: { valMin: 0.3, valMax: 1.1, unidade: 'mg/dL', ref: '0.2 a 1.2 mg/dL' },
    TBIL: { valMin: 0.3, valMax: 1.1, unidade: 'mg/dL', ref: '0.2 a 1.2 mg/dL' },
    BD: { valMin: 0.1, valMax: 0.3, unidade: 'mg/dL', ref: 'Até 0.4 mg/dL' },
    DBIL: { valMin: 0.1, valMax: 0.3, unidade: 'mg/dL', ref: 'Até 0.4 mg/dL' },
    PCR: { valMin: 0.5, valMax: 3.0, unidade: 'mg/L', ref: '< 5.0 mg/L' },
    CRP: { valMin: 0.5, valMax: 3.0, unidade: 'mg/L', ref: '< 5.0 mg/L' },

    // Hematologia
    WBC: { valMin: 4.5, valMax: 10.5, unidade: '10^3/µL', ref: '4.0 a 11.0 10^3/µL' },
    RBC: { valMin: 4.2, valMax: 5.4, unidade: '10^6/µL', ref: '4.2 a 5.8 10^6/µL' },
    HGB: { valMin: 13.0, valMax: 16.5, unidade: 'g/dL', ref: '12.5 a 17.0 g/dL' },
    HCT: { valMin: 39.0, valMax: 49.0, unidade: '%', ref: '37.0 a 50.0 %' },
    MCV: { valMin: 80.0, valMax: 98.0, unidade: 'fL', ref: '80.0 a 100.0 fL' },
    MCH: { valMin: 27.0, valMax: 32.0, unidade: 'pg', ref: '27.0 a 33.0 pg' },
    MCHC: { valMin: 32.0, valMax: 36.0, unidade: 'g/dL', ref: '32.0 a 36.0 g/dL' },
    PLT: { valMin: 150, valMax: 380, unidade: '10^3/µL', ref: '150 a 450 10^3/µL' },
    RDW: { valMin: 11.5, valMax: 14.5, unidade: '%', ref: '11.5 a 14.5 %' },

    // Imunologia (Access, etc.)
    TSH: { valMin: 0.4, valMax: 4.0, unidade: 'µUI/mL', ref: '0.40 a 4.50 µUI/mL' },
    T4L: { valMin: 0.8, valMax: 1.7, unidade: 'ng/dL', ref: '0.70 a 1.80 ng/dL' },
    PSA: { valMin: 0.4, valMax: 2.1, unidade: 'ng/mL', ref: '< 4.00 ng/mL' },
    BHCG: { valMin: 1.0, valMax: 4.0, unidade: 'mUI/mL', ref: 'Homens e Não Grávidas < 5.0' },
    VITD: { valMin: 25.0, valMax: 50.0, unidade: 'ng/mL', ref: '20.0 a 60.0 ng/mL' },
    VITDACCESS: { valMin: 25.0, valMax: 50.0, unidade: 'ng/mL', ref: '20.0 a 60.0 ng/mL' }
  };

  /**
   * Gera valores simulados realistas para uma lista de exames
   */
  static gerarResultadosSimulados(
    exames: Array<{ codigoEquipamento: string; nomeExame?: string; codigoLabfacil?: string }>,
    equipamentoModelo: string,
    simularAlterados = false
  ): ISimulatedResultItem[] {
    return exames.map((ex) => {
      const cod = ex.codigoEquipamento.toUpperCase().trim();
      const mockMeta = this.MOCK_VALORES_PADRAO[cod] || {
        valMin: 10,
        valMax: 100,
        unidade: 'U',
        ref: 'Padronizado'
      };

      let valorNumerico: number;
      let status: 'NORMAL' | 'ALTERADO' | 'CRITICO' = 'NORMAL';

      if (simularAlterados && Math.random() > 0.4) {
        // Gera valor fora da curva (alterado)
        valorNumerico = mockMeta.valMax * (1.3 + Math.random() * 0.5);
        status = 'ALTERADO';
      } else {
        // Gera valor normal dentro do intervalo
        const delta = mockMeta.valMax - mockMeta.valMin;
        valorNumerico = mockMeta.valMin + Math.random() * delta;
      }

      const valorFormatado = mockMeta.valMax < 10 ? valorNumerico.toFixed(2) : valorNumerico > 100 ? Math.round(valorNumerico).toString() : valorNumerico.toFixed(1);

      return {
        codigoEquipamento: ex.codigoEquipamento,
        codigoLabfacil: ex.codigoLabfacil || ex.codigoEquipamento,
        nomeExame: ex.nomeExame || ex.codigoEquipamento,
        valor: valorFormatado,
        unidade: mockMeta.unidade,
        valoresReferencia: mockMeta.ref,
        status
      };
    });
  }

  /**
   * Monta o pacote de retorno simulado do equipamento (HL7, ASTM, XML ou JSON)
   */
  static construirPayloadRetorno(
    pedidoNumero: string,
    pacienteNome: string,
    equipamentoModelo: string,
    resultados: ISimulatedResultItem[],
    formatoForcado?: 'JSON' | 'ASTM' | 'HL7' | 'XML'
  ): ISimulatedSampleRelease {
    const modeloUpper = equipamentoModelo.toUpperCase();
    const dataHoraIso = new Date().toISOString();
    const timestampCompacto = dataHoraIso.replace(/[-:T.]/g, '').slice(0, 14);

    let formato: 'JSON' | 'ASTM' | 'HL7' | 'XML' | 'CSV' = formatoForcado || 'JSON';
    let rawOutput = '';

    if (formatoForcado === 'XML' || modeloUpper.includes('XML')) {
      formato = 'XML';
      const examesXml = resultados.map(r => `      <Exame>
        <CodExame>${r.codigoEquipamento}</CodExame>
        <Secao>
          <Codigo>${r.codigoEquipamento}</Codigo>
          <Valor>${r.valor}</Valor>
        </Secao>
      </Exame>`).join('\n');

      rawOutput = `<Principal>
  <Paciente>
    <Amostra>${pedidoNumero}</Amostra>
    <Resultado>
${examesXml}
    </Resultado>
  </Paciente>
</Principal>`;
    } else if (formatoForcado === 'ASTM' || ((!formatoForcado) && (modeloUpper.includes('YUMIZEN') || modeloUpper.includes('ACCESS')))) {
      // Padrão ASTM E1394
      formato = 'ASTM';
      const lines = [
        `H|\\^&|||${equipamentoModelo}|||||||P|1|${timestampCompacto}`,
        `P|1|||${pedidoNumero}||${pacienteNome.replace(/\s+/g, '^')}||||||||||||||||`,
        `O|1|${pedidoNumero}||^^^GLOBAL|||||||F`,
        ...resultados.map((r, idx) => `R|${idx + 1}|^^^${r.codigoEquipamento}|${r.valor}|${r.unidade}|${r.valoresReferencia}|${r.status === 'NORMAL' ? 'N' : 'H'}||F||||${timestampCompacto}`),
        `L|1|N`
      ];
      rawOutput = lines.join('\r\n');
    } else if (formatoForcado === 'HL7' || ((!formatoForcado) && (modeloUpper.includes('BS_240') || modeloUpper.includes('BC_5380') || modeloUpper.includes('MINDRAY')))) {
      // Padrão HL7 v2.3.1 (ORU^R01)
      formato = 'HL7';
      const hl7Lines = [
        `MSH|^~\\&|${equipamentoModelo}|LAB|MIDWAY|LIS|${timestampCompacto}||ORU^R01|MSG${Date.now()}|P|2.3.1`,
        `PID|1||${pedidoNumero}||${pacienteNome}^^^|||U`,
        `OBR|1|${pedidoNumero}|${pedidoNumero}|PERFIL^Perfil de Exames|||${timestampCompacto}|||||||||||||||||F`,
        ...resultados.map((r, idx) => `OBX|${idx + 1}|NM|${r.codigoEquipamento}^${r.nomeExame}|1|${r.valor}|${r.unidade}|${r.valoresReferencia}|${r.status === 'NORMAL' ? 'N' : 'A'}|||F`)
      ];
      rawOutput = hl7Lines.join('\r\n');
    } else {
      // Padrão JSON (CB350, Invistar 300 ou Genérico)
      formato = 'JSON';
      const jsonRes = {
        equipamento: equipamentoModelo,
        origem: 'SIMULADOR_MOCK_MIDWAY',
        pedido: pedidoNumero,
        paciente: pacienteNome,
        data_analise: dataHoraIso,
        status_lote: 'CONCLUIDO',
        resultados: resultados.map(r => ({
          parametro: r.codigoEquipamento,
          valor: r.valor,
          unidade: r.unidade,
          referencia: r.valoresReferencia,
          bandeira: r.status
        }))
      };
      rawOutput = JSON.stringify(jsonRes, null, 2);
    }

    return {
      numeroPedido: pedidoNumero,
      pacienteNome,
      equipamentoModelo,
      dataHoraLiberacao: dataHoraIso,
      formato,
      resultados,
      rawOutputPayload: rawOutput
    };
  }
}
