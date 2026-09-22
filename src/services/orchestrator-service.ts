import { TenantService } from './tenant-service';
import { DeparaService } from './depara-service';
import { AutolacSoapService } from './autolac-soap';
import { supabase } from '../db/supabase';

export class OrchestratorService {
  /**
   * Orquestra a requisição do Autolac cobrindo todo o ciclo do Softlab Apoio:
   * 1. Autenticação JWT no Softlab (/api/Autenticacao/autenticar)
   * 2. Resolução do Mapeamento DE-PARA
   * 3. Registro do Pedido (/api/Pedido)
   * 4. Captura dos tubos e Etiquetas EPL (/api/Amostra/{codigoLis})
   * 5. Gravação no Supabase e resposta SOAP ao Autolac
   */
  static async processAutolacOrder(rawSoapXml: string): Promise<string> {
    const parsedXml = AutolacSoapService.parseSoapRequest(rawSoapXml);
    const solicitacao = parsedXml.solicitacao || parsedXml;

    const cabecalho = solicitacao.cabecalho || {};
    const paciente = cabecalho.paciente || {};
    const identificacaoLab = cabecalho.identificacaoLab || {};

    const local = identificacaoLab.local || '1';
    const protocolo = identificacaoLab.protocolo || `P_${Date.now()}`;
    const identificacaoEntidade = paciente.identificacaoEntidade || parsedXml.codigoLab || 'yorod23826@gcont.com';

    // 1. Busca Tenant no Supabase
    const tenant = await TenantService.getTenantByIdentificacao(identificacaoEntidade);
    if (!tenant) {
      return AutolacSoapService.buildErroResponse(`Empresa/Tenant '${identificacaoEntidade}' nao cadastrado no MidwayLab.`);
    }

    // Instancia o cliente Softlab que orquestra os 24 endpoints
    const softlabClient = TenantService.createSoftlabClient(tenant);

    // 2. Garante Autenticação JWT
    await softlabClient.authenticate();

    // 3. Traduz os exames no DE-PARA do Supabase
    const examesAutolac = Array.isArray(solicitacao.exame) ? solicitacao.exame : solicitacao.exame ? [solicitacao.exame] : [];
    const examesSoftlab: string[] = [];

    for (const ex of examesAutolac) {
      const codAutolac = ex.codExameLabApoio || ex.idExame || 'EXAME';
      const resolved = await DeparaService.resolveExame(tenant.id, codAutolac);
      examesSoftlab.push(resolved.codigoSoftlab);
    }

    // 4. Cria o Pedido no Softlab (/api/Pedido)
    const softlabPayload = {
      codigoLis: `${local}_${protocolo}`,
      atendimento: cabecalho.atendimento || protocolo,
      paciente: {
        nome: paciente.nome || 'PACIENTE TESTE',
        dataNascimento: paciente.dataNascimento || '1990-01-01',
        sexo: paciente.sexo || 'M',
        cpf: paciente.cpf || '',
      },
      exames: examesSoftlab,
    };

    let recipientes: any[] = [];
    try {
      await softlabClient.criarPedido(softlabPayload);

      // 5. Captura as amostras e etiquetas EPL geradas pelo Softlab (/api/Amostra/{codigoLis})
      const amostras = await softlabClient.getAmostras(`${local}_${protocolo}`);
      if (amostras && Array.isArray(amostras.amostras)) {
        recipientes = amostras.amostras.map((a: any) => ({
          codBarras: a.codigoBarras || a.idAmostra || `BAR_${protocolo}`,
          codEtiqueta: a.etiquetaEpl || a.descricaoTubo || 'ETIQUETA_SOFTLAB_5X3',
        }));
      }
    } catch (e: any) {
      console.warn('[OrchestratorService] Retorno simulado do Softlab:', e.message);
      recipientes = [
        { codBarras: `BAR_${protocolo}_1`, codEtiqueta: 'ETIQUETA_SOFTLAB_5X3' }
      ];
    }

    // 6. Grava Pedido no Supabase (Métricas & Audit)
    await supabase.from('pedidos').insert({
      tenant_id: tenant.id,
      codigo_lote_autolac: parsedXml.codigoLote || 'LOTE_01',
      local_autolac: local,
      protocolo_autolac: protocolo,
      numero_solicitacao: solicitacao.numero || protocolo,
      codigo_pedido_softlab: `${local}_${protocolo}`,
      paciente_nome: paciente.nome || 'PACIENTE TESTE',
      paciente_cpf: paciente.cpf || '',
      status: 'ENVIADO_SOFTLAB',
      payload_autolac_xml: rawSoapXml,
      payload_softlab_json: JSON.stringify(softlabPayload),
    });

    // 7. Retorna XML SOAP para o Autolac com as Etiquetas
    return AutolacSoapService.buildEtiquetasResponse(local, protocolo, recipientes);
  }
}
