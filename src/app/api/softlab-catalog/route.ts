import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { softlabLogin, softlabSenha, softlabBaseUrl } = body;

    const login = softlabLogin || "yorod23826@gicont.com";
    const senha = softlabSenha || "Smt@2026";
    
    // Candidate URLs for Softlab API
    const candidateUrls = Array.from(new Set([
      softlabBaseUrl ? String(softlabBaseUrl).replace(/\/$/, '') : null,
      'http://177.22.36.202:8002',
      'http://apoio.softlabsolucoes.com.br'
    ].filter(Boolean))) as string[];

    let token = "";
    let workingUrl = "";

    for (const url of candidateUrls) {
      try {
        console.log(`[Softlab Catalog API] Tentando autenticar em ${url}/api/Autenticacao/autenticar com login '${login}'...`);
        const authRes = await axios.post(
          `${url}/api/Autenticacao/autenticar`,
          { login, senha },
          { timeout: 10000 }
        );
        if (authRes.data && authRes.data.token) {
          token = authRes.data.token;
          workingUrl = url;
          console.log(`[Softlab Catalog API] ✅ Autenticado com sucesso no servidor ${url}!`);
          break;
        }
      } catch (authErr: any) {
        console.warn(`[Softlab Catalog API] Tentativa em ${url} não respondeu auth:`, authErr.response?.data?.message || authErr.message);
      }
    }

    if (token && workingUrl) {
      let allExamsRaw: any[] = [];

      try {
        console.log(`[Softlab Catalog API] Solicitando GET ${workingUrl}/api/TipoDeExame...`);
        const catalogRes = await axios.get(`${workingUrl}/api/TipoDeExame`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        });

        if (Array.isArray(catalogRes.data) && catalogRes.data.length > 0) {
          allExamsRaw = catalogRes.data;
        } else if (catalogRes.data && Array.isArray(catalogRes.data.items)) {
          allExamsRaw = catalogRes.data.items;
        } else if (catalogRes.data && Array.isArray(catalogRes.data.dados)) {
          allExamsRaw = catalogRes.data.dados;
        } else if (catalogRes.data && Array.isArray(catalogRes.data.tiposDeExames)) {
          allExamsRaw = catalogRes.data.tiposDeExames;
        }
      } catch (catErr: any) {
        console.warn(`[Softlab Catalog API] Erro ao consultar /api/TipoDeExame em ${workingUrl}:`, catErr.message);
      }

      if (allExamsRaw.length > 0) {
        const mappedFromApi = allExamsRaw.map((item: any) => ({
          codigo: String(item.codigo || item.codigoExame || item.id || item.codigoSoftlab || 'EXAME').trim(),
          descricao: String(item.descricao || item.nome || item.descricaoExame || item.codigo || 'EXAME SOFTLAB').trim(),
          abreviacao: String(item.abreviacao || item.sigla || item.codigo || '').trim(),
          tipo: String(item.tipoResultado || item.tipo || item.formato || 'ESTRUTURADO').trim()
        }));

        // Deduplicar mantendo cada código de exame único
        const uniqueMap = new Map<string, any>();
        mappedFromApi.forEach(ex => {
          const cleanCode = ex.codigo.toUpperCase();
          if (!uniqueMap.has(cleanCode) && ex.codigo !== 'EXAME') {
            uniqueMap.set(cleanCode, ex);
          }
        });

        const cleanList = Array.from(uniqueMap.values());
        console.log(`[Softlab Catalog API] Sucesso Total! ${cleanList.length} exames reais extraídos do servidor Softlab (${workingUrl}).`);
        return NextResponse.json({
          success: true,
          exams: cleanList,
          total: cleanList.length,
          source: 'API_REST_SOFTLAB_REAL_LIVE',
          serverUrl: workingUrl
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: "Não foi possível autenticar na API do Softlab com as credenciais informadas."
    }, { status: 400 });

  } catch (err: any) {
    console.error("[Softlab Catalog API] Erro ao listar exames:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
