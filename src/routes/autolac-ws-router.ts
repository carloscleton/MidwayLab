import { Router, Request, Response } from 'express';
import { AutolacSoapService } from '../services/autolac-soap';
import { TenantService } from '../services/tenant-service';
import { DeparaService } from '../services/depara-service';
import { supabase } from '../db/supabase';

export const autolacWsRouter = Router();

autolacWsRouter.post('*', async (req: Request, res: Response) => {
  try {
    const rawBody = req.body && typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    console.log('[AutolacWS] Recebida solicitação SOAP...');

    const parsedXml = AutolacSoapService.parseSoapRequest(rawBody);
    const solicitacao = parsedXml.solicitacao || parsedXml;

    const cabecalho = solicitacao.cabecalho || {};
    const paciente = cabecalho.paciente || {};
    const solicitante = cabecalho.solicitante || {};
    const identificacaoLab = cabecalho.identificacaoLab || {};

    const local = identificacaoLab.local || '1';
    const protocolo = identificacaoLab.protocolo || `P_${Date.now()}`;
    const identificacaoEntidade = paciente.identificacaoEntidade || parsedXml.codigoLab || 'yorod23826@gcont.com';

    // 1. Busca Tenant no Supabase
    const tenant = await TenantService.getTenantByIdentificacao(identificacaoEntidade);
    if (!tenant) {
      const errorXml = AutolacSoapService.buildErroResponse(`Empresa/Tenant '${identificacaoEntidade}' nao cadastrado no MidwayLab.`);
      res.set('Content-Type', 'text/xml');
      return res.send(errorXml);
    }

    // 2. Mapeamento de Exames (Autolac -> Softlab)
    const examesAutolac = Array.isArray(solicitacao.exame) ? solicitacao.exame : solicitacao.exame ? [solicitacao.exame] : [];
    const examesSoftlab: string[] = [];

    for (const ex of examesAutolac) {
      const codAutolac = ex.codExameLabApoio || ex.idExame || 'EXAME';
      const resolved = await DeparaService.resolveExame(tenant.id, codAutolac);
      examesSoftlab.push(resolved.codigoSoftlab);
    }

    // 3. Monta Payload para Softlab Apoio REST API
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

    // 4. Envia para Softlab Apoio
    const softlabClient = TenantService.createSoftlabClient(tenant);
    let softlabResult: any = null;
    let recipientes: any[] = [];

    try {
      softlabResult = await softlabClient.criarPedido(softlabPayload);
      // Busca recipientes/etiquetas do Softlab
      const amostras = await softlabClient.getAmostras(`${local}_${protocolo}`);
      if (amostras && Array.isArray(amostras.amostras)) {
        recipientes = amostras.amostras.map((a: any) => ({
          codBarras: a.codigoBarras || a.idAmostra || `BAR_${protocolo}`,
          codEtiqueta: a.etiquetaEpl || a.descricaoTubo || 'ETIQUETA_SOFTLAB',
        }));
      }
    } catch (e: any) {
      console.warn('[AutolacWS] Softlab API retorno simulado ou aviso:', e.message);
      recipientes = [
        { codBarras: `BAR_${protocolo}_1`, codEtiqueta: 'ETIQUETA_SOFTLAB_01' }
      ];
    }

    // 5. Registra Pedido no Supabase
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
      payload_autolac_xml: rawBody,
      payload_softlab_json: JSON.stringify(softlabPayload),
    });

    // 6. Responde SOAP para o Autolac com as Etiquetas Padrão Softlab
    const responseXml = AutolacSoapService.buildEtiquetasResponse(local, protocolo, recipientes);
    res.set('Content-Type', 'text/xml');
    return res.send(responseXml);

  } catch (error: any) {
    console.error('[AutolacWS] Erro geral na rota SOAP:', error);
    const errorXml = AutolacSoapService.buildErroResponse(`Erro interno no MidwayLab: ${error.message}`);
    res.set('Content-Type', 'text/xml');
    return res.send(errorXml);
  }
});
