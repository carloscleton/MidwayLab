import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export class AutolacSoapService {
  private static parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  private static builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
  });

  /**
   * Extrai o XML do envelope SOAP enviado pelo Autolac
   */
  static parseSoapRequest(soapXmlString: string): any {
    try {
      const parsed = this.parser.parse(soapXmlString);
      // SOAP Body extraction
      const body = parsed['soap:Envelope']?.['soap:Body'] || parsed['s:Envelope']?.['s:Body'] || parsed;
      const root = body.ProcessaApoioApoiado?.xmlEnvio?.root || body.root || body;
      return root;
    } catch (e: any) {
      console.error('[AutolacSoapService] Erro ao fazer parsing do XML SOAP:', e);
      throw new Error(`XML Invalido: ${e.message}`);
    }
  }

  /**
   * Constrói a resposta XML SOAP de confirmação com as Etiquetas no Padrão Softlab
   */
  static buildEtiquetasResponse(local: string, protocolo: string, recipientes: Array<{ codBarras: string; codEtiqueta: string }>): string {
    const xmlObj = {
      root: {
        situacao: 'S',
        mensagem: '',
        etiquetas: {
          solicitacao: {
            identificacaoLab: {
              local: local || '',
              protocolo: protocolo || '',
            },
            recipiente: recipientes.map((r) => ({
              codBarras: r.codBarras || '',
              codEtiqueta: r.codEtiqueta || '',
            })),
          },
        },
      },
    };

    const xmlString = this.builder.build(xmlObj);
    return this.wrapSoapEnvelope(xmlString);
  }

  /**
   * Constrói a resposta XML SOAP de erro
   */
  static buildErroResponse(mensagemErro: string): string {
    const xmlObj = {
      root: {
        situacao: 'E',
        mensagem: mensagemErro,
      },
    };

    const xmlString = this.builder.build(xmlObj);
    return this.wrapSoapEnvelope(xmlString);
  }

  /**
   * Constrói a resposta XML SOAP de Resultados / Laudo PDF
   */
  static buildResultadoResponse(local: string, protocolo: string, exames: any[], laudoPdfBase64?: string): string {
    const xmlObj = {
      root: {
        codigoLab: '',
        resultados: {
          identificacaoLab: {
            local: local || '',
            protocolo: protocolo || '',
          },
          exame: exames,
          laudoPDF: laudoPdfBase64 || '',
        },
      },
    };

    const xmlString = this.builder.build(xmlObj);
    return this.wrapSoapEnvelope(xmlString);
  }

  /**
   * Envolve a string XML no Envelope SOAP padrão exigido pelo Autolac
   */
  private static wrapSoapEnvelope(innerXml: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessaApoioApoiadoResponse xmlns="http://tempuri.org/">
      <ProcessaApoioApoiadoResult><![CDATA[${innerXml}]]></ProcessaApoioApoiadoResult>
    </ProcessaApoioApoiadoResponse>
  </soap:Body>
</soap:Envelope>`;
  }
}
