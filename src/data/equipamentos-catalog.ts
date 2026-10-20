// src/data/equipamentos-catalog.ts
// Catálogo de exames e códigos segundo a documentação técnica dos equipamentos (Cormay CB350, Horiba Yumizen, etc.)

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
  }
};
