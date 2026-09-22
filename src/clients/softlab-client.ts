import axios, { AxiosInstance } from 'axios';

interface ISoftlabAuthResponse {
  token: string;
  minutosAteExpirar: number;
  tipoDeToken: string;
}

export class SoftlabClient {
  private baseUrl: string;
  private login: string;
  private senha: string;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private http: AxiosInstance;

  constructor(baseUrl: string, login: string, senha: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.login = login;
    this.senha = senha;
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
    });
  }

  // ---------------------------------------------------------------------------
  // 1. AUTENTICAÇÃO
  // ---------------------------------------------------------------------------
  async authenticate(): Promise<string> {
    const now = Date.now();
    if (this.token && this.tokenExpiresAt > now + 60000) {
      return this.token;
    }

    try {
      const response = await this.http.post<ISoftlabAuthResponse>('/api/Autenticacao/autenticar', {
        login: this.login,
        senha: this.senha,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        const minutes = response.data.minutosAteExpirar || 50;
        this.tokenExpiresAt = Date.now() + minutes * 60 * 1000;
        return this.token;
      }
      throw new Error('Token não retornado pela API do Softlab');
    } catch (error: any) {
      console.error(`[SoftlabClient] Erro ao autenticar (${this.login}):`, error.response?.data || error.message);
      throw new Error(`Falha na autenticação Softlab: ${error.message}`);
    }
  }

  private async getAuthHeaders() {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // ---------------------------------------------------------------------------
  // 2. PEDIDOS (/api/Pedido)
  // ---------------------------------------------------------------------------
  async criarPedido(payloadPedido: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Pedido', payloadPedido, { headers });
    return response.data;
  }

  async getDetalhesPedido(codigoLis: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/Pedido/${codigoLis}`, { headers });
    return response.data;
  }

  async atualizarDetalhesPedido(codigoLis: string, payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.put(`/api/Pedido/${codigoLis}/detalhe`, payload, { headers });
    return response.data;
  }

  async excluirPedido(codigoLis: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.delete(`/api/Pedido/${codigoLis}`, { headers });
    return response.data;
  }

  async salvarCamposDeColeta(codigoLis: string, camposValores: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post(`/api/Pedido/${codigoLis}/campos-de-coleta`, camposValores, { headers });
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // 3. AMOSTRAS & ETIQUETAS (/api/Amostra)
  // ---------------------------------------------------------------------------
  async getAmostras(codigoLis: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/Amostra/${codigoLis}`, { headers });
    return response.data;
  }

  async getEtiquetaEpl(codigoLis: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/Amostra/${codigoLis}/etiqueta/epl`, { headers });
    return response.data;
  }

  async getRecoletas(dataInicial?: string, dataFinal?: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/Amostra/recoletas', {
      headers,
      params: { dataInicial, dataFinal }
    });
    return response.data;
  }

  async realizarRecoleta(payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Amostra/recoletas', payload, { headers });
    return response.data;
  }

  async cancelarAmostras(payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Amostra/cancelar', payload, { headers });
    return response.data;
  }

  async atualizarDataHoraColeta(payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.put('/api/Amostra/dataHoraColeta', payload, { headers });
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // 4. EXAMES (/api/Exame)
  // ---------------------------------------------------------------------------
  async cancelarColetaExames(payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Exame/cancelar-coleta', payload, { headers });
    return response.data;
  }

  async excluirExames(payload: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Exame/excluir-exames', payload, { headers });
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // 5. LAUDOS & RESULTADOS (/api/Laudo)
  // ---------------------------------------------------------------------------
  async getLaudosDisponiveis(statusLaudo: number = 0, dataLiberacaoInicial?: string, dataLiberacaoFinal?: string): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/Laudo', {
      headers,
      params: { statusLaudo, dataLiberacaoInicial, dataLiberacaoFinal },
    });
    return response.data;
  }

  async getResumoLaudos(statusLaudo?: number): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/Laudo/resumo', {
      headers,
      params: { statusLaudo }
    });
    return response.data;
  }

  async getLaudoConteudo(codigoPedidoLis: string, codigoExameLis: string, formato: 'html' | 'rtf' | 'multi-formato' = 'html'): Promise<any> {
    const headers = await this.getAuthHeaders();
    const endpoint = formato === 'multi-formato' ? '/api/Laudo/multi-formato' : `/api/Laudo/${formato}`;
    const response = await this.http.get(endpoint, {
      headers,
      params: { codigoPedidoLis, codigoExameLis },
    });
    return response.data;
  }

  async marcarComoConsumido(codigoPedidoLis: string, codigoExameLis: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await this.http.post(
      '/api/Laudo/marcar-como-consumido',
      {},
      {
        headers,
        params: { codigoPedidoLis, codigoExameLis },
      }
    );
  }

  async marcarComoPendente(codigoPedidoLis: string, codigoExameLis: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    await this.http.post(
      '/api/Laudo/marcar-como-pendente',
      {},
      {
        headers,
        params: { codigoPedidoLis, codigoExameLis },
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 6. AUXILIARES E TABELAS (/api/TipoDeExame, /api/TipoDeJejum, etc)
  // ---------------------------------------------------------------------------
  async getTiposDeExames(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/TipoDeExame', { headers });
    return response.data;
  }

  async getConfiguracaoExame(codigo: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/TipoDeExame/${codigo}`, { headers });
    return response.data;
  }

  async getTiposDeJejum(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/TipoDeJejum', { headers });
    return response.data;
  }

  async getTiposDeJustificativa(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/TipoDeJustificativa', { headers });
    return response.data;
  }
}
