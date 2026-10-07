import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { softlabLogin, softlabSenha, softlabBaseUrl, wsUrl, identificacaoEntidade, senhaWs, targetService } = body;

    const runSoftlab = !targetService || targetService === 'both' || targetService === 'softlab';
    const runAutolac = !targetService || targetService === 'both' || targetService === 'autolac';

    let softlabSuccess: boolean | undefined = undefined;
    let softlabMsg: string | undefined = undefined;
    let autolacSuccess: boolean | undefined = undefined;
    let autolacMsg: string | undefined = undefined;

    // -------------------------------------------------------------------------
    // 1. TESTE INDIVIDUAL DA API REST DO SOFTLAB APOIO
    // -------------------------------------------------------------------------
    if (runSoftlab) {
      const targetSoftlabUrl = (softlabBaseUrl && softlabBaseUrl.startsWith('http'))
        ? softlabBaseUrl.replace(/\/$/, '')
        : 'http://apoio.softlabsolucoes.com.br';

      if (!softlabLogin || !softlabSenha) {
        softlabSuccess = false;
        softlabMsg = "Informe o Login e a Senha da API Softlab Apoio.";
      } else {
        try {
          console.log(`[TestConnection API] Testando Softlab REST em ${targetSoftlabUrl}/api/Autenticacao/autenticar com login '${softlabLogin}'...`);
          const softlabResponse = await axios.post(
            `${targetSoftlabUrl}/api/Autenticacao/autenticar`,
            { login: softlabLogin, senha: softlabSenha },
            { timeout: 8000 }
          );

          if (softlabResponse.data && (softlabResponse.data.token || softlabResponse.data.minutosAteExpirar)) {
            softlabSuccess = true;
            softlabMsg = `✓ Softlab API 200 OK - Credenciais autenticadas com sucesso no servidor (${targetSoftlabUrl})!`;
          } else {
            softlabSuccess = false;
            softlabMsg = `Softlab respondeu, mas não retornou um Token válido (${targetSoftlabUrl}).`;
          }
        } catch (err: any) {
          softlabSuccess = false;
          if (err.response) {
            if (err.response.status === 401 || err.response.status === 400) {
              softlabMsg = `❌ Erro ${err.response.status}: Credenciais (Login '${softlabLogin}' / Senha) recusadas pela API Softlab em ${targetSoftlabUrl}.`;
            } else {
              softlabMsg = `❌ Resposta da API Softlab (HTTP ${err.response.status}): ${err.response.data?.message || err.response.data?.mensagem || err.response.statusText}`;
            }
          } else if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
            softlabMsg = `❌ Servidor do Softlab não encontrado no domínio '${targetSoftlabUrl}'. Verifique a URL.`;
          } else if (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED") {
            softlabMsg = `❌ Timeout: Servidor Softlab em '${targetSoftlabUrl}' não respondeu em 8s.`;
          } else {
            softlabMsg = `❌ Falha na conexão com Softlab: ${err.message}`;
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

          // 1. Tenta autenticação na REST API do Autolac (/Api/Inter-Autolac/Login)
          try {
            const apoiadoNum = parseInt(identificacaoEntidade, 10);
            const loginPayload = {
              apoiadoId: isNaN(apoiadoNum) ? identificacaoEntidade : apoiadoNum,
              senha: senhaWs
            };

            console.log(`[TestConnection API] Tentando POST ${targetWsUrl}/Api/Inter-Autolac/Login...`);
            const loginRes = await axios.post(`${targetWsUrl}/Api/Inter-Autolac/Login`, loginPayload, { timeout: 5000 });
            if (loginRes.status === 200 && loginRes.data?.success !== false) {
              autolacSuccess = true;
              autolacMsg = `✓ Autolac API Online (HTTP 200 OK) - Autenticado com Sucesso! (ApoiadoId/Entidade: '${identificacaoEntidade}') em ${targetWsUrl}!`;
              isTested = true;
            }
          } catch (loginErr: any) {
            if (loginErr.response && loginErr.response.data) {
              const respData = loginErr.response.data;
              const msg = respData.message || respData.mensagem || loginErr.response.statusText;
              if (loginErr.response.status === 404 || loginErr.response.status === 401 || msg.toLowerCase().includes('login') || msg.toLowerCase().includes('inválid')) {
                autolacSuccess = false;
                autolacMsg = `⚠️ Servidor Autolac API em ${targetWsUrl} está ONLINE, mas as credenciais (Entidade '${identificacaoEntidade}' / Senha) foram RECUSADAS pela Lifesys (${msg}).`;
                isTested = true;
              }
            }
          }

          // 2. Tenta Health Check na API do Autolac (/Api/Health)
          if (!isTested) {
            try {
              console.log(`[TestConnection API] Tentando GET ${targetWsUrl}/Api/Health...`);
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

          // 3. Fallback: Teste WSDL SOAP
          if (!isTested) {
            const pingUrl = targetWsUrl.endsWith('wsdl') ? targetWsUrl : `${targetWsUrl}/?wsdl`;
            console.log(`[TestConnection API] Tentando GET SOAP WSDL ${pingUrl}...`);
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
      softlabSuccess,
      softlabMsg,
      autolacSuccess,
      autolacMsg
    });
  } catch (error: any) {
    return NextResponse.json({
      softlabSuccess: false,
      softlabMsg: `Erro interno no servidor: ${error.message}`,
      autolacSuccess: false,
      autolacMsg: `Erro interno no servidor: ${error.message}`
    }, { status: 500 });
  }
}
