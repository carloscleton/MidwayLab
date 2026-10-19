import { supabase } from '../db/supabase';
import { TenantService } from '../services/tenant-service';
import { DeparaService } from '../services/depara-service';

export class ResultPollerWorker {
  private static isRunning = false;

  /**
   * Executa uma rodada de polling nos laudos prontos do Labfacil para todos os Tenants ativos
   */
  static async runPollCycle(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 1. Busca todos os Tenants ativos no Supabase
      const { data: tenants, error } = await supabase.from('tenants').select('*').eq('ativo', true);
      if (error || !tenants || tenants.length === 0) {
        this.isRunning = false;
        return;
      }

      for (const tenant of tenants) {
        try {
          const labfacilClient = TenantService.createLabfacilClient(tenant);
          const laudosDisponiveis = await labfacilClient.getLaudosDisponiveis(0); // 0 = Disponível

          if (Array.isArray(laudosDisponiveis) && laudosDisponiveis.length > 0) {
            console.log(`[ResultPoller] Tenant ${tenant.nome}: ${laudosDisponiveis.length} laudos disponíveis no Labfacil.`);

            for (const item of laudosDisponiveis) {
              const codigoPedidoLis = item.codigoPedidoLis || item.pedido;
              const codigoExameLis = item.codigoExameLis || item.exame;

              // Obtém laudo em HTML/RTF/PDF
              const conteudoHtml = await labfacilClient.getLaudoConteudo(codigoPedidoLis, codigoExameLis, 'html');
              const pdfBase64 = Buffer.from(conteudoHtml || 'LAUDO_LABFACIL').toString('base64');

              // Mapeamento DE-PARA inverso (Labfacil -> Autolac / Equipamento)
              const codOrigem = await DeparaService.resolveExameInverso(tenant.id, codigoExameLis);

              // Grava no Histórico do Supabase
              await supabase.from('laudos_historico').insert({
                tenant_id: tenant.id,
                local_autolac: codigoPedidoLis.split('_')[0] || '1',
                protocolo_autolac: codigoPedidoLis.split('_')[1] || codigoPedidoLis,
                codigo_exame_labfacil: codigoExameLis,
                codigo_exame_softlab: codigoExameLis,
                codigo_exame_autolac: codOrigem,
                formato_laudo: 'PDF',
                status_envio_autolac: 'ENTREGUE',
                data_hora_liberacao: new Date().toISOString(),
              });

              // Marca como consumido no Labfacil
              await labfacilClient.marcarComoConsumido(codigoPedidoLis, codigoExameLis);
              console.log(`[ResultPoller] Laudo ${codigoPedidoLis}/${codigoExameLis} entregue e marcado como consumido.`);
            }
          }
        } catch (e: any) {
          console.warn(`[ResultPoller] Aviso no polling do tenant '${tenant.nome}':`, e.message);
        }
      }
    } catch (err: any) {
      console.error('[ResultPoller] Erro no ciclo de polling:', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Inicia o agendamento em segundo plano
   */
  static startScheduler(intervalMs = 60000) {
    console.log(`[ResultPoller] Agendador iniciado com intervalo de ${intervalMs / 1000}s.`);
    setInterval(() => {
      this.runPollCycle().catch((err) => console.error('[ResultPoller] Erro não tratado:', err));
    }, intervalMs);
  }
}
