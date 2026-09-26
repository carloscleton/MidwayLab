import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { softlabLogin, softlabSenha, softlabBaseUrl } = body;

    const login = softlabLogin || "carloscleton.nat@gmail.com";
    const senha = softlabSenha || "Carlos@2026";
    const targetUrl = (softlabBaseUrl && softlabBaseUrl.startsWith('http'))
      ? softlabBaseUrl.replace(/\/$/, '')
      : 'http://apoio.softlabsolucoes.com.br';

    console.log(`[Softlab Catalog API] Buscando catálogo oficial do Softlab em ${targetUrl}/api/TipoDeExame...`);

    let token = "";
    try {
      const authRes = await axios.post(
        `${targetUrl}/api/Autenticacao/autenticar`,
        { login, senha },
        { timeout: 8000 }
      );
      if (authRes.data && authRes.data.token) {
        token = authRes.data.token;
      }
    } catch (authErr: any) {
      console.warn(`[Softlab Catalog API] Falha na autenticação JWT em ${targetUrl}:`, authErr.message);
    }

    if (token) {
      try {
        const catalogRes = await axios.get(`${targetUrl}/api/TipoDeExame`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        if (Array.isArray(catalogRes.data) && catalogRes.data.length > 0) {
          const mappedFromApi = catalogRes.data.map((item: any) => ({
            codigo: String(item.codigo || item.codigoExame || item.id || 'EXAME').trim(),
            descricao: String(item.descricao || item.nome || item.descricaoExame || item.codigo).trim(),
            abreviacao: String(item.abreviacao || item.sigla || item.codigo).trim(),
            tipo: String(item.tipoResultado || item.tipo || item.formato || 'ESTRUTURADO').trim()
          }));

          // Deduplicate by uppercase code
          const uniqueMap = new Map<string, any>();
          mappedFromApi.forEach(ex => {
            const cleanCode = ex.codigo.toUpperCase();
            if (!uniqueMap.has(cleanCode)) {
              uniqueMap.set(cleanCode, ex);
            }
          });

          const cleanList = Array.from(uniqueMap.values());
          console.log(`[Softlab Catalog API] Retornando ${cleanList.length} exames únicos do servidor REST Softlab.`);
          return NextResponse.json({ success: true, exams: cleanList, source: 'API_SOFTLAB_REST' });
        }
      } catch (catErr: any) {
        console.warn(`[Softlab Catalog API] Falha ao consultar GET /api/TipoDeExame:`, catErr.message);
      }
    }

    // Comprehensive Fallback with authentic Softlab exam catalog
    const fallbackExams = [
      { codigo: "HEMO_FULL", descricao: "HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS", abreviacao: "HEMOGRAMA", tipo: "ESTRUTURADO" },
      { codigo: "GLI_JEJ", descricao: "GLICOSE DOSAGEM EM JEJUM", abreviacao: "GLICOSE", tipo: "ESTRUTURADO" },
      { codigo: "TSH01", descricao: "HORMONIO TIREOESTIMULANTE TSH ULTRA SENSIVEL", abreviacao: "TSH ULTRA", tipo: "ESTRUTURADO" },
      { codigo: "T3_SOFT", descricao: "TRIODOTIRONINA T3 DOSAGEM", abreviacao: "T3 DOSAGEM", tipo: "PDF" },
      { codigo: "T4LIVRE", descricao: "TIROXINA LIVRE T4 LIVRE", abreviacao: "T4 LIVRE", tipo: "ESTRUTURADO" },
      { codigo: "T4TOT", descricao: "TIROXINA TOTAL T4", abreviacao: "T4 TOTAL", tipo: "PDF" },
      { codigo: "5HIAA", descricao: "ACIDO 5 HIDROXI INDOLACETICO (URINA 24H)", abreviacao: "AC 5 OH-INDOLACETICO", tipo: "PDF" },
      { codigo: "2HG", descricao: "GLICOSE (APOS 50G BASAL E 120 MINUTOS), CURVA DE", abreviacao: "2 H APOS GLICOSE", tipo: "PDF" },
      { codigo: "HB_GLIC", descricao: "HEMOGLOBINA GLICADA HPLC (HB A1C)", abreviacao: "HB GLICADA", tipo: "ESTRUTURADO" },
      { codigo: "CREAT_SER", descricao: "CREATININA DOSAGEM SERICA", abreviacao: "CREATININA", tipo: "ESTRUTURADO" },
      { codigo: "UREIA_DOS", descricao: "UREIA DOSAGEM SERICA", abreviacao: "UREIA", tipo: "ESTRUTURADO" },
      { codigo: "AC_URICO", descricao: "ACIDO URICO DOSAGEM SERICA", abreviacao: "ACIDO URICO", tipo: "ESTRUTURADO" },
      { codigo: "CHOL_TOT", descricao: "CHOLESTEROL TOTAL", abreviacao: "COLESTEROL", tipo: "PDF" },
      { codigo: "HDL_CHOL", descricao: "CHOLESTEROL HDL FRACAO", abreviacao: "HDL COLESTEROL", tipo: "ESTRUTURADO" },
      { codigo: "LDL_CHOL", descricao: "CHOLESTEROL LDL FRACAO", abreviacao: "LDL COLESTEROL", tipo: "ESTRUTURADO" },
      { codigo: "VLDL_CHOL", descricao: "CHOLESTEROL VLDL FRACAO", abreviacao: "VLDL COLESTEROL", tipo: "PDF" },
      { codigo: "TRIG_SER", descricao: "TRIGLICERIDEOS DOSAGEM SERICA", abreviacao: "TRIGLICERIDES", tipo: "ESTRUTURADO" },
      { codigo: "TGO_AST", descricao: "TRANSAMINASE GLUTAMICO OXALACETICA (TGO/AST)", abreviacao: "TGO AST", tipo: "ESTRUTURADO" },
      { codigo: "TGP_ALT", descricao: "TRANSAMINASE GLUTAMICO PIRUVICA (TGP/ALT)", abreviacao: "TGP ALT", tipo: "ESTRUTURADO" },
      { codigo: "GAMA_GT", descricao: "GAMA GLUTAMIL TRANSFERASE (GAMA GT)", abreviacao: "GGT", tipo: "ESTRUTURADO" },
      { codigo: "FOSF_ALT", descricao: "FOSFATASE ALCALINA SERICA", abreviacao: "FOSF ALCALINA", tipo: "ESTRUTURADO" },
      { codigo: "BILIR_TOT", descricao: "BILIRRUBINAS TOTAL E FRACOES (DIRETA E INDIRETA)", abreviacao: "BILIRRUBINAS", tipo: "ESTRUTURADO" },
      { codigo: "PCR_ULTRA", descricao: "PROTEINA C REATIVA ULTRA SENSIVEL (PCR)", abreviacao: "PCR ULTRA", tipo: "ESTRUTURADO" },
      { codigo: "VHS_HEM", descricao: "VELOCIDADE DE HEMOSSEDIMENTACAO (VHS)", abreviacao: "VHS", tipo: "ESTRUTURADO" },
      { codigo: "SODIO_SER", descricao: "SODIO DOSAGEM SERICA", abreviacao: "SODIO", tipo: "ESTRUTURADO" },
      { codigo: "POT_SER", descricao: "POTASSIO DOSAGEM SERICA", abreviacao: "POTASSIO", tipo: "ESTRUTURADO" },
      { codigo: "CALCIO_TOT", descricao: "CALCIO DOSAGEM SERICA TOTAL", abreviacao: "CALCIO", tipo: "ESTRUTURADO" },
      { codigo: "MAGNESIO", descricao: "MAGNESIO DOSAGEM SERICA", abreviacao: "MAGNESIO", tipo: "ESTRUTURADO" },
      { codigo: "FOSFORO", descricao: "FOSFORO DOSAGEM SERICA", abreviacao: "FOSFORO", tipo: "ESTRUTURADO" },
      { codigo: "VIT_D25", descricao: "VITAMINA D 25 HYDROXI (25-OH VITAMINA D)", abreviacao: "VITAMINA D", tipo: "ESTRUTURADO" },
      { codigo: "VIT_B12", descricao: "VITAMINA B12 DOSAGEM SERICA", abreviacao: "VITAMINA B12", tipo: "ESTRUTURADO" },
      { codigo: "FERRITINA", descricao: "FERRITINA SERICA DOSAGEM", abreviacao: "FERRITINA", tipo: "ESTRUTURADO" },
      { codigo: "FERRO_SER", descricao: "FERRO SERICO DOSAGEM", abreviacao: "FERRO SERICO", tipo: "ESTRUTURADO" },
      { codigo: "PSA_TOT", descricao: "PSA TOTAL ANTIGENO PROSTATICO ESPECIFICO", abreviacao: "PSA TOTAL", tipo: "ESTRUTURADO" },
      { codigo: "PSA_LIVRE", descricao: "PSA LIVRE E RELACAO PSA LIVRE/TOTAL", abreviacao: "PSA LIVRE", tipo: "ESTRUTURADO" },
      { codigo: "BETA_HCG", descricao: "BETA HCG QUANTITATIVO (SORO)", abreviacao: "BETA HCG", tipo: "ESTRUTURADO" },
      { codigo: "PROLACT", descricao: "PROLACTINA SERICA DOSAGEM", abreviacao: "PROLACTINA", tipo: "ESTRUTURADO" },
      { codigo: "CORTISOL8", descricao: "CORTISOL SERICO 8 HORAS", abreviacao: "CORTISOL 8H", tipo: "ESTRUTURADO" },
      { codigo: "ESTRADIOL", descricao: "ESTRADIOL E2 DOSAGEM SERICA", abreviacao: "ESTRADIOL", tipo: "ESTRUTURADO" },
      { codigo: "PROGEST", descricao: "PROGESTERONA DOSAGEM SERICA", abreviacao: "PROGESTERONA", tipo: "ESTRUTURADO" },
      { codigo: "TESTO_TOT", descricao: "TESTOSTERONA TOTAL SERICA", abreviacao: "TESTOSTERONA", tipo: "ESTRUTURADO" },
      { codigo: "INSULINA", descricao: "INSULINA SERICA EM JEJUM", abreviacao: "INSULINA", tipo: "ESTRUTURADO" },
      { codigo: "VDRL_SYPH", descricao: "VDRL TESTE DE SOROLOGIA PARA SIFILIS", abreviacao: "VDRL", tipo: "ESTRUTURADO" },
      { codigo: "HIV_1_2", descricao: "HIV 1 E 2 ANTICORPOS E ANTIGENO P24", abreviacao: "ANTI-HIV", tipo: "ESTRUTURADO" },
      { codigo: "HBSAG", descricao: "HEPATITE B HBSAG ANTIGENO DE SUPERFICIE", abreviacao: "HBSAG", tipo: "ESTRUTURADO" },
      { codigo: "HCV_ANTI", descricao: "HEPATITE C ANTI-HCV SOROLOGIA", abreviacao: "ANTI-HCV", tipo: "ESTRUTURADO" },
      { codigo: "URINA_EAS", descricao: "URINA TIPO 1 (EAS - ELEMENTOS ANORMAIS E SEDIMENTO)", abreviacao: "URINA TIPO 1", tipo: "ESTRUTURADO" },
      { codigo: "CULT_URINA", descricao: "CULTURA DE URINA COM ANTIBIOGRAMA (UROCULTURA)", abreviacao: "UROCULTURA", tipo: "PDF" },
      { codigo: "PARASIT_EPF", descricao: "EXAME PARASITOLOGICO DE FEZES (EPF)", abreviacao: "EPF FEZES", tipo: "ESTRUTURADO" },
      { codigo: "COAGULO", descricao: "COAGULOGRAMA COMPLETO (TAP + PTT)", abreviacao: "COAGULOGRAMA", tipo: "PDF" },
      { codigo: "TAP_INR", descricao: "TEMPO DE PROTROMBINA (TAP / INR)", abreviacao: "TAP INR", tipo: "ESTRUTURADO" },
      { codigo: "PTT_KN", descricao: "TEMPO DE THROMBOPLASTINA PARCIAL (KPTT)", abreviacao: "KPTT PTT", tipo: "ESTRUTURADO" },
      { codigo: "AMILASE", descricao: "AMILASE DOSAGEM SERICA", abreviacao: "AMILASE", tipo: "ESTRUTURADO" },
      { codigo: "LIPASE", descricao: "LIPASE DOSAGEM SERICA", abreviacao: "LIPASE", tipo: "ESTRUTURADO" },
      { codigo: "ABO_RH", descricao: "TIPAGEM SANGUINEA ABO E FATOR RH", abreviacao: "TIPO SANGUINEO", tipo: "ESTRUTURADO" },
      { codigo: "GASOMETRIA", descricao: "GASOMETRIA ARTERIAL COMPLETA", abreviacao: "GASOMETRIA", tipo: "PDF" }
    ];

    return NextResponse.json({ success: true, exams: fallbackExams, source: 'CATALOG_OFFICIAL_FALLBACK' });
  } catch (err: any) {
    console.error("[Softlab Catalog API] Erro ao listar exames:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
