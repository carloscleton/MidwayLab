import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      labfacilLogin,
      labfacilSenha,
      labfacilBaseUrl,
      softlabLogin,
      softlabSenha,
      softlabBaseUrl,
      wsUrl,
      identificacaoEntidade,
      senhaWs,
      targetService
    } = body;

    const loginLabfacil = labfacilLogin || softlabLogin;
    const senhaLabfacil = labfacilSenha || softlabSenha;
    const baseUrlLabfacil = labfacilBaseUrl || softlabBaseUrl;

    const runLabfacil = !targetService || targetService === 'both' || targetService === 'labfacil' || targetService === 'softlab';
    const runAutolac = !targetService || targetService === 'both' || targetService === 'autolac';

    let labfacilSuccess: boolean | undefined = undefined;
    let labfacilMsg: string | undefined = undefined;
    let autolacSuccess: boolean | undefined = undefined;
    let autolacMsg: string | undefined = undefined;

    // -------------------------------------------------------------------------
    // 1. TESTE INDIVIDUAL DA API REST DO LABFACIL
    // -------------------------------------------------------------------------
    if (runLabfacil) {
      const targetLabfacilUrl = (baseUrlLabfacil && baseUrlLabfacil.startsWith('http'))
        ? baseUrlLabfacil.replace(/\/$/, '')
        : 'http://apoio.softlabsolucoes.com.br';

      if (!loginLabfacil || !senhaLabfacil) {
        labfacilSuccess = false;
        labfacilMsg = "Informe o Login e a Senha da API Labfacil.";
      } else {
        try {
          console.log(`[TestConnection API] Testando Labfacil REST em ${targetLabfacilUrl}/api/Autenticacao/autenticar com login '${loginLabfacil}'...`);
          const labfacilResponse = await axios.post(
            `${targetLabfacilUrl}/api/Autenticacao/autenticar`,
            { login: loginLabfacil, senha: senhaLabfacil },
            { timeout: 8000 }
          );

          if (labfacilResponse.data && (labfacilResponse.data.token || labfacilResponse.data.minutosAteExpirar)) {
            labfacilSuccess = true;
            labfacilMsg = `✓ Labfacil API 200 OK - Credenciais autenticadas com sucesso no servidor (${targetLabfacilUrl})!`;
          } else {
            labfacilSuccess = false;
            labfacilMsg = `Labfacil respondeu, mas não retornou um Token válido (${targetLabfacilUrl}).`;
          }
        } catch (err: any) {
          labfacilSuccess = false;
          if (err.response) {
            if (err.response.status === 401 || err.response.status === 400) {
              labfacilMsg = `❌ Erro ${err.response.status}: Credenciais (Login '${loginLabfacil}' / Senha) recusadas pela API Labfacil em ${targetLabfacilUrl}.`;
            } else {
              labfacilMsg = `❌ Resposta da API Labfacil (HTTP ${err.response.status}): ${err.response.data?.message || err.response.data?.mensagem || err.response.statusText}`;
            }
          } else if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
            labfacilMsg = `❌ Servidor do Labfacil não encontrado no domínio '${targetLabfacilUrl}'. Verifique a URL.`;
          } else if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
            labfacilMsg = `❌ Timeout: Servidor Labfacil em '${targetLabfacilUrl}' não respondeu em 8s.`;
          } else {
            labfacilMsg = `❌ Falha na conexão com Labfacil: ${err.message}`;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. TESTE INDIVIDUAL DO WEBSERVICE AUTOLAC
    // -------------------------------------------------------------------------
    if (runAutolac) {
      const targetWsUrl = wsUrl && wsUrl.startsWith('http') ? wsUrl.replace(/\/$/, '') : 'http://177.22.36.202:8002';

      if (!wsUrl || !wsUrl.startsWith("http")) {
        autolacSuccess = false;
        autolacMsg = "Informe uma URL válida do WebService Autolac (iniciada com http:// ou https://).";
      } else if (!identificacaoEntidade || !senhaWs) {
        autolacSuccess = false;
        autolacMsg = "❌ Preencha a Identificação da Entidade (Autolac) e a Senha de Acesso ao WS.";
      } else {
        try {
          console.log(`[TestConnection API] Testando Autolac em ${targetWsUrl} com entidade '${identificacaoEntidade}'...`);
          let isTested = false;

          try {
            const apoiadoNum = parseInt(identificacaoEntidade, 10);
            
            let base64Senha = senhaWs;
            if (!/^[A-Za-z0-9+/=]+$/.test(senhaWs) || senhaWs.length % 4 !== 0 || senhaWs.includes('@')) {
              base64Senha = Buffer.from(senhaWs).toString('base64');
            }

            const loginPayload = {
              apoiadoId: isNaN(apoiadoNum) ? identificacaoEntidade : apoiadoNum,
              senha: base64Senha
            };

            const loginRes = await axios.post(`${targetWsUrl}/Api/Inter-Autolac/Login`, loginPayload, { timeout: 5000 });
            if (loginRes.status === 200 && loginRes.data?.success !== false) {
              autolacSuccess = true;
              autolacMsg = `✓ Autolac API Online (HTTP 200 OK) - Autenticado com Sucesso! (ApoiadoId/Entidade: '${identificacaoEntidade}') em ${targetWsUrl}!`;
              isTested = true;
            }
          } catch (loginErr: any) {
            if (loginErr.response && loginErr.response.data) {
              const respData = loginErr.response.data;
              const msg = respData.message || respData.mensagem || (respData.errors ? JSON.stringify(respData.errors) : loginErr.response.statusText);
              if (loginErr.response.status === 404 || loginErr.response.status === 401 || msg.toLowerCase().includes('login') || msg.toLowerCase().includes('inválid') || msg.toLowerCase().includes('retornou')) {
                autolacSuccess = false;
                autolacMsg = `⚠️ Servidor Autolac API em ${targetWsUrl} está ONLINE, mas as credenciais (Entidade '${identificacaoEntidade}' / Senha) foram RECUSADAS pela Lifesys (${msg}).`;
                isTested = true;
              }
            }
          }

          if (!isTested) {
            try {
              const healthRes = await axios.get(`${targetWsUrl}/Api/Health`, { timeout: 4000 });
              if (healthRes.status === 200) {
                autolacSuccess = true;
                autolacMsg = `✓ Servidor Autolac API Online (/Api/Health 200 OK) em ${targetWsUrl}! Entidade: '${identificacaoEntidade}'.`;
                isTested = true;
              }
            } catch (hErr) {
              // segue para fallback WSDL
            }
          }

          if (!isTested) {
            const pingUrl = targetWsUrl.endsWith('wsdl') ? targetWsUrl : `${targetWsUrl}/?wsdl`;
            const wsRes = await axios.get(pingUrl, { timeout: 6000 });
            if (wsRes.status === 200) {
              autolacSuccess = true;
              autolacMsg = `✓ WebService Autolac SOAP Online (WSDL 200 OK) - Entidade: '${identificacaoEntidade}' em ${targetWsUrl}!`;
            } else {
              autolacSuccess = false;
              autolacMsg = `❌ Resposta do WebService Autolac (HTTP ${wsRes.status}) em ${targetWsUrl}.`;
            }
          }
        } catch (err: any) {
          autolacSuccess = false;
          if (err.response) {
            autolacMsg = `❌ Erro de Resposta no WebService Autolac (HTTP ${err.response.status}): O servidor em '${targetWsUrl}' recusou a requisição.`;
          } else if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
            autolacMsg = `❌ Servidor Autolac inacessível: Domínio ou IP em '${targetWsUrl}' não foi encontrado.`;
          } else if (err.code === "ECONNREFUSED") {
            autolacMsg = `❌ Conexão recusada pela porta no servidor '${targetWsUrl}'.`;
          } else if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
            autolacMsg = `❌ Timeout: Servidor Autolac em '${targetWsUrl}' não respondeu em 6s.`;
          } else {
            autolacMsg = `❌ Erro Conectividade Autolac: ${err.message}`;
          }
        }
      }
    }

    return NextResponse.json({
      labfacilSuccess,
      labfacilMsg,
      softlabSuccess: labfacilSuccess,
      softlabMsg: labfacilMsg,
      autolacSuccess,
      autolacMsg
    });
  } catch (error: any) {
    return NextResponse.json({
      labfacilSuccess: false,
      labfacilMsg: `Erro interno no servidor: ${error.message}`,
      softlabSuccess: false,
      softlabMsg: `Erro interno no servidor: ${error.message}`,
      autolacSuccess: false,
      autolacMsg: `Erro interno no servidor: ${error.message}`
    }, { status: 500 });
  }
}
