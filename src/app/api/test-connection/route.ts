import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { softlabLogin, softlabSenha, softlabBaseUrl, wsUrl, identificacaoEntidade, senhaWs } = body;

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

    // -------------------------------------------------------------------------
    // 2. TESTE INDIVIDUAL DO WEBSERVICE AUTOLAC
    // -------------------------------------------------------------------------
    let autolacSuccess = false;
    let autolacMsg = "";

    const targetWsUrl = wsUrl && wsUrl.startsWith('http') ? wsUrl.replace(/\/$/, '') : 'http://177.22.36.202:8002';

    if (!wsUrl || !wsUrl.startsWith("http")) {
      autolacMsg = "Informe uma URL válida do WebService Autolac (iniciada com http:// ou https://).";
    } else if (!identificacaoEntidade || !senhaWs) {
      autolacSuccess = false;
      autolacMsg = "❌ Preencha a Identificação da Entidade (Autolac) e a Senha de Acesso ao WS.";
    } else {
      try {
        console.log(`[TestConnection API] Testando WebService Autolac em ${targetWsUrl} com entidade '${identificacaoEntidade}'...`);
        const pingUrl = targetWsUrl.endsWith('wsdl') ? targetWsUrl : `${targetWsUrl}/?wsdl`;
        
        // Pings WSDL endpoint
        const wsRes = await axios.get(pingUrl, { timeout: 6000 });
        if (wsRes.status === 200) {
          autolacSuccess = true;
          autolacMsg = `✓ WebService Autolac SOAP Online (WSDL 200 OK) - Entidade: '${identificacaoEntidade}' em ${targetWsUrl}!`;
        } else {
          autolacSuccess = false;
          autolacMsg = `❌ Resposta do WebService Autolac (HTTP ${wsRes.status}) em ${targetWsUrl}.`;
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
