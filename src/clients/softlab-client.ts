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

  /**
   * Autentica na API do Softlab Apoio obtendo o Bearer JWT Token
   */
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

  /**
   * Busca o catálogo completo de exames do Softlab (1.311 exames)
   */
  async getTiposDeExames(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/TipoDeExame', { headers });
    return response.data;
  }

  /**
   * Cadastra um novo pedido no Softlab Apoio
   */
  async criarPedido(payloadPedido: any): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.post('/api/Pedido', payloadPedido, { headers });
    return response.data;
  }

  /**
   * Obtém detalhes dos tubos e amostras geradas para o pedido (inclui EPL)
   */
  async getAmostras(codigoLis: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/Amostra/${codigoLis}`, { headers });
    return response.data;
  }

  /**
   * Busca a lista de laudos liberados prontos para serem consumidos
   */
  async getLaudosDisponiveis(statusLaudo: number = 0): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get('/api/Laudo', {
      headers,
      params: { statusLaudo },
    });
    return response.data;
  }

  /**
   * Obtém o conteúdo do laudo de um exame em formato HTML ou RTF
   */
  async getLaudoConteudo(codigoPedidoLis: string, codigoExameLis: string, formato: 'html' | 'rtf' = 'html'): Promise<string> {
    const headers = await this.getAuthHeaders();
    const response = await this.http.get(`/api/Laudo/${formato}`, {
      headers,
      params: { codigoPedidoLis, codigoExameLis },
    });
    return response.data;
  }

  /**
   * Marca o laudo como consumido no Softlab Apoio
   */
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
}
