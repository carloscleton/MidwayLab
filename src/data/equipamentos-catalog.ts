// src/data/equipamentos-catalog.ts
// Catálogo de exames e códigos segundo a documentação técnica dos equipamentos
// Suporte nativo: Cormay CB350, Horiba Yumizen, Beckman Coulter Access, Mindray BC-3000, Mindray BC-5380, Mindray BS-240, Invistar 300

export interface IExameEquipamentoDoc {
  codigoEquipamento: string;
  nomeExame: string;
  metodoOuPrincipio: string;
  amostraSugerida: string;
  unidadePadrao: string;
  codigoLabfacilSugerido: string;
  categoria: string;
}

export interface IEquipamentoCatalogDoc {
  modelo: string;
  nomeCompleto: string;
  fabricante: string;
  tipoAnalise: string;
  protocoloComunicacao: string;
  descricaoDoc: string;
  exames: IExameEquipamentoDoc[];
}

export const CATALOGO_EQUIPAMENTOS_DOC: Record<string, IEquipamentoCatalogDoc> = {
  // 1. CORMAY CB350 / ACCENT MC240
  CB350: {
    modelo: "CB350",
    nomeCompleto: "Cormay Accent MC240 / CB350 Clinical Chemistry Analyzer",
    fabricante: "Cormay / PZ Cormay S.A.",
    tipoAnalise: "Bioquímica Clínica & Turbidimetria",
    protocoloComunicacao: "Worklist Arquivo Compartilhado (JSON / TXT / CSV)",
    descricaoDoc: "Analisador automático de bioquímica de acesso randômico com capacidade de até 300 testes/hora. Os códigos abaixo representam a nomenclatura padrão do software do analisador para mapeamento de worklist e recebimento de resultados.",
    exames: [
      { codigoEquipamento: "GLI", nomeExame: "Glicose (Glicemia de Jejum / Pós-Prandial)", metodoOuPrincipio: "GOD-PAP Enzimático", amostraSugerida: "Soro / Plasma Fluoretado", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "GLICOSE", categoria: "Glicídios" },
      { codigoEquipamento: "URE", nomeExame: "Ureia", metodoOuPrincipio: "Urease UV Cinético", amostraSugerida: "Soro / Plasma Heparina", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "UREIA", categoria: "Função Renal" },
      { codigoEquipamento: "CRE", nomeExame: "Creatinina", metodoOuPrincipio: "Jaffé Cinético / Enzimático", amostraSugerida: "Soro / Urina", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CREATININA", categoria: "Função Renal" },
      { codigoEquipamento: "ACU", nomeExame: "Ácido Úrico", metodoOuPrincipio: "Uricase POD", amostraSugerida: "Soro / Urina 24h", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "AC_URICO", categoria: "Metabolismo" },
      { codigoEquipamento: "COL", nomeExame: "Colesterol Total", metodoOuPrincipio: "CHOD-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "COL1TOTAL", categoria: "Lipídios" },
      { codigoEquipamento: "HDL", nomeExame: "HDL Colesterol Direto", metodoOuPrincipio: "Acelerador Detergente Seletivo", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "HDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "LDL", nomeExame: "LDL Colesterol Direto", metodoOuPrincipio: "Detergente Seletivo / Friedewald", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "LDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "TRI", nomeExame: "Triglicerídeos", metodoOuPrincipio: "GPO-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "TRIGLI", categoria: "Lipídios" },
      { codigoEquipamento: "AST", nomeExame: "TGO / AST (Aspartato Aminotransferase)", metodoOuPrincipio: "IFCC sem piridoxal fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGO", categoria: "Hepático" },
      { codigoEquipamento: "ALT", nomeExame: "TGP / ALT (Alanina Aminotransferase)", metodoOuPrincipio: "IFCC sem piridoxal fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGP", categoria: "Hepático" },
      { codigoEquipamento: "GGT", nomeExame: "Gama Glutamil Transferase (GGT)", metodoOuPrincipio: "Szasz / IFCC Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "GAMA_GT", categoria: "Hepático" },
      { codigoEquipamento: "ALP", nomeExame: "Fosfatase Alcalina (FALC)", metodoOuPrincipio: "p-NPP DEA / IFCC", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "FALCAL2016", categoria: "Hepático / Ósseo" },
      { codigoEquipamento: "BT", nomeExame: "Bilirrubina Total", metodoOuPrincipio: "Diazo com DCA / Dimetilsulfóxido", amostraSugerida: "Soro (Proteger da luz)", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BIL1TOT", categoria: "Hepático" },
      { codigoEquipamento: "BD", nomeExame: "Bilirrubina Direta", metodoOuPrincipio: "Diazo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BILIR_DIR", categoria: "Hepático" },
      { codigoEquipamento: "PT", nomeExame: "Proteínas Totais", metodoOuPrincipio: "Biureto", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "PROT1TOT", categoria: "Proteínas" },
      { codigoEquipamento: "ALB", nomeExame: "Albumina", metodoOuPrincipio: "Verde de Bromocresol (BCG)", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "ALBUMINA", categoria: "Proteínas" },
      { codigoEquipamento: "CA", nomeExame: "Cálcio Total", metodoOuPrincipio: "Arsenazo III / O-CPC", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CALCIO18", categoria: "Eletrólitos / Minerais" },
      { codigoEquipamento: "PHOS", nomeExame: "Fósforo Inorgânico", metodoOuPrincipio: "Fosfomolibdato UV", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "FOSFORO18", categoria: "Eletrólitos / Minerais" },
      { codigoEquipamento: "MG", nomeExame: "Magnésio", metodoOuPrincipio: "Xilidil Azul", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "MAGNESIO", categoria: "Eletrólitos / Minerais" },
      { codigoEquipamento: "FE", nomeExame: "Ferro Sérico", metodoOuPrincipio: "Ferrozine / Nitro-PAPS", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "FERRO18", categoria: "Anemia" },
      { codigoEquipamento: "CK", nomeExame: "Creatinoquinase Total (CPK)", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "CPK", categoria: "Cardíaco / Muscular" },
      { codigoEquipamento: "LDH", nomeExame: "Desidrogenase Láctica (LDH)", metodoOuPrincipio: "DGKC Piruvato-Lactato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "LDH", categoria: "Metabolismo" },
      { codigoEquipamento: "AMYL", nomeExame: "Amilase", metodoOuPrincipio: "CNPG3 Cinético", amostraSugerida: "Soro / Urina", unidadePadrao: "U/L", codigoLabfacilSugerido: "AMILASE", categoria: "Pancreático" },
      { codigoEquipamento: "LIP", nomeExame: "Lipase", metodoOuPrincipio: "Enzimático Colorimétrico", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "LIPASE", categoria: "Pancreático" },
      { codigoEquipamento: "PCR", nomeExame: "Proteína C Reativa (PCR)", metodoOuPrincipio: "Imunoturbidimetria Látex Ultra-Sensível", amostraSugerida: "Soro", unidadePadrao: "mg/L", codigoLabfacilSugerido: "PCR", categoria: "Inflamação" }
    ]
  },

  // 2. HORIBA YUMIZEN H500 / H550
  YUMIZEN: {
    modelo: "YUMIZEN",
    nomeCompleto: "Horiba Medical Yumizen H500 / H550 Hematology Analyzer",
    fabricante: "Horiba Medical",
    tipoAnalise: "Hematologia Completa (5 Part-Diff)",
    protocoloComunicacao: "ASTM E1394-97 / ASTM E1381 (Serial RS232 / TCP-IP)",
    descricaoDoc: "Analisador hematológico automatizado para contagem de células sanguíneas com diferencial de 5 partes de leucócitos (60 amostras/hora). No protocolo ASTM, o hemograma é requisitado pelo perfil global ou por parâmetros analíticos específicos.",
    exames: [
      { codigoEquipamento: "CBC", nomeExame: "Hemograma Completo sem Diferencial (CBC)", metodoOuPrincipio: "Impedância + Citometria Óptica", amostraSugerida: "Sangue Total EDTA K2/K3", unidadePadrao: "Painel", codigoLabfacilSugerido: "HEMOGRAMA", categoria: "Painel Global" },
      { codigoEquipamento: "DIFF", nomeExame: "Hemograma Completo com Diferencial 5 Partes (CBC+DIFF)", metodoOuPrincipio: "DHSS (Citometria com Foco Hidrodinâmico)", amostraSugerida: "Sangue Total EDTA K2/K3", unidadePadrao: "Painel", codigoLabfacilSugerido: "HEMO_FULL", categoria: "Painel Global" },
      { codigoEquipamento: "WBC", nomeExame: "Leucócitos Totais (White Blood Cells)", metodoOuPrincipio: "Impedância Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LEUCO", categoria: "Série Branca" },
      { codigoEquipamento: "RBC", nomeExame: "Hemácias / Glóbulos Vermelhos", metodoOuPrincipio: "Impedância Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^6/µL", codigoLabfacilSugerido: "HEMAC", categoria: "Série Vermelha" },
      { codigoEquipamento: "HGB", nomeExame: "Hemoglobina (Hemoglobin)", metodoOuPrincipio: "Fotometria sem cianeto", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "HB", categoria: "Série Vermelha" },
      { codigoEquipamento: "HCT", nomeExame: "Hematócrito (Hematocrit)", metodoOuPrincipio: "Integração cumulativa de pulsos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "HT", categoria: "Série Vermelha" },
      { codigoEquipamento: "MCV", nomeExame: "VCM (Volume Corpuscular Médio)", metodoOuPrincipio: "Cálculo RBC/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCH", nomeExame: "HCM (Hemoglobina Corpuscular Média)", metodoOuPrincipio: "Cálculo HGB/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "pg", codigoLabfacilSugerido: "HCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCHC", nomeExame: "CHCM (Concentração de HB Corpuscular)", metodoOuPrincipio: "Cálculo HGB/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "CHCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "RDW", nomeExame: "RDW (Amplitude de Distribuição das Hemácias)", metodoOuPrincipio: "Desvio padrão dos volumes de RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "RDW", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "PLT", nomeExame: "Plaquetas (Platelets)", metodoOuPrincipio: "Impedância com contagem dupla", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLAQUETAS", categoria: "Plaquetas" },
      { codigoEquipamento: "MPV", nomeExame: "VPM (Volume Plaquetário Médio)", metodoOuPrincipio: "Análise de histograma plaquetário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VPM", categoria: "Plaquetas" },
      { codigoEquipamento: "NEU", nomeExame: "Neutrófilos (Absoluto e %)", metodoOuPrincipio: "Absorbância Óptica + Dispersão Laser", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "% / 10^3/µL", codigoLabfacilSugerido: "NEUTRO", categoria: "Diferencial Leucocitário" },
      { codigoEquipamento: "LYM", nomeExame: "Linfócitos (Absoluto e %)", metodoOuPrincipio: "Absorbância Óptica + Dispersão Laser", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "% / 10^3/µL", codigoLabfacilSugerido: "LINFO", categoria: "Diferencial Leucocitário" },
      { codigoEquipamento: "MON", nomeExame: "Monócitos (Absoluto e %)", metodoOuPrincipio: "Absorbância Óptica + Dispersão Laser", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "% / 10^3/µL", codigoLabfacilSugerido: "MONO", categoria: "Diferencial Leucocitário" },
      { codigoEquipamento: "EOS", nomeExame: "Eosinófilos (Absoluto e %)", metodoOuPrincipio: "Absorbância Óptica + Dispersão Laser", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "% / 10^3/µL", codigoLabfacilSugerido: "EOSINO", categoria: "Diferencial Leucocitário" },
      { codigoEquipamento: "BAS", nomeExame: "Basófilos (Absoluto e %)", metodoOuPrincipio: "Canal Específico Lise Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "% / 10^3/µL", codigoLabfacilSugerido: "BASO", categoria: "Diferencial Leucocitário" }
    ]
  },

  // 3. BECKMAN COULTER ACCESS / ACCESS 2 (IMUNOLOGIA)
  ACCESS: {
    modelo: "ACCESS",
    nomeCompleto: "Beckman Coulter Access 2 Immunoassay System",
    fabricante: "Beckman Coulter Inc.",
    tipoAnalise: "Imunologia & Quimioluminescência",
    protocoloComunicacao: "ASTM 1394 / ASTM 1381 (Serial RS-232 / TCP-IP)",
    descricaoDoc: "Analisador automático de imunoensaio por quimioluminescência com partículas paramagnéticas. Comunicação padrão ASTM bidirecional para dosagens hormonais, marcadores cardíacos, tireoide, fertilidade e infecciosas.",
    exames: [
      { codigoEquipamento: "TSH", nomeExame: "TSH (Hormônio Estimulador da Tireoide)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro / Plasma Heparina", unidadePadrao: "µUI/mL", codigoLabfacilSugerido: "TSH", categoria: "Tireoide" },
      { codigoEquipamento: "T4L", nomeExame: "T4 Livre (Tiroxina Livre)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/dL", codigoLabfacilSugerido: "T4LIVRE", categoria: "Tireoide" },
      { codigoEquipamento: "T3T", nomeExame: "T3 Total (Triiodotironina Total)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/dL", codigoLabfacilSugerido: "T3TOTAL", categoria: "Tireoide" },
      { codigoEquipamento: "T4T", nomeExame: "T4 Total (Tiroxina Total)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "T4TOTAL", categoria: "Tireoide" },
      { codigoEquipamento: "PSA", nomeExame: "PSA Total (Antígeno Prostático Específico)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "PSATOT", categoria: "Marcadores Tumorais" },
      { codigoEquipamento: "PSAL", nomeExame: "PSA Livre", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "PSALIVRE", categoria: "Marcadores Tumorais" },
      { codigoEquipamento: "BHCG", nomeExame: "Beta-HCG Total (Gonadotrofina Coriônica)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "mUI/mL", codigoLabfacilSugerido: "BHCG", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "PRL", nomeExame: "Prolactina", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "PROLACTINA", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "FSH", nomeExame: "FSH (Hormônio Folículo Estimulante)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "mUI/mL", codigoLabfacilSugerido: "FSH", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "LH", nomeExame: "LH (Hormônio Luteinizante)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "mUI/mL", codigoLabfacilSugerido: "LH", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "E2", nomeExame: "Estradiol (E2)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "pg/mL", codigoLabfacilSugerido: "ESTRADIOL", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "PROG", nomeExame: "Progesterona", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "PROGESTERONA", categoria: "Fertilidade / Hormônios" },
      { codigoEquipamento: "TESTO", nomeExame: "Testosterona Total", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/dL", codigoLabfacilSugerido: "TESTOTOT", categoria: "Hormônios" },
      { codigoEquipamento: "CORT", nomeExame: "Cortisol Sérico", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "CORTISOL", categoria: "Hormônios" },
      { codigoEquipamento: "FERR", nomeExame: "Ferritina", metodoOuPrincipio: "Imunoensaio Quimioluminescente", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "FERRITINA", categoria: "Anemia" },
      { codigoEquipamento: "VITB12", nomeExame: "Vitamina B12 (Cobalamina)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro (Proteger da luz)", unidadePadrao: "pg/mL", codigoLabfacilSugerido: "VITB12", categoria: "Vitaminas" },
      { codigoEquipamento: "VITD", nomeExame: "Vitamina D (25-OH Vitamina D Total)", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "VITAMINA_D", categoria: "Vitaminas" },
      { codigoEquipamento: "INSUL", nomeExame: "Insulina Basal", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "µUI/mL", codigoLabfacilSugerido: "INSULINA", categoria: "Metabolismo" },
      { codigoEquipamento: "TROP", nomeExame: "Troponina I de Alta Sensibilidade", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro / Heparina", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "TROPONINA", categoria: "Marcadores Cardíacos" },
      { codigoEquipamento: "CKMB", nomeExame: "CK-MB Massa", metodoOuPrincipio: "Quimioluminescência Paramagnética", amostraSugerida: "Soro", unidadePadrao: "ng/mL", codigoLabfacilSugerido: "CKMB_MASSA", categoria: "Marcadores Cardíacos" }
    ]
  },

  // 4. MINDRAY BC-3000 PLUS (HEMATOLOGIA 3 PARTES)
  BC_3000: {
    modelo: "BC_3000",
    nomeCompleto: "Mindray BC-3000 Plus Auto Hematology Analyzer",
    fabricante: "Shenzhen Mindray Bio-Medical Electronics",
    tipoAnalise: "Hematologia Completa (3 Part-Diff - 19 Parâmetros)",
    protocoloComunicacao: "Serial RS-232 / Protocolo Mindray Texto ASCII",
    descricaoDoc: "Analisador hematológico automatizado para pequenos e médios laboratórios com diferencial de 3 partes de leucócitos, 19 parâmetros hematimétricos e 3 histogramas (WBC, RBC, PLT).",
    exames: [
      { codigoEquipamento: "WBC", nomeExame: "Leucócitos Totais (WBC)", metodoOuPrincipio: "Impedância Eletrônica Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LEUCO", categoria: "Série Branca" },
      { codigoEquipamento: "LYM#", nomeExame: "Linfócitos Absoluto (Lymph#)", metodoOuPrincipio: "Análise de Volume por Impedância", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LINFO_ABS", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "MID#", nomeExame: "Células Intermediárias Absoluto (Mid# - Monócitos/Eosinófilos)", metodoOuPrincipio: "Análise de Volume por Impedância", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "MID_ABS", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "GRAN#", nomeExame: "Granulócitos Absoluto (Gran# - Neutrófilos)", metodoOuPrincipio: "Análise de Volume por Impedância", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "GRAN_ABS", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "LYM%", nomeExame: "Linfócitos Porcentagem (Lymph%)", metodoOuPrincipio: "Cálculo Relativo", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "LINFO", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "MID%", nomeExame: "Células Intermediárias % (Mid%)", metodoOuPrincipio: "Cálculo Relativo", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "MID_REL", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "GRAN%", nomeExame: "Granulócitos Porcentagem (Gran%)", metodoOuPrincipio: "Cálculo Relativo", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "NEUTRO", categoria: "Diferencial 3-Part" },
      { codigoEquipamento: "RBC", nomeExame: "Hemácias (Red Blood Cells)", metodoOuPrincipio: "Impedância Eletrônica Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^6/µL", codigoLabfacilSugerido: "HEMAC", categoria: "Série Vermelha" },
      { codigoEquipamento: "HGB", nomeExame: "Hemoglobina", metodoOuPrincipio: "Fotometria Colorimétrica Cianmetemoglobina", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "HB", categoria: "Série Vermelha" },
      { codigoEquipamento: "HCT", nomeExame: "Hematócrito", metodoOuPrincipio: "Integração de Pulsos de Volume", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "HT", categoria: "Série Vermelha" },
      { codigoEquipamento: "MCV", nomeExame: "VCM (Volume Corpuscular Médio)", metodoOuPrincipio: "Cálculo Direto HCT/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "MCH", nomeExame: "HCM (Hemoglobina Corpuscular Média)", metodoOuPrincipio: "Cálculo HGB/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "pg", codigoLabfacilSugerido: "HCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "MCHC", nomeExame: "CHCM (Concentração Corpuscular Média)", metodoOuPrincipio: "Cálculo HGB/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "CHCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "RDW-CV", nomeExame: "RDW-CV (Coeficiente de Variação)", metodoOuPrincipio: "Análise Estatística de Histograma RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "RDW", categoria: "Série Vermelha" },
      { codigoEquipamento: "RDW-SD", nomeExame: "RDW-SD (Desvio Padrão)", metodoOuPrincipio: "Largura do Histograma a 20% do pico", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "RDW_SD", categoria: "Série Vermelha" },
      { codigoEquipamento: "PLT", nomeExame: "Plaquetas (Platelets)", metodoOuPrincipio: "Impedância Eletrônica Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLAQUETAS", categoria: "Plaquetas" },
      { codigoEquipamento: "MPV", nomeExame: "VPM (Volume Plaquetário Médio)", metodoOuPrincipio: "Histograma Plaquetário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VPM", categoria: "Plaquetas" },
      { codigoEquipamento: "PDW", nomeExame: "PDW (Distribuição Plaquetária)", metodoOuPrincipio: "Largura Geométrica da Distribuição", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PDW", categoria: "Plaquetas" },
      { codigoEquipamento: "PCT", nomeExame: "Plaquetócrito (PCT)", metodoOuPrincipio: "Cálculo PLT * MPV", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PCT", categoria: "Plaquetas" }
    ]
  },

  // 5. MINDRAY BC-5380 (HEMATOLOGIA 5 PARTES)
  BC_5380: {
    modelo: "BC_5380",
    nomeCompleto: "Mindray BC-5380 Auto Hematology Analyzer",
    fabricante: "Shenzhen Mindray Bio-Medical Electronics",
    tipoAnalise: "Hematologia Completa (5 Part-Diff - 27 Parâmetros)",
    protocoloComunicacao: "HL7 v2.3.1 / TCP-IP (Porta Padrão 5100) ou Serial RS-232",
    descricaoDoc: "Analisador hematológico automatizado com dispersão laser semicondutora + método de citometria de fluxo com corante químico. Diferenciação completa de 5 partes de leucócitos com carregador automático de tubos.",
    exames: [
      { codigoEquipamento: "WBC", nomeExame: "Leucócitos Totais (WBC)", metodoOuPrincipio: "Dispersão Laser Semicondutora + Citometria", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LEUCO", categoria: "Série Branca" },
      { codigoEquipamento: "NEU#", nomeExame: "Neutrófilos Absoluto (Neu#)", metodoOuPrincipio: "Dispersão Laser em 3 ângulos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "NEUTRO_ABS", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "LYM#", nomeExame: "Linfócitos Absoluto (Lym#)", metodoOuPrincipio: "Dispersão Laser em 3 ângulos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LINFO_ABS", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "MON#", nomeExame: "Monócitos Absoluto (Mon#)", metodoOuPrincipio: "Dispersão Laser em 3 ângulos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "MONO_ABS", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "EOS#", nomeExame: "Eosinófilos Absoluto (Eos#)", metodoOuPrincipio: "Dispersão Laser em 3 ângulos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "EOSINO_ABS", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "BAS#", nomeExame: "Basófilos Absoluto (Bas#)", metodoOuPrincipio: "Canal Específico de Impedância + Lise", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "BASO_ABS", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "NEU%", nomeExame: "Neutrófilos % (Neu%)", metodoOuPrincipio: "Cálculo Relativo Leucocitário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "NEUTRO", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "LYM%", nomeExame: "Linfócitos % (Lym%)", metodoOuPrincipio: "Cálculo Relativo Leucocitário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "LINFO", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "MON%", nomeExame: "Monócitos % (Mon%)", metodoOuPrincipio: "Cálculo Relativo Leucocitário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "MONO", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "EOS%", nomeExame: "Eosinófilos % (Eos%)", metodoOuPrincipio: "Cálculo Relativo Leucocitário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "EOSINO", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "BAS%", nomeExame: "Basófilos % (Bas%)", metodoOuPrincipio: "Cálculo Relativo Leucocitário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "BASO", categoria: "Diferencial 5-Part" },
      { codigoEquipamento: "RBC", nomeExame: "Hemácias (RBC)", metodoOuPrincipio: "Foco Hidrodinâmico + Impedância", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^6/µL", codigoLabfacilSugerido: "HEMAC", categoria: "Série Vermelha" },
      { codigoEquipamento: "HGB", nomeExame: "Hemoglobina", metodoOuPrincipio: "Fotometria sem Cianeto", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "HB", categoria: "Série Vermelha" },
      { codigoEquipamento: "HCT", nomeExame: "Hematócrito", metodoOuPrincipio: "Integração Cumulativa de Pulsos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "HT", categoria: "Série Vermelha" },
      { codigoEquipamento: "MCV", nomeExame: "VCM", metodoOuPrincipio: "Cálculo Direto RBC/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "MCH", nomeExame: "HCM", metodoOuPrincipio: "Cálculo HGB/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "pg", codigoLabfacilSugerido: "HCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "MCHC", nomeExame: "CHCM", metodoOuPrincipio: "Cálculo HGB/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "CHCM", categoria: "Constantes Corpuscular" },
      { codigoEquipamento: "RDW-CV", nomeExame: "RDW-CV", metodoOuPrincipio: "Coeficiente de Variação Histograma", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "RDW", categoria: "Série Vermelha" },
      { codigoEquipamento: "RDW-SD", nomeExame: "RDW-SD", metodoOuPrincipio: "Desvio Padrão de Volume RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "RDW_SD", categoria: "Série Vermelha" },
      { codigoEquipamento: "PLT", nomeExame: "Plaquetas (PLT)", metodoOuPrincipio: "Impedância com Foco Hidrodinâmico", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLAQUETAS", categoria: "Plaquetas" },
      { codigoEquipamento: "MPV", nomeExame: "VPM", metodoOuPrincipio: "Histograma Plaquetário", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VPM", categoria: "Plaquetas" },
      { codigoEquipamento: "PDW", nomeExame: "PDW", metodoOuPrincipio: "Análise de Distribuição Plaquetária", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PDW", categoria: "Plaquetas" },
      { codigoEquipamento: "PCT", nomeExame: "Plaquetócrito (PCT)", metodoOuPrincipio: "Cálculo PLT * MPV", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PCT", categoria: "Plaquetas" },
      { codigoEquipamento: "P-LCC", nomeExame: "Contagem de Grandes Plaquetas (P-LCC)", metodoOuPrincipio: "Impedância Coulter", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLCC", categoria: "Plaquetas" },
      { codigoEquipamento: "P-LCR", nomeExame: "Proporção de Grandes Plaquetas (P-LCR)", metodoOuPrincipio: "Cálculo P-LCC / PLT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PLCR", categoria: "Plaquetas" }
    ]
  },

  // 6. MINDRAY BS-240 (BIOQUÍMICA CLÍNICA)
  BS_240: {
    modelo: "BS_240",
    nomeCompleto: "Mindray BS-240 Clinical Chemistry Analyzer",
    fabricante: "Shenzhen Mindray Bio-Medical Electronics",
    tipoAnalise: "Bioquímica Clínica & Turbidimetria (200 testes/h)",
    protocoloComunicacao: "HL7 v2.3.1 / TCP-IP Bidirecional ou Serial RS-232",
    descricaoDoc: "Analisador automático de bancada para química clínica com protocolo HL7 nativo da Mindray. Permite consulta de lista de trabalho (worklist query) em tempo real e envio de resultados automatizado.",
    exames: [
      { codigoEquipamento: "GLU", nomeExame: "Glicose (Glucose)", metodoOuPrincipio: "GOD-PAP Enzimático", amostraSugerida: "Soro / Plasma Fluoretado", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "GLICOSE", categoria: "Glicídios" },
      { codigoEquipamento: "UREA", nomeExame: "Ureia (Urea)", metodoOuPrincipio: "Urease UV Cinético", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "UREIA", categoria: "Função Renal" },
      { codigoEquipamento: "CREA", nomeExame: "Creatinina (Creatinine)", metodoOuPrincipio: "Jaffé Cinético / Enzimático", amostraSugerida: "Soro / Urina", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CREATININA", categoria: "Função Renal" },
      { codigoEquipamento: "UA", nomeExame: "Ácido Úrico (Uric Acid)", metodoOuPrincipio: "Uricase POD", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "AC_URICO", categoria: "Metabolismo" },
      { codigoEquipamento: "CHOL", nomeExame: "Colesterol Total (Cholesterol)", metodoOuPrincipio: "CHOD-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "COL1TOTAL", categoria: "Lipídios" },
      { codigoEquipamento: "HDL-C", nomeExame: "HDL Colesterol Direto", metodoOuPrincipio: "Detergente Seletivo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "HDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "LDL-C", nomeExame: "LDL Colesterol Direto", metodoOuPrincipio: "Detergente Seletivo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "LDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "TRIG", nomeExame: "Triglicerídeos (Triglycerides)", metodoOuPrincipio: "GPO-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "TRIGLI", categoria: "Lipídios" },
      { codigoEquipamento: "ALT", nomeExame: "TGP / ALT (Alanine Aminotransferase)", metodoOuPrincipio: "IFCC sem piridoxal fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGP", categoria: "Hepático" },
      { codigoEquipamento: "AST", nomeExame: "TGO / AST (Aspartate Aminotransferase)", metodoOuPrincipio: "IFCC sem piridoxal fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGO", categoria: "Hepático" },
      { codigoEquipamento: "GGT", nomeExame: "Gama GT (GGT)", metodoOuPrincipio: "Szasz / IFCC Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "GAMA_GT", categoria: "Hepático" },
      { codigoEquipamento: "ALP", nomeExame: "Fosfatase Alcalina (Alkaline Phosphatase)", metodoOuPrincipio: "p-NPP AMP / IFCC", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "FALCAL2016", categoria: "Hepático" },
      { codigoEquipamento: "TBIL", nomeExame: "Bilirrubina Total (Total Bilirubin)", metodoOuPrincipio: "Diazo com DCA", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BIL1TOT", categoria: "Hepático" },
      { codigoEquipamento: "DBIL", nomeExame: "Bilirrubina Direta (Direct Bilirubin)", metodoOuPrincipio: "Diazo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BILIR_DIR", categoria: "Hepático" },
      { codigoEquipamento: "TP", nomeExame: "Proteínas Totais (Total Protein)", metodoOuPrincipio: "Biureto", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "PROT1TOT", categoria: "Proteínas" },
      { codigoEquipamento: "ALB", nomeExame: "Albumina (Albumin)", metodoOuPrincipio: "Verde de Bromocresol", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "ALBUMINA", categoria: "Proteínas" },
      { codigoEquipamento: "CA", nomeExame: "Cálcio Total (Calcium)", metodoOuPrincipio: "Arsenazo III", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CALCIO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "P", nomeExame: "Fósforo Inorgânico (Phosphorus)", metodoOuPrincipio: "Fosfomolibdato UV", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "FOSFORO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "MG", nomeExame: "Magnésio (Magnesium)", metodoOuPrincipio: "Xilidil Azul", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "MAGNESIO", categoria: "Eletrólitos" },
      { codigoEquipamento: "FE", nomeExame: "Ferro Sérico (Iron)", metodoOuPrincipio: "Ferrozine", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "FERRO18", categoria: "Anemia" },
      { codigoEquipamento: "AMY", nomeExame: "Amilase (Amylase)", metodoOuPrincipio: "CNPG3 Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "AMILASE", categoria: "Pancreático" },
      { codigoEquipamento: "LIP", nomeExame: "Lipase", metodoOuPrincipio: "Colorimétrico Enzimático", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "LIPASE", categoria: "Pancreático" },
      { codigoEquipamento: "CK", nomeExame: "CPK Total (Creatine Kinase)", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "CPK", categoria: "Cardíaco" },
      { codigoEquipamento: "LDH", nomeExame: "Desidrogenase Láctica (LDH)", metodoOuPrincipio: "DGKC Lactato-Piruvato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "LDH", categoria: "Metabolismo" },
      { codigoEquipamento: "CRP", nomeExame: "Proteína C Reativa (CRP)", metodoOuPrincipio: "Imunoturbidimetria com Látex", amostraSugerida: "Soro", unidadePadrao: "mg/L", codigoLabfacilSugerido: "PCR", categoria: "Inflamação" }
    ]
  },

  // 7. INVISTAR 300 / GENRUI WP300 (BIOQUÍMICA CLÍNICA)
  INVISTAR_300: {
    modelo: "INVISTAR_300",
    nomeCompleto: "Invistar 300 / Genrui WP300 Chemistry Analyzer",
    fabricante: "Invistar / Genrui Biotech",
    tipoAnalise: "Bioquímica Clínica & Turbidimetria (300 testes/h)",
    protocoloComunicacao: "Serial RS-232 / TCP-IP (Protocolo ASCII / ASTM)",
    descricaoDoc: "Analisador automático de química clínica de 300 testes/hora. Suporta comunicação serial bidirecional e por arquivos de worklist para intercâmbio de dados com LIS.",
    exames: [
      { codigoEquipamento: "GLU", nomeExame: "Glicose", metodoOuPrincipio: "GOD-PAP Enzimático", amostraSugerida: "Soro / Plasma", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "GLICOSE", categoria: "Glicídios" },
      { codigoEquipamento: "URE", nomeExame: "Ureia", metodoOuPrincipio: "Urease UV Cinético", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "UREIA", categoria: "Função Renal" },
      { codigoEquipamento: "CRE", nomeExame: "Creatinina", metodoOuPrincipio: "Jaffé Cinético", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CREATININA", categoria: "Função Renal" },
      { codigoEquipamento: "UA", nomeExame: "Ácido Úrico", metodoOuPrincipio: "Uricase POD", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "AC_URICO", categoria: "Metabolismo" },
      { codigoEquipamento: "CHO", nomeExame: "Colesterol Total", metodoOuPrincipio: "CHOD-PAP", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "COL1TOTAL", categoria: "Lipídios" },
      { codigoEquipamento: "HDL", nomeExame: "HDL Colesterol", metodoOuPrincipio: "Detergente Seletivo", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "HDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "LDL", nomeExame: "LDL Colesterol", metodoOuPrincipio: "Detergente Seletivo", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "LDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "TG", nomeExame: "Triglicerídeos", metodoOuPrincipio: "GPO-PAP", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "TRIGLI", categoria: "Lipídios" },
      { codigoEquipamento: "ALT", nomeExame: "TGP / ALT", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGP", categoria: "Hepático" },
      { codigoEquipamento: "AST", nomeExame: "TGO / AST", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGO", categoria: "Hepático" },
      { codigoEquipamento: "GGT", nomeExame: "Gama GT", metodoOuPrincipio: "Szasz Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "GAMA_GT", categoria: "Hepático" },
      { codigoEquipamento: "ALP", nomeExame: "Fosfatase Alcalina", metodoOuPrincipio: "p-NPP DEA", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "FALCAL2016", categoria: "Hepático" },
      { codigoEquipamento: "TB", nomeExame: "Bilirrubina Total", metodoOuPrincipio: "Diazo DCA", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BIL1TOT", categoria: "Hepático" },
      { codigoEquipamento: "DB", nomeExame: "Bilirrubina Direta", metodoOuPrincipio: "Diazo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BILIR_DIR", categoria: "Hepático" },
      { codigoEquipamento: "TP", nomeExame: "Proteínas Totais", metodoOuPrincipio: "Biureto", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "PROT1TOT", categoria: "Proteínas" },
      { codigoEquipamento: "ALB", nomeExame: "Albumina", metodoOuPrincipio: "Verde de Bromocresol", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "ALBUMINA", categoria: "Proteínas" },
      { codigoEquipamento: "CA", nomeExame: "Cálcio", metodoOuPrincipio: "Arsenazo III", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CALCIO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "P", nomeExame: "Fósforo", metodoOuPrincipio: "Fosfomolibdato UV", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "FOSFORO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "MG", nomeExame: "Magnésio", metodoOuPrincipio: "Xilidil Azul", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "MAGNESIO", categoria: "Eletrólitos" },
      { codigoEquipamento: "FE", nomeExame: "Ferro Sérico", metodoOuPrincipio: "Ferrozine", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "FERRO18", categoria: "Anemia" },
      { codigoEquipamento: "CK", nomeExame: "CK Total", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "CPK", categoria: "Cardíaco" },
      { codigoEquipamento: "LDH", nomeExame: "LDH", metodoOuPrincipio: "DGKC Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "LDH", categoria: "Metabolismo" },
      { codigoEquipamento: "AMY", nomeExame: "Amilase", metodoOuPrincipio: "CNPG3 Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "AMILASE", categoria: "Pancreático" },
      { codigoEquipamento: "CRP", nomeExame: "Proteína C Reativa", metodoOuPrincipio: "Imunoturbidimetria Látex", amostraSugerida: "Soro", unidadePadrao: "mg/L", codigoLabfacilSugerido: "PCR", categoria: "Inflamação" }
    ]
  },

  // 8. ZYBIO Z3 (HEMATOLOGIA 3-PART)
  ZYBIO_Z3: {
    modelo: "ZYBIO_Z3",
    nomeCompleto: "Zybio Z3 Hematology Analyzer (3-Part Diff)",
    fabricante: "Zybio Inc.",
    tipoAnalise: "Hematologia Completa (3 Part-Diff - 70 amostras/h)",
    protocoloComunicacao: "HL7 v2.3.1 / ASTM E1394 (TCP-IP / RS-232)",
    descricaoDoc: "Contador hematológico automatizado de 3 partes (21 parâmetros + 3 histogramas). Comunicação bidirecional via protocolo HL7/ASTM sobre porta de rede TCP/IP ou serial RS232.",
    exames: [
      { codigoEquipamento: "WBC", nomeExame: "Leucócitos Totais (White Blood Cells)", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LEUCO", categoria: "Série Branca" },
      { codigoEquipamento: "LYM#", nomeExame: "Linfócitos Absolutos", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LINFO_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "MID#", nomeExame: "Células Médias / Monócitos Absolutos", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "MONO_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "GRAN#", nomeExame: "Granulócitos / Neutrófilos Absolutos", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "NEUT_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "LYM%", nomeExame: "Linfócitos Relativos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "LINFO_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "MID%", nomeExame: "Células Médias (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "MONO_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "GRAN%", nomeExame: "Granulócitos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "NEUT_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "RBC", nomeExame: "Hemácias / Glóbulos Vermelhos", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^6/µL", codigoLabfacilSugerido: "HEMAC", categoria: "Série Vermelha" },
      { codigoEquipamento: "HGB", nomeExame: "Hemoglobina", metodoOuPrincipio: "Fotometria Livre de Cianeto", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "HB", categoria: "Série Vermelha" },
      { codigoEquipamento: "HCT", nomeExame: "Hematócrito", metodoOuPrincipio: "Integração Cumulativa", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "HT", categoria: "Série Vermelha" },
      { codigoEquipamento: "MCV", nomeExame: "VCM (Volume Corpuscular Médio)", metodoOuPrincipio: "Cálculo HCT/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCH", nomeExame: "HCM (Hemoglobina Corpuscular Média)", metodoOuPrincipio: "Cálculo HGB/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "pg", codigoLabfacilSugerido: "HCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCHC", nomeExame: "CHCM (Concentração de Hb Corpuscular)", metodoOuPrincipio: "Cálculo HGB/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "CHCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "RDW-CV", nomeExame: "RDW-CV (Coeficiente de Variação)", metodoOuPrincipio: "Cálculo Estatístico", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "RDW_CV", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "RDW-SD", nomeExame: "RDW-SD (Desvio Padrão)", metodoOuPrincipio: "Largura da Distribuição", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "RDW_SD", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "PLT", nomeExame: "Plaquetas (Platelets)", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLAQUETAS", categoria: "Plaquetas" },
      { codigoEquipamento: "MPV", nomeExame: "VPM (Volume Plaquetário Médio)", metodoOuPrincipio: "Curva Plaquetária", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VPM", categoria: "Plaquetas" },
      { codigoEquipamento: "PDW", nomeExame: "PDW (Largura Distribuição Plaquetas)", metodoOuPrincipio: "Cálculo Geométrico", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PDW", categoria: "Plaquetas" },
      { codigoEquipamento: "PCT", nomeExame: "Plaquetócrito (PCT)", metodoOuPrincipio: "Cálculo PLTxMPV", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PCT", categoria: "Plaquetas" }
    ]
  },

  // 9. ZYBIO Z5 (HEMATOLOGIA 5-PART)
  ZYBIO_Z5: {
    modelo: "ZYBIO_Z5",
    nomeCompleto: "Zybio Z5 Hematology Analyzer (5-Part Diff)",
    fabricante: "Zybio Inc.",
    tipoAnalise: "Hematologia Completa (5 Part-Diff Laser - 60 amostras/h)",
    protocoloComunicacao: "HL7 v2.3.1 / ASTM E1394 (TCP-IP / RS-232)",
    descricaoDoc: "Analisador hematológico automático de 5 partes com citometria de fluxo a laser e método de impedância (29 parâmetros + 3 diagramas de dispersão 3D). Comunicação via TCP/IP HL7 ou ASTM bidirecional.",
    exames: [
      { codigoEquipamento: "WBC", nomeExame: "Leucócitos Totais", metodoOuPrincipio: "Citometria de Fluxo a Laser", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LEUCO", categoria: "Série Branca" },
      { codigoEquipamento: "NEU#", nomeExame: "Neutrófilos Absolutos", metodoOuPrincipio: "Dispersão Laser Semi-Condutor", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "NEUT_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "LYM#", nomeExame: "Linfócitos Absolutos", metodoOuPrincipio: "Dispersão Laser Semi-Condutor", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "LINFO_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "MON#", nomeExame: "Monócitos Absolutos", metodoOuPrincipio: "Dispersão Laser Semi-Condutor", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "MONO_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "EOS#", nomeExame: "Eosinófilos Absolutos", metodoOuPrincipio: "Dispersão Laser Semi-Condutor", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "EOS_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "BAS#", nomeExame: "Basófilos Absolutos", metodoOuPrincipio: "Canal Óptico Dedicado WNB/BASO", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "BASO_ABS", categoria: "Diferencial" },
      { codigoEquipamento: "NEU%", nomeExame: "Neutrófilos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "NEUT_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "LYM%", nomeExame: "Linfócitos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "LINFO_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "MON%", nomeExame: "Monócitos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "MONO_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "EOS%", nomeExame: "Eosinófilos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "EOS_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "BAS%", nomeExame: "Basófilos (%)", metodoOuPrincipio: "Cálculo Diferencial", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "BASO_PORC", categoria: "Diferencial" },
      { codigoEquipamento: "RBC", nomeExame: "Hemácias", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^6/µL", codigoLabfacilSugerido: "HEMAC", categoria: "Série Vermelha" },
      { codigoEquipamento: "HGB", nomeExame: "Hemoglobina", metodoOuPrincipio: "Colorimetria Livre de Cianeto", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "HB", categoria: "Série Vermelha" },
      { codigoEquipamento: "HCT", nomeExame: "Hematócrito", metodoOuPrincipio: "Integração de Pulsos", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "HT", categoria: "Série Vermelha" },
      { codigoEquipamento: "MCV", nomeExame: "VCM", metodoOuPrincipio: "Cálculo HCT/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCH", nomeExame: "HCM", metodoOuPrincipio: "Cálculo HGB/RBC", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "pg", codigoLabfacilSugerido: "HCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "MCHC", nomeExame: "CHCM", metodoOuPrincipio: "Cálculo HGB/HCT", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "g/dL", codigoLabfacilSugerido: "CHCM", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "RDW-CV", nomeExame: "RDW-CV", metodoOuPrincipio: "Estatístico CV", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "RDW_CV", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "RDW-SD", nomeExame: "RDW-SD", metodoOuPrincipio: "Largura de Distribuição", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "RDW_SD", categoria: "Índices Hematimétricos" },
      { codigoEquipamento: "PLT", nomeExame: "Plaquetas", metodoOuPrincipio: "Impedância Elétrica", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "10^3/µL", codigoLabfacilSugerido: "PLAQUETAS", categoria: "Plaquetas" },
      { codigoEquipamento: "MPV", nomeExame: "VPM", metodoOuPrincipio: "Curva Distribuição", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "fL", codigoLabfacilSugerido: "VPM", categoria: "Plaquetas" },
      { codigoEquipamento: "PDW", nomeExame: "PDW", metodoOuPrincipio: "Geométrico", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PDW", categoria: "Plaquetas" },
      { codigoEquipamento: "PCT", nomeExame: "Plaquetócrito", metodoOuPrincipio: "PLTxMPV", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "%", codigoLabfacilSugerido: "PCT", categoria: "Plaquetas" }
    ]
  },

  // 10. WIENER CM250 (BIOQUÍMICA CLÍNICA)
  CM250: {
    modelo: "CM250",
    nomeCompleto: "Wiener lab. CM 250 Clinical Chemistry Analyzer",
    fabricante: "Wiener lab.",
    tipoAnalise: "Bioquímica Clínica & Turbidimetria (250 testes/h)",
    protocoloComunicacao: "ASTM E1394-97 / ASTM E1381 (Serial RS-232 / TCP-IP)",
    descricaoDoc: "Analisador automático de acesso aleatório para química clínica e imunoturbidimetria. Protocolo de comunicação padrão ASTM ou arquivos de exportação/importação de rotina.",
    exames: [
      { codigoEquipamento: "GLU", nomeExame: "Glicose (Glicemia)", metodoOuPrincipio: "GOD-PAP Enzimático Trinder", amostraSugerida: "Soro / Plasma", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "GLICOSE", categoria: "Glicídios" },
      { codigoEquipamento: "URE", nomeExame: "Ureia UV", metodoOuPrincipio: "Urease GLDH Cinético UV", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "UREIA", categoria: "Função Renal" },
      { codigoEquipamento: "CRE", nomeExame: "Creatinina Cinética", metodoOuPrincipio: "Jaffé Cinético", amostraSugerida: "Soro / Urina", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CREATININA", categoria: "Função Renal" },
      { codigoEquipamento: "URI", nomeExame: "Ácido Úrico", metodoOuPrincipio: "Uricase PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "AC_URICO", categoria: "Metabolismo" },
      { codigoEquipamento: "COL", nomeExame: "Colesterol Total", metodoOuPrincipio: "CHOD-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "COL1TOTAL", categoria: "Lipídios" },
      { codigoEquipamento: "HDL", nomeExame: "HDL Colesterol Direto", metodoOuPrincipio: "Eliminação / Detergente Seletivo", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "HDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "LDL", nomeExame: "LDL Colesterol Direto", metodoOuPrincipio: "Detergente Seletivo", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "LDL_CHOL", categoria: "Lipídios" },
      { codigoEquipamento: "TRI", nomeExame: "Triglicerídeos", metodoOuPrincipio: "GPO-PAP Enzimático", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "TRIGLI", categoria: "Lipídios" },
      { codigoEquipamento: "GOT", nomeExame: "TGO / AST", metodoOuPrincipio: "IFCC UV sem Piridoxal Fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGO", categoria: "Hepático" },
      { codigoEquipamento: "GPT", nomeExame: "TGP / ALT", metodoOuPrincipio: "IFCC UV sem Piridoxal Fosfato", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "TGP", categoria: "Hepático" },
      { codigoEquipamento: "GGT", nomeExame: "Gama GT", metodoOuPrincipio: "Szasz / Persijn Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "GAMA_GT", categoria: "Hepático" },
      { codigoEquipamento: "FAL", nomeExame: "Fosfatase Alcalina", metodoOuPrincipio: "p-NPP DEA Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "FALCAL2016", categoria: "Hepático" },
      { codigoEquipamento: "TBI", nomeExame: "Bilirrubina Total", metodoOuPrincipio: "Diazo com Surfactante (DPD)", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BIL1TOT", categoria: "Hepático" },
      { codigoEquipamento: "DBI", nomeExame: "Bilirrubina Direta", metodoOuPrincipio: "Diazo Direto", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "BILIR_DIR", categoria: "Hepático" },
      { codigoEquipamento: "PRO", nomeExame: "Proteínas Totais", metodoOuPrincipio: "Biureto Colorimétrico", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "PROT1TOT", categoria: "Proteínas" },
      { codigoEquipamento: "ALB", nomeExame: "Albumina", metodoOuPrincipio: "Verde de Bromocresol (BCG)", amostraSugerida: "Soro", unidadePadrao: "g/dL", codigoLabfacilSugerido: "ALBUMINA", categoria: "Proteínas" },
      { codigoEquipamento: "CAL", nomeExame: "Cálcio", metodoOuPrincipio: "Arsenazo III", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "CALCIO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "FOS", nomeExame: "Fósforo UV", metodoOuPrincipio: "Fosfomolibdato UV", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "FOSFORO18", categoria: "Eletrólitos" },
      { codigoEquipamento: "MAG", nomeExame: "Magnésio", metodoOuPrincipio: "Azul de Xilidil", amostraSugerida: "Soro", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "MAGNESIO", categoria: "Eletrólitos" },
      { codigoEquipamento: "FER", nomeExame: "Ferro Sérico", metodoOuPrincipio: "Ferrozine sem Desproteinização", amostraSugerida: "Soro", unidadePadrao: "µg/dL", codigoLabfacilSugerido: "FERRO18", categoria: "Anemia" },
      { codigoEquipamento: "AMI", nomeExame: "Amilase", metodoOuPrincipio: "CNPG3 Cinético", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "AMILASE", categoria: "Pancreático" },
      { codigoEquipamento: "CPK", nomeExame: "CPK Total", metodoOuPrincipio: "IFCC Cinético UV", amostraSugerida: "Soro", unidadePadrao: "U/L", codigoLabfacilSugerido: "CPK", categoria: "Cardíaco" },
      { codigoEquipamento: "PCR", nomeExame: "Proteína C Reativa Látex", metodoOuPrincipio: "Imunoturbidimetria Quantitativa", amostraSugerida: "Soro", unidadePadrao: "mg/L", codigoLabfacilSugerido: "PCR", categoria: "Inflamação" }
    ]
  },

  // 11. BIOCON FIAPRESTO 1AC (HEMOGLOBINA GLICADA FIA)
  FIAPRESTO_1AC: {
    modelo: "FIAPRESTO_1AC",
    nomeCompleto: "Biocon FIAPresto 1AC / Finecare HbA1c Analyzer",
    fabricante: "Biocon / Wondfo",
    tipoAnalise: "Hemoglobina Glicada por Imunofluorescência (FIA / POCT)",
    protocoloComunicacao: "Serial RS-232 / USB / TCP-IP (HL7 / Protocolo ASCII LIS)",
    descricaoDoc: "Analisador quantitativo por imunofluorescência (FIA) com foco em dosagem de precisão de HbA1c (Hemoglobina Glicada). Exporta resultados via porta serial/USB ou HL7 direto para integração LIS.",
    exames: [
      { codigoEquipamento: "HBA1C", nomeExame: "Hemoglobina Glicada (HbA1c - NGSP/IFCC)", metodoOuPrincipio: "Imunofluorescência de Resolução Temporal (TRFIA)", amostraSugerida: "Sangue Total EDTA / Capilar", unidadePadrao: "%", codigoLabfacilSugerido: "HBA1C", categoria: "Diabetes" },
      { codigoEquipamento: "HBA1C_IFCC", nomeExame: "HbA1c Unidade IFCC", metodoOuPrincipio: "Cálculo IFCC Diretriz Padrão", amostraSugerida: "Sangue Total EDTA", unidadePadrao: "mmol/mol", codigoLabfacilSugerido: "HBA1C_IFCC", categoria: "Diabetes" },
      { codigoEquipamento: "EAG", nomeExame: "Glicemia Média Estimada (eAG)", metodoOuPrincipio: "Fórmula ADA / ADAG (28.7 x A1C - 46.7)", amostraSugerida: "Calculado", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "GLIC_EST", categoria: "Diabetes" }
    ]
  },

  // 12. HUMAN HUMACLOT JUNIOR (COAGULAÇÃO)
  HUMACLOT_JR: {
    modelo: "HUMACLOT_JR",
    nomeCompleto: "Human HumaClot Junior Coagulation Analyzer",
    fabricante: "HUMAN Diagnostics Worldwide",
    tipoAnalise: "Coagulômetro Monocanal Óptico-Mecânico",
    protocoloComunicacao: "Serial RS-232 Unidirecional (9600 bps, 8N1 - ASCII Report)",
    descricaoDoc: "Coagulômetro semiautomático de 1 canal para determinação de testes de coagulação por princípio óptico com fotômetro LED a 405nm. Transmite resultados e tempos via porta serial RS-232 imediatamente após término do ensaio.",
    exames: [
      { codigoEquipamento: "PT", nomeExame: "Tempo de Protrombina (TP / TAP - Segundos)", metodoOuPrincipio: "Coagulométrico Turbidimétrico 405nm", amostraSugerida: "Plasma Citratado (Citrato 3,2%)", unidadePadrao: "s", codigoLabfacilSugerido: "TP_SEG", categoria: "Coagulação" },
      { codigoEquipamento: "INR", nomeExame: "INR (RNI - Razão Normalizada Internacional)", metodoOuPrincipio: "Cálculo Baseado no ISI do Reagente", amostraSugerida: "Plasma Citratado", unidadePadrao: "INR", codigoLabfacilSugerido: "RNI", categoria: "Coagulação" },
      { codigoEquipamento: "PT_ACT", nomeExame: "Atividade de Protrombina (%)", metodoOuPrincipio: "Curva de Calibração / Atividade", amostraSugerida: "Plasma Citratado", unidadePadrao: "%", codigoLabfacilSugerido: "TP_ATIV", categoria: "Coagulação" },
      { codigoEquipamento: "APTT", nomeExame: "TTPA (Tempo de Tromboplastina Parcial Ativada)", metodoOuPrincipio: "Coagulométrico Óptico", amostraSugerida: "Plasma Citratado (Citrato 3,2%)", unidadePadrao: "s", codigoLabfacilSugerido: "TTPA", categoria: "Coagulação" },
      { codigoEquipamento: "APTT_RATIO", nomeExame: "Relação TTPA (Paciente / Pool Normal)", metodoOuPrincipio: "Cálculo Proporção", amostraSugerida: "Plasma Citratado", unidadePadrao: "Ratio", codigoLabfacilSugerido: "TTPA_RATIO", categoria: "Coagulação" },
      { codigoEquipamento: "FIB", nomeExame: "Fibrinogênio (Clauss)", metodoOuPrincipio: "Método de Clauss Turbidimétrico", amostraSugerida: "Plasma Citratado", unidadePadrao: "mg/dL", codigoLabfacilSugerido: "FIBRI", categoria: "Coagulação" },
      { codigoEquipamento: "TT", nomeExame: "Tempo de Trombina (TT)", metodoOuPrincipio: "Coagulométrico Óptico", amostraSugerida: "Plasma Citratado", unidadePadrao: "s", codigoLabfacilSugerido: "TEMPO_TROMB", categoria: "Coagulação" }
    ]
  }

};
