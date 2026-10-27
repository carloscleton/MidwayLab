'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Server,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Clock,
  ArrowRight,
  HardDrive,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Layers,
  FileCode,
  ShieldCheck
} from 'lucide-react';

interface IEtapaLog {
  etapa: string;
  titulo: string;
  descricao: string;
  status: 'CONCLUIDO' | 'FALHOU' | 'EM_ANDAMENTO';
  timestamp: string;
}

interface ILogItem {
  id: string;
  timestamp: string;
  tenantId: string;
  tenantNome: string;
  modeloEquipamento: string;
  numeroSolicitacao: string;
  pacienteNome: string;
  arquivoNome: string;
  arquivoCarga: string;
  arquivoProcessado: string;
  status: 'PROCESSADO' | 'ERRO';
  mensagemErro?: string | null;
  etapas: IEtapaLog[];
  payloadDetalhes?: any;
}

interface ILogsComunicacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: { id: string; nome: string } | null;
  tenants: Array<{ id: string; nome: string }>;
  showNotification: (msg: string) => void;
}

export function LogsComunicacaoModal({
  isOpen,
  onClose,
  activeTenant,
  tenants,
  showNotification
}: ILogsComunicacaoModalProps) {
  const [logs, setLogs] = useState<ILogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>(activeTenant?.id || 'TODOS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PROCESSADO' | 'ERRO'>('TODOS');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [roboOnline, setRoboOnline] = useState(false);
  const [ultimoHeartbeat, setUltimoHeartbeat] = useState<string | null>(null);

  // Sincroniza o tenant selecionado ao abrir
  useEffect(() => {
    if (activeTenant?.id) {
      setSelectedTenantFilter(activeTenant.id);
    }
  }, [activeTenant]);

  const carregarLogs = async (mostrarLoading = false) => {
    if (mostrarLoading) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTenantFilter && selectedTenantFilter !== 'TODOS') {
        params.set('tenantId', selectedTenantFilter);
      }
      params.set('limit', '80');

      const res = await fetch(`/api/agent-logs?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setLogs(data.logs || []);
        setRoboOnline(Boolean(data.roboOnline));
        setUltimoHeartbeat(data.ultimoHeartbeat || null);
      }
    } catch (err: any) {
      console.warn('[LogsModal] Falha ao carregar logs:', err.message);
    } finally {
      if (mostrarLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarLogs(true);
    }
  }, [isOpen, selectedTenantFilter]);

  // Auto-refresh a cada 4 segundos quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen || !isAutoRefresh) return;
    const interval = setInterval(() => {
      carregarLogs(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoRefresh, selectedTenantFilter]);

  // Filtragem local dos logs
  const logsFiltrados = useMemo(() => {
    return logs.filter(item => {
      const matchStatus = statusFilter === 'TODOS' || item.status === statusFilter;
      const matchSearch =
        !searchTerm.trim() ||
        item.numeroSolicitacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.arquivoNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modeloEquipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenantNome.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [logs, searchTerm, statusFilter]);

  // Métricas rápidas
  const totalProcessados = logs.filter(l => l.status === 'PROCESSADO').length;
  const totalErros = logs.filter(l => l.status === 'ERRO').length;

  const exportarLogsCsv = () => {
    if (logsFiltrados.length === 0) {
      showNotification('⚠️ Não há logs para exportar.');
      return;
    }

    const headers = ['Timestamp', 'Empresa', 'Modelo Equipamento', 'Amostra / Pedido', 'Paciente', 'Arquivo Entrada', 'Status', 'Mensagem / Erro'];
    const rows = logsFiltrados.map(l => [
      `"${new Date(l.timestamp).toLocaleString('pt-BR')}"`,
      `"${l.tenantNome}"`,
      `"${l.modeloEquipamento}"`,
      `"${l.numeroSolicitacao}"`,
      `"${l.pacienteNome}"`,
      `"${l.arquivoNome}"`,
      `"${l.status}"`,
      `"${l.mensagemErro || 'Carga gerada com sucesso'}"`
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Logs_MidwayLab_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('📊 Relatório de logs exportado com sucesso em CSV!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-teal-500/40 w-full max-w-6xl max-h-[94vh] rounded-3xl p-5 space-y-4 shadow-2xl relative flex flex-col overflow-hidden">
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Central de Logs & Rastreabilidade de Equipamentos
                </h3>
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                  Tempo Real 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acompanhe todo o processo: Entrada no Labfácil ➔ Conversão de Layout ➔ Carga no Analisador ➔ Arquivamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* STATUS DO ROBÔ */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                roboOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={ultimoHeartbeat ? `Última conexão: ${new Date(ultimoHeartbeat).toLocaleTimeString('pt-BR')}` : 'Aguardando comunicação do agente local'}
            >
              <span className={`w-2 h-2 rounded-full ${roboOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{roboOnline ? 'ROBÔ CONECTADO' : 'ROBÔ STANDBY'}</span>
            </div>

            {/* BOTÃO ATUALIZAR */}
            <button
              type="button"
              onClick={() => carregarLogs(true)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title="Atualizar logs agora"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {/* BOTÃO FECHAR */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO (KPIS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Total de Eventos</span>
            <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{logs.length}</div>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-3">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold block">Cargas Geradas (Sucesso)</span>
            <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">{totalProcessados}</div>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-3">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold block">Erros / Pasta Erros</span>
            <div className="text-xl font-black text-rose-300 font-mono mt-0.5">{totalErros}</div>
          </div>

          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-3">
            <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold block">Atualização Automática</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono text-slate-300 font-bold">{isAutoRefresh ? 'Ligada (4s)' : 'Pausada'}</span>
              <button
                type="button"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-bold cursor-pointer transition ${
                  isAutoRefresh ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isAutoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="🔍 Pesquisar por Paciente, Amostra, Arquivo ou Modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* SELETOR DE EMPRESA */}
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-teal-300 text-xs rounded-xl px-3 py-1.5 font-bold cursor-pointer focus:outline-none focus:border-teal-400"
            >
              <option value="TODOS">🏢 Todas as Empresas</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>

            {/* FILTRO DE STATUS */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('TODOS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'TODOS' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PROCESSADO')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'PROCESSADO' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✓ Sucesso
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ERRO')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  statusFilter === 'ERRO' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ❌ Erros
              </button>
            </div>

            {/* BOTÃO EXPORTAR */}
            <button
              type="button"
              onClick={exportarLogsCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              title="Baixar lista em formato CSV"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>
        </div>

        {/* LISTAGEM DE LOGS COM TIMELINE EXPANSÍVEL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
          {logsFiltrados.length === 0 ? (
            <div className="text-center py-12 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Nenhum evento registrado com os filtros atuais.</p>
              <p className="text-xs text-slate-600">
                Assim que um arquivo cair na pasta Entrada do analisador, o ciclo completo aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            logsFiltrados.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isErro = log.status === 'ERRO';

              return (
                <div
                  key={log.id}
                  className={`bg-slate-950/80 border rounded-2xl transition duration-150 overflow-hidden ${
                    isErro
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : 'border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  {/* LINHA RESUMO DO EVENTO */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start md:items-center gap-3">
                      {/* Ícone de status */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isErro
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        {isErro ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            Amostra: <span className="text-teal-300 font-black">{log.numeroSolicitacao}</span>
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs font-bold text-slate-100 truncate max-w-xs">
                            {log.pacienteNome}
                          </span>
                          <span className="bg-slate-900 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold">
                            {log.modeloEquipamento}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {log.tenantNome}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                          <span>📄 Arquivo: <code className="text-slate-300">{log.arquivoNome}</code></span>
                          <span>•</span>
                          <span>🕒 {new Date(log.timestamp).toLocaleTimeString('pt-BR')} ({new Date(log.timestamp).toLocaleDateString('pt-BR')})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                          isErro
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isErro ? 'FALHA / ERRO' : 'CARGA GERADA ✓'}
                      </span>

                      <button
                        type="button"
                        className="text-xs text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1 font-mono transition"
                      >
                        {isExpanded ? (
                          <><span>Ocultar Etapas</span><ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                          <><span>Ver 6 Etapas</span><ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* VISUALIZAÇÃO EXPANDIDA DO CICLO DE PREDIDO (TIMELINE DAS 6 ETAPAS) */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 space-y-4 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-teal-400" />
                          Rastreabilidade Completa do Processo (Início ao Fim)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {log.id}</span>
                      </div>

                      {/* DIAGRAMA VISUAL DAS ETAPAS EM GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {log.etapas.map((etp, idx) => {
                          const isEtapaFalhou = etp.status === 'FALHOU';
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border space-y-1 relative ${
                                isEtapaFalhou
                                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                                  : 'bg-slate-950/70 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] text-teal-300 flex items-center gap-1.5">
                                  {idx === 0 && '📥'}
                                  {idx === 1 && '🔍'}
                                  {idx === 2 && '⚙️'}
                                  {idx === 3 && '📦'}
                                  {idx === 4 && '🗄️'}
                                  {idx === 5 && '🌐'}
                                  {etp.titulo}
                                </span>
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                    isEtapaFalhou ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {etp.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 font-mono leading-tight">{etp.descricao}</p>
                              <div className="text-[9px] text-slate-500 font-mono pt-0.5">
                                {new Date(etp.timestamp).toLocaleTimeString('pt-BR')}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* DETALHES DE ARQUIVO E MENSAGEM */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] space-y-1 text-slate-300">
                        {log.arquivoCarga && (
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold shrink-0">📦 Destino Carga:</span>
                            <span className="text-slate-200 truncate">{log.arquivoCarga}</span>
                          </div>
                        )}
                        {log.arquivoProcessado && (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">🗄️ Arquivado em:</span>
                            <span className="text-slate-200 truncate">{log.arquivoProcessado}</span>
                          </div>
                        )}
                        {log.mensagemErro && (
                          <div className="text-rose-400 font-bold pt-1 border-t border-slate-850">
                            ⚠️ Mensagem de Erro: {log.mensagemErro}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Exibindo <strong>{logsFiltrados.length}</strong> eventos registrados</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Fechar Visualizador
          </button>
        </div>
      </div>
    </div>
  );
}
