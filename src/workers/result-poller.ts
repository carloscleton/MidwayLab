import { supabase } from '../db/supabase';
import { TenantService } from '../services/tenant-service';
import { DeparaService } from '../services/depara-service';
import { AutolacSoapService } from '../services/autolac-soap';

export class ResultPollerWorker {
  private static isRunning = false;

  /**
   * Executa uma rodada de polling nos laudos prontos do Softlab para todos os Tenants ativos
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
          const softlabClient = TenantService.createSoftlabClient(tenant);
          const laudosDisponiveis = await softlabClient.getLaudosDisponiveis(0); // 0 = Disponível

          if (Array.isArray(laudosDisponiveis) && laudosDisponiveis.length > 0) {
            console.log(`[ResultPoller] Tenant ${tenant.nome}: ${laudosDisponiveis.length} laudos disponíveis no Softlab.`);

            for (const item of laudosDisponiveis) {
              const codigoPedidoLis = item.codigoPedidoLis || item.pedido;
              const codigoExameLis = item.codigoExameLis || item.exame;

              // Obtém laudo em HTML/RTF/PDF
              const conteudoHtml = await softlabClient.getLaudoConteudo(codigoPedidoLis, codigoExameLis, 'html');
              const pdfBase64 = Buffer.from(conteudoHtml || 'LAUDO_SOFTLAB').toString('base64');

              // Mapeamento DE-PARA inverso (Softlab -> Autolac)
              const codAutolac = await DeparaService.resolveExameInverso(tenant.id, codigoExameLis);

              // Grava no Histórico do Supabase
              await supabase.from('laudos_historico').insert({
                tenant_id: tenant.id,
                local_autolac: codigoPedidoLis.split('_')[0] || '1',
                protocolo_autolac: codigoPedidoLis.split('_')[1] || codigoPedidoLis,
                codigo_exame_softlab: codigoExameLis,
                codigo_exame_autolac: codAutolac,
                formato_laudo: 'PDF',
                status_envio_autolac: 'ENTREGUE',
                data_hora_liberacao: new Date().toISOString(),
              });

              // Marca como consumido no Softlab Apoio
              await softlabClient.marcarComoConsumido(codigoPedidoLis, codigoExameLis);
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
   * Inicia o loop agendado (ex.: a cada 30 segundos)
   */
  static startScheduler(intervalMs: number = 30000): void {
    console.log(`[ResultPoller] Iniciando worker de polling a cada ${intervalMs / 1000}s...`);
    setInterval(() => {
      this.runPollCycle();
    }, intervalMs);
  }
}
