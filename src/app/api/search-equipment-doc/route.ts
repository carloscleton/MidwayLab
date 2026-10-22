import { NextRequest, NextResponse } from 'next/server';

interface IExamDoc {
  codigoEquipamento: string;
  nomeExame: string;
  metodoOuPrincipio: string;
  amostraSugerida: string;
  unidadePadrao: string;
  codigoLabfacilSugerido: string;
  categoria: string;
}

interface IFoundModelData {
  codigo_modelo: string;
  nome_completo: string;
  fabricante: string;
  tipo_analise: string;
  protocolo_comunicacao: string;
  descricao: string;
  configuracoes: {
    tipo_comunicacao: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO';
    formato_arquivo: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV';
    porta?: number;
    ip_host?: string;
    baud_rate?: number;
    data_bits?: number;
    stop_bits?: number;
    parity?: 'none' | 'even' | 'odd';
    diretorio_carga?: string;
    diretorio_resultados?: string;
  };
  exames: IExamDoc[];
}

export async function POST(req: NextRequest) {
  try {
    const { termo } = await req.json();
    if (!termo || typeof termo !== 'string' || !termo.trim()) {
      return NextResponse.json({ success: false, message: 'Termo de pesquisa obrigatório.' }, { status: 400 });
    }

    const t = termo.trim();
    const tUpper = t.toUpperCase();

    // 1. Base de conhecimento heurística de especificações laboratoriais de mercado
    // (Mindray, Sysmex, Roche, Beckman, Horiba, Biocon, Wiener, Abbott, Siemens, Dymind, Snibe, etc.)
    let fabricante = 'Fabricante Laboratorial';
    let tipoAnalise = 'Bioquímica Clínica';
    let tipoComunicacao: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' = 'TCP_IP';

    if (tUpper.includes('ARQUIVO') || tUpper.includes('PASTA') || tUpper.includes('CB350')) {
      tipoComunicacao = 'ARQUIVO_COMPARTILHADO';
    }
    let formatoArquivo: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV' = 'HL7';
    let protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Bidirecional)';
    let porta: number | undefined = 5100;
    let baudRate: number | undefined = undefined;
    let exames: IExamDoc[] = [];

    if (tUpper.includes('MINDRAY')) {
      fabricante = 'Shenzhen Mindray Bio-Medical Electronics';
      if (tUpper.includes('BC') || tUpper.includes('5000') || tUpper.includes('6000') || tUpper.includes('5150') || tUpper.includes('5300')) {
        tipoAnalise = 'Hematologia Completa (5 Part-Diff)';
        protocoloComunicacao = 'HL7 v2.3.1 / TCP-IP Porta 5100';
        tipoComunicacao = 'TCP_IP';
        formatoArquivo = 'HL7';
        porta = 5100;
        exames = [
          { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Citometria de Fluxo a Laser', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
          { codigoEquipamento: 'Neu#', nomeExame: 'Neutrófilos Absolutos', metodoOuPrincipio: 'Laser Dispersão Óptica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'NEUT_ABS', categoria: 'Diferencial' },
          { codigoEquipamento: 'Lym#', nomeExame: 'Linfócitos Absolutos', metodoOuPrincipio: 'Laser Dispersão Óptica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LINFO_ABS', categoria: 'Diferencial' },
          { codigoEquipamento: 'Mon#', nomeExame: 'Monócitos Absolutos', metodoOuPrincipio: 'Laser Dispersão Óptica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'MONO_ABS', categoria: 'Diferencial' },
          { codigoEquipamento: 'Eos#', nomeExame: 'Eosinófilos Absolutos', metodoOuPrincipio: 'Laser Dispersão Óptica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'EOS_ABS', categoria: 'Diferencial' },
          { codigoEquipamento: 'Bas#', nomeExame: 'Basófilos Absolutos', metodoOuPrincipio: 'Laser Dispersão Óptica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'BASO_ABS', categoria: 'Diferencial' },
          { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria Sem Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'HCT', nomeExame: 'Hematócrito', metodoOuPrincipio: 'Integração Cumulativa', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '%', codigoLabfacilSugerido: 'HT', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
        ];
      } else if (tUpper.includes('BS') || tUpper.includes('200') || tUpper.includes('300') || tUpper.includes('380') || tUpper.includes('400')) {
        tipoAnalise = 'Bioquímica Clínica & Turbidimetria';
        protocoloComunicacao = 'HL7 v2.3.1 / TCP-IP Porta 5100';
        tipoComunicacao = 'TCP_IP';
        formatoArquivo = 'HL7';
        porta = 5100;
        exames = [
          { codigoEquipamento: 'GLU', nomeExame: 'Glicose', metodoOuPrincipio: 'GOD-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Glicídios' },
          { codigoEquipamento: 'UREA', nomeExame: 'Ureia UV', metodoOuPrincipio: 'Urease Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Função Renal' },
          { codigoEquipamento: 'CREA', nomeExame: 'Creatinina', metodoOuPrincipio: 'Jaffé Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Função Renal' },
          { codigoEquipamento: 'CHOL', nomeExame: 'Colesterol Total', metodoOuPrincipio: 'CHOD-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'COL1TOTAL', categoria: 'Lipídios' },
          { codigoEquipamento: 'TRIG', nomeExame: 'Triglicerídeos', metodoOuPrincipio: 'GPO-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'TRIGLI', categoria: 'Lipídios' },
          { codigoEquipamento: 'ALT', nomeExame: 'TGP / ALT', metodoOuPrincipio: 'IFCC UV', amostraSugerida: 'Soro', unidadePadrao: 'U/L', codigoLabfacilSugerido: 'TGP', categoria: 'Hepático' },
          { codigoEquipamento: 'AST', nomeExame: 'TGO / AST', metodoOuPrincipio: 'IFCC UV', amostraSugerida: 'Soro', unidadePadrao: 'U/L', codigoLabfacilSugerido: 'TGO', categoria: 'Hepático' }
        ];
      }
    } else if (tUpper.includes('SYSMEX')) {
      fabricante = 'Sysmex Corporation';
      tipoAnalise = 'Hematologia Automatizada com Citometria Fluorescente';
      protocoloComunicacao = 'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100 ou Serial RS232)';
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'ASTM';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Citometria de Fluxo Fluorescente', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
        { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Foco Hidrodinâmico', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'SLS Livre de Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HCT', nomeExame: 'Hematócrito', metodoOuPrincipio: 'Detecção de Altura de Pulsos', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '%', codigoLabfacilSugerido: 'HT', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância com Foco Hidrodinâmico', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
      ];
    } else if (tUpper.includes('ROCHE') || tUpper.includes('COBAS')) {
      fabricante = 'Roche Diagnostics';
      tipoAnalise = tUpper.includes('E411') || tUpper.includes('E601') ? 'Imunologia por Eletroquimioluminescência (ECLIA)' : 'Bioquímica Clínica & Turbidimetria';
      protocoloComunicacao = 'ASTM E1394-97 / ASTM E1381 (Serial RS-232 ou TCP/IP)';
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'ASTM';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'GLUC3', nomeExame: 'Glicose HK', metodoOuPrincipio: 'Hexoquinase UV', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Glicídios' },
        { codigoEquipamento: 'CREJ2', nomeExame: 'Creatinina Jaffé Gen.2', metodoOuPrincipio: 'Jaffé Cinético Rate-Blanked', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Função Renal' },
        { codigoEquipamento: 'UREAL', nomeExame: 'Ureia Gen.2', metodoOuPrincipio: 'Cinético GLDH', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Função Renal' },
        { codigoEquipamento: 'CHOL2', nomeExame: 'Colesterol Gen.2', metodoOuPrincipio: 'Enzimático Colorimétrico', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'COL1TOTAL', categoria: 'Lipídios' },
        { codigoEquipamento: 'TRIGL', nomeExame: 'Triglicerídeos', metodoOuPrincipio: 'GPO-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'TRIGLI', categoria: 'Lipídios' }
      ];
    } else if (tUpper.includes('SNIBE') || tUpper.includes('MAGLUMI')) {
      fabricante = 'Snibe Diagnostic (Shenzhen New Industries)';
      tipoAnalise = 'Imunoensaio por Quimioluminescência (CLIA)';
      protocoloComunicacao = 'ASTM E1394 / TCP-IP ou Serial RS232';
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'ASTM';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'TSH', nomeExame: 'TSH Ultra-Sensível', metodoOuPrincipio: 'Quimioluminescência Flash (ABEI)', amostraSugerida: 'Soro', unidadePadrao: 'µIU/mL', codigoLabfacilSugerido: 'TSH', categoria: 'Tireoide' },
        { codigoEquipamento: 'FT4', nomeExame: 'T4 Livre', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'ng/dL', codigoLabfacilSugerido: 'T4LIVRE', categoria: 'Tireoide' },
        { codigoEquipamento: 'PSA', nomeExame: 'PSA Total', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'ng/mL', codigoLabfacilSugerido: 'PSA', categoria: 'Marcadores' },
        { codigoEquipamento: 'BETA-HCG', nomeExame: 'Beta HCG Quantitativo', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'mIU/mL', codigoLabfacilSugerido: 'BHCG', categoria: 'Hormônios' }
      ];
    } else if (tUpper.includes('DYMIND')) {
      fabricante = 'Dymind Biotechnology';
      tipoAnalise = 'Hematologia Automatizada';
      protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'HL7';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância Elétrica / Dispersão Laser', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
        { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria Livre de Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
      ];
    } else if (tUpper.includes('COAGULA') || tUpper.includes('STAGO') || tUpper.includes('IL') || tUpper.includes('ACL')) {
      fabricante = 'Instrumentation Laboratory / Stago';
      tipoAnalise = 'Coagulação Automatizada';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1 ou TCP/IP)';
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'PT', nomeExame: 'Tempo de Protrombina (TP / Segundos)', metodoOuPrincipio: 'Óptico Coagulométrico', amostraSugerida: 'Plasma Citratado', unidadePadrao: 's', codigoLabfacilSugerido: 'TP_SEG', categoria: 'Coagulação' },
        { codigoEquipamento: 'INR', nomeExame: 'INR / RNI', metodoOuPrincipio: 'Cálculo com ISI', amostraSugerida: 'Plasma Citratado', unidadePadrao: 'INR', codigoLabfacilSugerido: 'RNI', categoria: 'Coagulação' },
        { codigoEquipamento: 'APTT', nomeExame: 'TTPA (Tempo de Tromboplastina)', metodoOuPrincipio: 'Óptico Coagulométrico', amostraSugerida: 'Plasma Citratado', unidadePadrao: 's', codigoLabfacilSugerido: 'TTPA', categoria: 'Coagulação' },
        { codigoEquipamento: 'FIB', nomeExame: 'Fibrinogênio (Clauss)', metodoOuPrincipio: 'Método de Clauss', amostraSugerida: 'Plasma Citratado', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'FIBRI', categoria: 'Coagulação' }
      ];
    } else {
      // Padrão Geral / Inteligente: Analisa palavras chaves
      if (tUpper.includes('HEM') || tUpper.includes('BLOOD') || tUpper.includes('DIFF')) {
        tipoAnalise = 'Hematologia Clínica';
        protocoloComunicacao = 'HL7 v2.3.1 / ASTM E1394 (TCP-IP ou Serial)';
        formatoArquivo = 'HL7';
        exames = [
          { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância / Óptico', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
          { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Colorimetria', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'HCT', nomeExame: 'Hematócrito', metodoOuPrincipio: 'Integração de Pulsos', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '%', codigoLabfacilSugerido: 'HT', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
        ];
      } else {
        tipoAnalise = 'Bioquímica Clínica & Turbidimetria';
        protocoloComunicacao = 'ASTM E1394-97 / HL7 v2.3.1 (TCP/IP Porta 5100)';
        formatoArquivo = 'ASTM';
        exames = [
          { codigoEquipamento: 'GLU', nomeExame: 'Glicose', metodoOuPrincipio: 'Enzimático Colorimétrico', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Glicídios' },
          { codigoEquipamento: 'URE', nomeExame: 'Ureia', metodoOuPrincipio: 'UV Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Função Renal' },
          { codigoEquipamento: 'CRE', nomeExame: 'Creatinina', metodoOuPrincipio: 'Jaffé Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Função Renal' },
          { codigoEquipamento: 'COL', nomeExame: 'Colesterol Total', metodoOuPrincipio: 'Enzimático', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'COL1TOTAL', categoria: 'Lipídios' },
          { codigoEquipamento: 'TRI', nomeExame: 'Triglicerídeos', metodoOuPrincipio: 'Enzimático', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'TRIGLI', categoria: 'Lipídios' }
        ];
      }
    }

    // Gerar código único sanitizado
    const codigoModelo = tUpper
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);

    const resultado: IFoundModelData = {
      codigo_modelo: codigoModelo,
      nome_completo: t,
      fabricante,
      tipo_analise: tipoAnalise,
      protocolo_comunicacao: protocoloComunicacao,
      descricao: `Analisador laboratorial ${t}. Especificações técnicas estruturadas automaticamente para integração via ${protocoloComunicacao}.`,
      configuracoes: {
        tipo_comunicacao: tipoComunicacao,
        formato_arquivo: formatoArquivo,
        porta: porta,
        ip_host: tipoComunicacao === 'TCP_IP' ? '192.168.1.150' : undefined,
        baud_rate: baudRate || (tipoComunicacao === 'SERIAL' ? 9600 : undefined),
        data_bits: tipoComunicacao === 'SERIAL' ? 8 : undefined,
        stop_bits: tipoComunicacao === 'SERIAL' ? 1 : undefined,
        parity: tipoComunicacao === 'SERIAL' ? 'none' : undefined,
        diretorio_carga: tipoComunicacao === 'ARQUIVO_COMPARTILHADO' ? `C:\\Equipamentos\\${codigoModelo}\\Carga` : undefined,
        diretorio_resultados: tipoComunicacao === 'ARQUIVO_COMPARTILHADO' ? `C:\\Equipamentos\\${codigoModelo}\\Resultados` : undefined
      },
      exames
    };

    return NextResponse.json({
      success: true,
      data: resultado
    });
  } catch (err: any) {
    console.error('Erro na pesquisa de equipamento:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
