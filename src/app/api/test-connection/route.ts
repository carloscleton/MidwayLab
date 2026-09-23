import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { softlabLogin, softlabSenha, softlabBaseUrl, wsUrl } = body;

    // -------------------------------------------------------------------------
    // 1. TESTE INDIVIDUAL DA API REST DO SOFTLAB APOIO
    // -------------------------------------------------------------------------
    let softlabSuccess = false;
    let softlabMsg = "";

    const targetSoftlabUrl = (softlabBaseUrl && softlabBaseUrl.startsWith('http'))
      ? softlabBaseUrl.replace(/\/$/, '')
      : 'http://apoio.softlabsolucoes.com.br';

    if (!softlabLogin || !softlabSenha) {
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
            softlabMsg = `❌ Resposta da API Softlab (HTTP ${err.response.status}): ${err.response.data?.mensagem || err.response.statusText}`;
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

    // -------------------------------------------------------------------------
    // 2. TESTE INDIVIDUAL DO WEBSERVICE AUTOLAC
    // -------------------------------------------------------------------------
    let autolacSuccess = false;
    let autolacMsg = "";

    const targetWsUrl = wsUrl && wsUrl.startsWith('http') ? wsUrl.replace(/\/$/, '') : 'http://177.22.36.202:8002';

    if (!wsUrl || !wsUrl.startsWith("http")) {
      autolacMsg = "Informe uma URL válida do WebService Autolac (iniciada com http:// ou https://).";
    } else {
      try {
        console.log(`[TestConnection API] Testando WebService Autolac em ${targetWsUrl}...`);
        const pingUrl = targetWsUrl.endsWith('wsdl') ? targetWsUrl : `${targetWsUrl}/?wsdl`;
        await axios.get(pingUrl, { timeout: 6000 });
        autolacSuccess = true;
        autolacMsg = `✓ WebService Autolac WSDL Respondendo OK em ${targetWsUrl}!`;
      } catch (err: any) {
        if (err.response) {
          // Response received (even HTTP 404/405/500), proving host exists and responds
          autolacSuccess = true;
          autolacMsg = `✓ Servidor WebService Autolac Ativo em ${targetWsUrl} (HTTP ${err.response.status}).`;
        } else {
          // Fallback: try direct base URL
          try {
            await axios.get(targetWsUrl, { timeout: 5000 });
            autolacSuccess = true;
            autolacMsg = `✓ WebService Autolac Online em ${targetWsUrl}!`;
          } catch (err2: any) {
            if (err2.response) {
              autolacSuccess = true;
              autolacMsg = `✓ Servidor Autolac Respondendo em ${targetWsUrl} (HTTP ${err2.response.status}).`;
            } else {
              autolacSuccess = false;
              const code = err2.code || err.code || "";
              if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
                autolacMsg = `❌ Servidor Autolac inacessível: Domínio ou IP em '${targetWsUrl}' não foi encontrado.`;
              } else if (code === "ECONNREFUSED") {
                autolacMsg = `❌ Conexão recusada pela porta no servidor '${targetWsUrl}'.`;
              } else if (code === "ETIMEDOUT" || code === "ECONNABORTED") {
                autolacMsg = `❌ Timeout: Servidor Autolac em '${targetWsUrl}' não respondeu em 6s.`;
              } else {
                autolacMsg = `❌ Erro Conectividade Autolac: ${err2.message || err.message}`;
              }
            }
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
