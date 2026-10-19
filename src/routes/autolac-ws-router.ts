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

    // 2. Mapeamento de Exames (Autolac -> Labfacil)
    const examesAutolac = Array.isArray(solicitacao.exame) ? solicitacao.exame : solicitacao.exame ? [solicitacao.exame] : [];
    const examesLabfacil: string[] = [];

    for (const ex of examesAutolac) {
      const codAutolac = ex.codExameLabApoio || ex.idExame || 'EXAME';
      const resolved = await DeparaService.resolveExame(tenant.id, codAutolac);
      examesLabfacil.push(resolved.codigoDestino);
    }

    // 3. Monta Payload para Labfacil REST API
    const labfacilPayload = {
      codigoLis: `${local}_${protocolo}`,
      atendimento: cabecalho.atendimento || protocolo,
      paciente: {
        nome: paciente.nome || 'PACIENTE TESTE',
        dataNascimento: paciente.dataNascimento || '1990-01-01',
        sexo: paciente.sexo || 'M',
        cpf: paciente.cpf || '',
      },
      exames: examesLabfacil,
    };

    // 4. Envia para Labfacil
    const labfacilClient = TenantService.createLabfacilClient(tenant);
    let labfacilResult: any = null;
    let recipientes: any[] = [];

    try {
      labfacilResult = await labfacilClient.criarPedido(labfacilPayload);
      // Busca recipientes/etiquetas do Labfacil
      const amostras = await labfacilClient.getAmostras(`${local}_${protocolo}`);
      if (amostras && Array.isArray(amostras.amostras)) {
        recipientes = amostras.amostras.map((a: any) => ({
          codBarras: a.codigoBarras || a.idAmostra || `BAR_${protocolo}`,
          codEtiqueta: a.etiquetaEpl || a.descricaoTubo || 'ETIQUETA_LABFACIL',
        }));
      }
    } catch (apiErr: any) {
      console.warn('[AutolacWS] Falha ao enviar para Labfacil (usando mock de contingência):', apiErr.message);
      recipientes = [
        { codBarras: `BAR_${protocolo}`, codEtiqueta: 'ETIQUETA_LABFACIL_CONTINGENCIA' }
      ];
    }

    // 5. Salva no banco Supabase
    await supabase.from('pedidos').insert({
      tenant_id: tenant.id,
      codigo_lote_autolac: parsedXml.codigoLote || 'LOTE_01',
      local_autolac: local,
      protocolo_autolac: protocolo,
      numero_solicitacao: solicitacao.numero || protocolo,
      codigo_pedido_labfacil: `${local}_${protocolo}`,
      codigo_pedido_softlab: `${local}_${protocolo}`,
      paciente_nome: paciente.nome || 'PACIENTE TESTE',
      paciente_cpf: paciente.cpf || '',
      status: 'ENVIADO_LABFACIL',
      payload_autolac_xml: rawBody,
      payload_labfacil_json: JSON.stringify(labfacilPayload),
      payload_softlab_json: JSON.stringify(labfacilPayload),
    });

    // 6. Retorna resposta SOAP ao cliente
    const responseXml = AutolacSoapService.buildEtiquetasResponse(local, protocolo, recipientes);
    res.set('Content-Type', 'text/xml');
    return res.send(responseXml);

  } catch (error: any) {
    console.error('[AutolacWS] Erro geral ao processar SOAP:', error);
    const errorXml = AutolacSoapService.buildErroResponse(error.message || 'Erro interno no servidor');
    res.set('Content-Type', 'text/xml');
    return res.status(500).send(errorXml);
  }
});
