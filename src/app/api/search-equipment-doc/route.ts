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
    imagem_url?: string;
    protocolos_suportados?: string[];
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

    let fabricante = 'Fabricante Laboratorial';
    let tipoAnalise = 'Bioquímica Clínica';
    let tipoComunicacao: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' = 'TCP_IP';

    if (tUpper.includes('ARQUIVO') || tUpper.includes('PASTA') || tUpper.includes('CB350')) {
      tipoComunicacao = 'ARQUIVO_COMPARTILHADO';
    }
    let formatoArquivo: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV' = 'HL7';
    let protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Bidirecional)';
    let protocolosSuportados: string[] = [
      'HL7 v2.3.1 (TCP/IP Bidirecional)',
      'ASTM E1394-97 (Serial RS-232 9600 8N1)'
    ];
    let porta: number | undefined = 5100;
    let baudRate: number | undefined = undefined;
    
    // Imagem padrão de fallback seguro
    let imagemUrl = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=500&q=80';
    let exames: IExamDoc[] = [];

    // Detecção com URLs Reais de Fabricantes e Distribuidores Oficiais
    if (tUpper.includes('SYSMEX') || tUpper.includes('UF') || tUpper.includes('XN') || tUpper.includes('XP') || tUpper.includes('XS') || tUpper.includes('KX')) {
      fabricante = 'Sysmex Corporation';
      
      if (tUpper.includes('UF') || tUpper.includes('1500') || tUpper.includes('5000') || tUpper.includes('4000') || tUpper.includes('URINA') || tUpper.includes('SEDIMENTO')) {
        // Sysmex UF-1500 / UF-5000 Foto Real
        imagemUrl = 'https://www.sysmex-europe.com/fileadmin/_processed_/0/3/csm_1-Images_Website_Product_Page_UF-15000_400x400_copy_2a6899f46d.png';
        tipoAnalise = 'Urinálise Automatizada & Citometria de Fluxo Fluorescente';
        protocoloComunicacao = 'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)',
          'HL7 v2.5 (TCP/IP Bidirecional)'
        ];
        tipoComunicacao = 'TCP_IP';
        formatoArquivo = 'ASTM';
        porta = 5100;
        exames = [
          { codigoEquipamento: 'RBC', nomeExame: 'Hemácias na Urina (Eritrócitos)', metodoOuPrincipio: 'Citometria de Fluxo com Laser Semicondutor', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'HEM_URINA', categoria: 'Elementos Formados' },
          { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos na Urina', metodoOuPrincipio: 'Citometria de Fluxo Fluorescente', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'LEUCO_URINA', categoria: 'Elementos Formados' },
          { codigoEquipamento: 'EC', nomeExame: 'Células Epiteliais Totais', metodoOuPrincipio: 'Citometria de Fluxo com Laser', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'CEL_EPIT', categoria: 'Elementos Formados' },
          { codigoEquipamento: 'CAST', nomeExame: 'Cilindros Hialinos / Patológicos', metodoOuPrincipio: 'Dispersão de Luz Polarizada', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'CILINDROS', categoria: 'Cilindros' },
          { codigoEquipamento: 'BACT', nomeExame: 'Bactérias Urinárias', metodoOuPrincipio: 'Citometria Fluorescente de Ácidos Nucleicos', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'BACTERIAS', categoria: 'Microbiologia' },
          { codigoEquipamento: 'XTAL', nomeExame: 'Cristais', metodoOuPrincipio: 'Dispersão de Luz Despolarizada', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'CRISTAIS', categoria: 'Cristais' },
          { codigoEquipamento: 'YLC', nomeExame: 'Leveduras / Fungos', metodoOuPrincipio: 'Citometria Fluorescente', amostraSugerida: 'Urina Fresca', unidadePadrao: '/µL', codigoLabfacilSugerido: 'LEVEDURAS', categoria: 'Microbiologia' }
        ];
      } else {
        // Sysmex XN-550 / XN-350 / XP-300 Foto Real
        imagemUrl = 'https://www.sysmex-europe.com/fileadmin/_processed_/d/7/csm_XN-550_left_01_07c3008b59.png';
        tipoAnalise = 'Hematologia Automatizada com Citometria Fluorescente';
        protocoloComunicacao = 'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)',
          'HL7 v2.5 (TCP/IP Porta 5100)'
        ];
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
      }
    } else if (tUpper.includes('MINDRAY')) {
      fabricante = 'Shenzhen Mindray Bio-Medical Electronics';
      
      if (tUpper.includes('BC') || tUpper.includes('5000') || tUpper.includes('6000') || tUpper.includes('5150') || tUpper.includes('5300') || tUpper.includes('5380')) {
        // Mindray BC-5380 / BC-5000 Foto Real
        imagemUrl = 'https://www.mindray.com/content/dam/xpace/en/products-solutions/products/laboratory-diagnostics/hematology/medium-test-volume/bc-5380/glp15-s1-web.jpg';
        tipoAnalise = 'Hematologia Completa (5 Part-Diff)';
        protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'HL7 v2.3.1 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)'
        ];
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
      } else if (tUpper.includes('3000')) {
        // Mindray BC-3000 Plus Foto Real
        imagemUrl = 'https://dipylonmedical.com/wp-content/uploads/2021/09/mindray-BC-3000Plus-300x300.jpeg';
        tipoAnalise = 'Hematologia Automatizada 3-Part Diff';
        protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
        protocolosSuportados = [
          'ASTM E1394-97 (Serial RS-232 9600 8N1)',
          'HL7 v2.3.1 (TCP/IP Porta 5100)'
        ];
        tipoComunicacao = 'SERIAL';
        formatoArquivo = 'ASTM';
        baudRate = 9600;
        exames = [
          { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
          { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria Sem Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
          { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
        ];
      } else {
        // Mindray BS-240 / BS-380 Foto Real
        imagemUrl = 'https://medisolve.com.bd/uploads/products/Mindray-BS-240-Fully-Automated-Chemistry-Analyzer@2x.jpg';
        tipoAnalise = 'Bioquímica Clínica & Turbidimetria';
        protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'HL7 v2.3.1 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)'
        ];
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
    } else if (tUpper.includes('ROCHE') || tUpper.includes('COBAS')) {
      fabricante = 'Roche Diagnostics';
      // Roche Cobas c311 / e411 Foto Oficial
      imagemUrl = 'https://pim-media.roche.com/896x504/Images/cobas%20c%20311-analyzer.jpg';
      tipoAnalise = tUpper.includes('E411') || tUpper.includes('E601') ? 'Imunologia por Eletroquimioluminescência (ECLIA)' : 'Bioquímica Clínica & Turbidimetria';
      protocoloComunicacao = 'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)';
      protocolosSuportados = [
        'ASTM E1394-97 / ASTM E1381 (TCP/IP Porta 5100)',
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'HL7 v2.5 (TCP/IP Bidirecional)'
      ];
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
      // Snibe Maglumi 800 Foto Real
      imagemUrl = 'http://www.globalhealthcaremedical.com/cdn/shop/files/Maglumi800.png';
      tipoAnalise = 'Imunoensaio por Quimioluminescência (CLIA)';
      protocoloComunicacao = 'ASTM E1394-97 (TCP/IP Porta 5100)';
      protocolosSuportados = [
        'ASTM E1394-97 (TCP/IP Porta 5100)',
        'ASTM E1394-97 (Serial RS-232 9600 8N1)'
      ];
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'ASTM';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'TSH', nomeExame: 'TSH Ultra-Sensível', metodoOuPrincipio: 'Quimioluminescência Flash (ABEI)', amostraSugerida: 'Soro', unidadePadrao: 'µIU/mL', codigoLabfacilSugerido: 'TSH', categoria: 'Tireoide' },
        { codigoEquipamento: 'FT4', nomeExame: 'T4 Livre', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'ng/dL', codigoLabfacilSugerido: 'T4LIVRE', categoria: 'Tireoide' },
        { codigoEquipamento: 'PSA', nomeExame: 'PSA Total', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'ng/mL', codigoLabfacilSugerido: 'PSA', categoria: 'Marcadores' },
        { codigoEquipamento: 'BETA-HCG', nomeExame: 'Beta HCG Quantitativo', metodoOuPrincipio: 'Quimioluminescência Flash', amostraSugerida: 'Soro', unidadePadrao: 'mIU/mL', codigoLabfacilSugerido: 'BHCG', categoria: 'Hormônios' }
      ];
    } else if (tUpper.includes('ZYBIO')) {
      fabricante = 'Zybio Inc.';
      if (tUpper.includes('Z5') || tUpper.includes('5-PART') || tUpper.includes('LASER')) {
        // Zybio Z5 Foto Oficial
        imagemUrl = 'https://www.zybio.com/static/home/img/en/z5_sec02.png';
        tipoAnalise = 'Hematologia 5-Part Diff Laser';
      } else {
        // Zybio Z3 Foto Oficial
        imagemUrl = 'https://www.zybio.com/static/home/img/en/z3_sec02.png';
        tipoAnalise = 'Hematologia 3-Part Diff';
      }
      protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
      protocolosSuportados = [
        'HL7 v2.3.1 (TCP/IP Porta 5100)',
        'ASTM E1394-97 (Serial RS-232 9600 8N1)'
      ];
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'HL7';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância Elétrica / Dispersão Laser', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
        { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria Livre de Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
      ];
    } else if (tUpper.includes('HORIBA') || tUpper.includes('YUMIZEN')) {
      fabricante = 'Horiba Medical';
      // Horiba Yumizen H500 Foto Oficial
      imagemUrl = 'https://static.horiba.com/fileadmin/Horiba/_processed_/9/7/csm_New_Yumizen_H500_Open_Tube_HORIBA_Medical_Hematology_Analyzer_825e301ed1.jpg';
      tipoAnalise = 'Hematologia Completa (5 Part-Diff)';
      protocoloComunicacao = 'ASTM E1394-97 (TCP/IP Porta 5100)';
      protocolosSuportados = [
        'ASTM E1394-97 (TCP/IP Porta 5100)',
        'ASTM E1394-97 (Serial RS-232 9600 8N1)'
      ];
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'ASTM';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância / Citometria', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
        { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
      ];
    } else if (tUpper.includes('WIENER') || tUpper.includes('CM250') || tUpper.includes('CM 250')) {
      fabricante = 'Wiener lab.';
      // Wiener CM 250 Foto Real
      imagemUrl = 'https://arguscientifica.com.br/wp-content/uploads/2025/01/CM250.webp';
      tipoAnalise = 'Bioquímica Clínica Automatizada';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
      protocolosSuportados = [
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'ASTM E1394-97 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'GLU', nomeExame: 'Glicose', metodoOuPrincipio: 'Enzimático GOD-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Bioquímica' },
        { codigoEquipamento: 'URE', nomeExame: 'Ureia UV', metodoOuPrincipio: 'Cinético UV', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Bioquímica' },
        { codigoEquipamento: 'CRE', nomeExame: 'Creatinina', metodoOuPrincipio: 'Cinético Jaffé', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Bioquímica' }
      ];
    } else if (tUpper.includes('CORMAY') || tUpper.includes('CB350') || tUpper.includes('MC240')) {
      fabricante = 'Cormay Diagnostics';
      // Cormay Accent MC240 / CB350 Foto Oficial
      imagemUrl = 'https://cormaydiagnostics.com/uploads/Clinical-Chemistry/Analizatory/Accent-MC240/_DSC8021_240.jpg';
      tipoAnalise = 'Bioquímica Clínica Automatizada';
      protocoloComunicacao = 'Arquivo Compartilhado (JSON Worklist / Retorno)';
      protocolosSuportados = [
        'Arquivo Compartilhado (JSON Worklist / Retorno)',
        'ASTM E1394-97 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'ARQUIVO_COMPARTILHADO';
      formatoArquivo = 'JSON';
      exames = [
        { codigoEquipamento: 'GLU', nomeExame: 'Glicose', metodoOuPrincipio: 'Enzimático GOD-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Bioquímica' },
        { codigoEquipamento: 'UREA', nomeExame: 'Ureia UV', metodoOuPrincipio: 'Cinético UV', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Bioquímica' },
        { codigoEquipamento: 'CREA', nomeExame: 'Creatinina', metodoOuPrincipio: 'Cinético Jaffé', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Bioquímica' }
      ];
    } else if (tUpper.includes('BECKMAN') || tUpper.includes('ACCESS')) {
      fabricante = 'Beckman Coulter';
      // Beckman Access 2 Foto Oficial
      imagemUrl = 'https://m.beckmancoulter.com/rs/213-HFT-078/images/Immun-Access2-web.jpg';
      tipoAnalise = 'Imunoensaio por Quimioluminescência (CLIA)';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
      protocolosSuportados = [
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'ASTM E1394-97 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'TSH', nomeExame: 'TSH 3ª Geração', metodoOuPrincipio: 'Quimioluminescência', amostraSugerida: 'Soro', unidadePadrao: 'µIU/mL', codigoLabfacilSugerido: 'TSH', categoria: 'Tireoide' },
        { codigoEquipamento: 'FT4', nomeExame: 'T4 Livre', metodoOuPrincipio: 'Quimioluminescência', amostraSugerida: 'Soro', unidadePadrao: 'ng/dL', codigoLabfacilSugerido: 'T4LIVRE', categoria: 'Tireoide' }
      ];
    } else if (tUpper.includes('DYMIND')) {
      fabricante = 'Dymind Biotechnology';
      // Dymind DH36 Foto Real
      imagemUrl = 'https://medigenix.co.ke/wp-content/uploads/2025/08/dh36-auto-hematology-analyzer-dymind-biotechnology-13069-9877107.jpg';
      tipoAnalise = 'Hematologia Automatizada 3-Part Diff';
      protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
      protocolosSuportados = [
        'HL7 v2.3.1 (TCP/IP Porta 5100)',
        'ASTM E1394-97 (Serial RS-232 9600 8N1)'
      ];
      tipoComunicacao = 'TCP_IP';
      formatoArquivo = 'HL7';
      porta = 5100;
      exames = [
        { codigoEquipamento: 'WBC', nomeExame: 'Leucócitos Totais', metodoOuPrincipio: 'Impedância Elétrica / Dispersão Laser', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'LEUCO', categoria: 'Série Branca' },
        { codigoEquipamento: 'RBC', nomeExame: 'Hemácias', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^6/µL', codigoLabfacilSugerido: 'HEMAC', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'HGB', nomeExame: 'Hemoglobina', metodoOuPrincipio: 'Fotometria Livre de Cianeto', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: 'g/dL', codigoLabfacilSugerido: 'HB', categoria: 'Série Vermelha' },
        { codigoEquipamento: 'PLT', nomeExame: 'Plaquetas', metodoOuPrincipio: 'Impedância Elétrica', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '10^3/µL', codigoLabfacilSugerido: 'PLAQUETAS', categoria: 'Plaquetas' }
      ];
    } else if (tUpper.includes('COAGULA') || tUpper.includes('STAGO') || tUpper.includes('IL') || tUpper.includes('ACL') || tUpper.includes('HUMACLOT')) {
      fabricante = tUpper.includes('HUMACLOT') ? 'HUMAN Diagnostics Worldwide' : 'Instrumentation Laboratory / Stago';
      // HumaClot Jr Foto Oficial
      imagemUrl = 'https://www.human.de/public/Product%20Media/Instruments/Image/919/image-thumb__919__middle-square/18680_T2.b179a24d.png';
      tipoAnalise = 'Coagulação Automatizada';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
      protocolosSuportados = [
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'ASTM E1394-97 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'PT', nomeExame: 'Tempo de Protrombina (TP / Segundos)', metodoOuPrincipio: 'Óptico Coagulométrico', amostraSugerida: 'Plasma Citratado', unidadePadrao: 's', codigoLabfacilSugerido: 'TP_SEG', categoria: 'Coagulação' },
        { codigoEquipamento: 'INR', nomeExame: 'INR / RNI', metodoOuPrincipio: 'Cálculo com ISI', amostraSugerida: 'Plasma Citratado', unidadePadrao: 'INR', codigoLabfacilSugerido: 'RNI', categoria: 'Coagulação' },
        { codigoEquipamento: 'APTT', nomeExame: 'TTPA (Tempo de Tromboplastina)', metodoOuPrincipio: 'Óptico Coagulométrico', amostraSugerida: 'Plasma Citratado', unidadePadrao: 's', codigoLabfacilSugerido: 'TTPA', categoria: 'Coagulação' },
        { codigoEquipamento: 'FIB', nomeExame: 'Fibrinogênio (Clauss)', metodoOuPrincipio: 'Método de Clauss', amostraSugerida: 'Plasma Citratado', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'FIBRI', categoria: 'Coagulação' }
      ];
    } else if (tUpper.includes('FIAPRESTO') || tUpper.includes('FINECARE') || tUpper.includes('BIOCON')) {
      fabricante = 'Biocon / Wondfo';
      // FIAPresto / Finecare Foto Real
      imagemUrl = 'http://biocondiagnosticos.com.br/wp-content/uploads/2024/10/HbA1c-FIA-Analyzer-Test.jpg';
      tipoAnalise = 'Hemoglobina Glicada por Imunofluorescência (FIA)';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
      protocolosSuportados = [
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'HL7 v2.3.1 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'HBA1C', nomeExame: 'Hemoglobina Glicada (HbA1c)', metodoOuPrincipio: 'Imunofluorescência Resolvida no Tempo', amostraSugerida: 'Sangue Total EDTA', unidadePadrao: '%', codigoLabfacilSugerido: 'HBA1C', categoria: 'Glicemia' }
      ];
    } else if (tUpper.includes('INVISTAR') || tUpper.includes('GENRUI') || tUpper.includes('WP300')) {
      fabricante = 'In Vitro / Genrui';
      // InviSTAR 300 Foto Real
      imagemUrl = 'https://invitro.com.br/wp-content/uploads/2021/12/InviSTAR-300-768x768.png';
      tipoAnalise = 'Bioquímica Clínica Automatizada';
      protocoloComunicacao = 'ASTM E1394-97 (Serial RS-232 9600 8N1)';
      protocolosSuportados = [
        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
        'ASTM E1394-97 (TCP/IP Porta 5100)'
      ];
      tipoComunicacao = 'SERIAL';
      formatoArquivo = 'ASTM';
      baudRate = 9600;
      exames = [
        { codigoEquipamento: 'GLU', nomeExame: 'Glicose', metodoOuPrincipio: 'GOD-PAP', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'GLICOSE', categoria: 'Bioquímica' },
        { codigoEquipamento: 'URE', nomeExame: 'Ureia', metodoOuPrincipio: 'UV Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'UREIA', categoria: 'Bioquímica' },
        { codigoEquipamento: 'CRE', nomeExame: 'Creatinina', metodoOuPrincipio: 'Jaffé Cinético', amostraSugerida: 'Soro', unidadePadrao: 'mg/dL', codigoLabfacilSugerido: 'CREATININA', categoria: 'Bioquímica' }
      ];
    } else {
      imagemUrl = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=500&q=80';
      if (tUpper.includes('HEM') || tUpper.includes('BLOOD') || tUpper.includes('DIFF')) {
        tipoAnalise = 'Hematologia Clínica';
        protocoloComunicacao = 'HL7 v2.3.1 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'HL7 v2.3.1 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)'
        ];
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
        protocoloComunicacao = 'ASTM E1394-97 (TCP/IP Porta 5100)';
        protocolosSuportados = [
          'ASTM E1394-97 (TCP/IP Porta 5100)',
          'HL7 v2.3.1 (TCP/IP Porta 5100)',
          'ASTM E1394-97 (Serial RS-232 9600 8N1)',
          'Arquivo Compartilhado (Carga JSON / Retorno)'
        ];
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
        diretorio_resultados: tipoComunicacao === 'ARQUIVO_COMPARTILHADO' ? `C:\\Equipamentos\\${codigoModelo}\\Resultados` : undefined,
        imagem_url: imagemUrl,
        protocolos_suportados: protocolosSuportados
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
