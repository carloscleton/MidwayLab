'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Server,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Terminal,
  ShieldCheck,
  FolderCheck,
  Zap,
  HardDrive,
  Copy,
  Check,
  Download,
  ListChecks,
  FlaskConical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ISetupLocalRoboModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: { id: string; nome: string; configuracoes?: any } | null;
  equipamentos: Array<{ id?: string; nome: string; modelo: string; fabricante?: string; tenant_id?: string }>;
  showNotification: (msg: string) => void;
  onConfigAtualizada?: () => void;
}

interface IPastaCriada {
  equipamentoId: string;
  equipamentoNome: string;
  modelo: string;
  diretorioEntrada: string;
  diretorioProcessados: string;
  diretorioErros: string;
  diretorioCarga: string;
  diretorioResultados: string;
  permissoesOk: boolean;
  erroPermissao?: string;
}

export function SetupLocalRoboModal({
  isOpen,
  onClose,
  activeTenant,
  equipamentos,
  showNotification,
  onConfigAtualizada
}: ISetupLocalRoboModalProps) {
  const [pastaRaiz, setPastaRaiz] = useState('C:\\MidwayLab');
  const [isCriandoPastas, setIsCriandoPastas] = useState(false);
  const [pastasCriadas, setPastasCriadas] = useState<IPastaCriada[]>([]);
  const [roboStatus, setRoboStatus] = useState<{ isRunning: boolean; logs: any[] }>({
    isRunning: false,
    logs: []
  });
  const [isLoadingRobo, setIsLoadingRobo] = useState(false);
  const [isTestingPedido, setIsTestingPedido] = useState(false);
  const [showCredenciais, setShowCredenciais] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedEntrada, setCopiedEntrada] = useState(false);
  const [copiedCarga, setCopiedCarga] = useState(false);
  const [copiedResultados, setCopiedResultados] = useState(false);
  const [scriptWindowsGerado, setScriptWindowsGerado] = useState<string | null>(null);
  const [scriptInfo, setScriptInfo] = useState<{
    batPath: string;
    batContent: string;
    vbsContent?: string;
    gravadoNoDisco: boolean;
  } | null>(null);

  const downloadArquivo = (conteudo: string, nomeArquivo: string) => {
    try {
      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Falha ao disparar download automático:", e);
    }
  };

  const equipsFiltrados = equipamentos.filter(eq =>
    activeTenant ? eq.tenant_id === activeTenant.id : true
  );
  const modeloAtivo = equipsFiltrados[0]?.modelo || 'SYSMEX_UF_1500';

  const copiarChecklistInstalacao = () => {
    const texto = [
      `========================================================================`,
      `MIDWAYLAB - ROTEIRO DE INSTALAÇÃO DO ZERO NO CLIENTE`,
      `Empresa: ${activeTenant?.nome || 'Laboratório Cliente'}`,
      `Equipamento: ${modeloAtivo}`,
      `Pasta Raiz: ${pastaRaiz || 'C:\\MidwayLab'}`,
      `========================================================================`,
      ``,
      `ETAPA 1: CRIAR ESTRUTURA NO C:\\`,
      `* No assistente da tela, clique em "Criar Pastas com 1 Clique".`,
      `* Será criada a pasta ${pastaRaiz || 'C:\\MidwayLab'} com subpastas e atalhos prontos.`,
      ``,
      `ETAPA 2: CONFIGURAR O LABFÁCIL (LIS DO CLIENTE)`,
      `* No sistema Labfácil / Apoio, configure a exportação de pedidos para:`,
      `  -> ${pastaRaiz || 'C:\\MidwayLab'}\\Labfacil\\${modeloAtivo}\\Entrada`,
      ``,
      `ETAPA 3: CONFIGURAR O ANALISADOR (SOFTWARE DO EQUIPAMENTO)`,
      `* Pasta de Leitura de Carga (Worklist):`,
      `  -> ${pastaRaiz || 'C:\\MidwayLab'}\\Equipamentos\\${modeloAtivo}\\Carga`,
      `* Pasta de Gravação de Resultados (Laudos):`,
      `  -> ${pastaRaiz || 'C:\\MidwayLab'}\\Equipamentos\\${modeloAtivo}\\Resultados`,
      ``,
      `ETAPA 4: ATIVAR O ROBÔ PERMANENTE 24H NO WINDOWS`,
      `* Abra a pasta ${pastaRaiz || 'C:\\MidwayLab'} no Windows Explorer.`,
      `* Clique com botão direito em "1_INSTALAR_ROBO_24H.bat" e selecione "Executar como Administrador".`,
      `* O robô iniciará automaticamente no boot do Windows e ficará monitorando na bandeja do relógio.`,
      ``,
      `ETAPA 5: TESTE DE COMUNICAÇÃO DE PONTA A PONTA`,
      `* Exporte um pedido de teste no Labfácil ou clique em "Gerar Pedido de Teste".`,
      `* O robô consumirá o arquivo de Entrada, gerará a Carga para o analisador e notificará no relógio do Windows.`,
      `========================================================================`
    ].join('\r\n');

    navigator.clipboard.writeText(texto);
    showNotification('📋 Roteiro de instalação copiado! Cole no WhatsApp ou Bloco de Notas.');
  };

  const carregarStatusRobo = async () => {
    try {
      const tenantQuery = activeTenant?.id ? `?tenantId=${activeTenant.id}` : '';
      const res = await fetch(`/api/robot-service${tenantQuery}`);
      const data = await res.json();
      if (data.success) {
        setRoboStatus({
          isRunning: Boolean(data.isRunning || data.ativo),
          logs: data.logs || []
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      carregarStatusRobo();
      const interval = setInterval(carregarStatusRobo, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCriarPastas = async () => {
    if (!activeTenant?.id) {
      showNotification('⚠️ Selecione uma empresa antes de criar as pastas.');
      return;
    }

    setIsCriandoPastas(true);
    try {
      const res = await fetch('/api/setup-local-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          equipamentos: equipsFiltrados,
          pastaRaiz: pastaRaiz
        })
      });

      const data = await res.json();
      if (data.success) {
        setPastasCriadas(data.resultados || []);
        if (data.todasCriadasNoDisco) {
          showNotification(`✓ Estrutura de pastas criada em ${data.pastaRaiz}! Atalhos 1_INSTALAR_ROBO_24H.bat prontos.`);
        } else {
          if (data.batScript) {
            downloadArquivo(data.batScript, 'CRIAR_PASTAS_MIDWAYLAB.bat');
          }
          showNotification(`📥 Arquivo 'CRIAR_PASTAS_MIDWAYLAB.bat' baixado! Execute-o para criar as pastas no Windows.`);
        }
        if (onConfigAtualizada) onConfigAtualizada();
      } else {
        showNotification(`⚠️ Falha ao criar pastas: ${data.error}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro ao criar pastas: ${err.message}`);
    } finally {
      setIsCriandoPastas(false);
    }
  };

  const handleToggleRobo = async (acao: 'iniciar' | 'parar' | 'varrer_agora' | 'gerar_pedido_teste') => {
    if (acao === 'gerar_pedido_teste') {
      setIsTestingPedido(true);
    } else {
      setIsLoadingRobo(true);
    }

    try {
      const res = await fetch('/api/robot-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          tenantId: activeTenant?.id,
          pastaRaiz: pastaRaiz,
          modelo: modeloAtivo
        })
      });
      const data = await res.json();
      if (data.success) {
        if (acao === 'iniciar') {
          try { localStorage.setItem('midway_robot_auto_start', 'true'); } catch (_) {}
        } else if (acao === 'parar') {
          try { localStorage.setItem('midway_robot_auto_start', 'false'); } catch (_) {}
        }
        showNotification(data.message || 'Comando do robô executado!');
        await carregarStatusRobo();
        if (onConfigAtualizada) onConfigAtualizada();
      } else {
        showNotification(`⚠️ Erro: ${data.error}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro ao comunicar com o robô: ${err.message}`);
    } finally {
      setIsLoadingRobo(false);
      setIsTestingPedido(false);
    }
  };

  const handleGerarScriptWindows = async () => {
    setIsLoadingRobo(true);
    try {
      const res = await fetch('/api/robot-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'gerar_script_windows',
          tenantId: activeTenant?.id,
          pastaRaiz: pastaRaiz,
          modelo: modeloAtivo
        })
      });
      const data = await res.json();
      if (data.success) {
        setScriptWindowsGerado(data.batPath);
        setScriptInfo({
          batPath: data.batPath,
          batContent: data.batContent,
          vbsContent: data.vbsContent,
          gravadoNoDisco: Boolean(data.gravadoNoDisco)
        });

        if (data.batContent) {
          downloadArquivo(data.batContent, '1_INSTALAR_ROBO_24H.bat');
        }

        if (data.gravadoNoDisco) {
          showNotification(`✓ Script gerado em ${data.batPath} e pronto no Windows!`);
        } else {
          showNotification(`📥 Arquivo '1_INSTALAR_ROBO_24H.bat' baixado! Execute como Administrador no Windows.`);
        }
      } else {
        showNotification(`⚠️ Erro: ${data.error}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro ao gerar inicializador: ${err.message}`);
    } finally {
      setIsLoadingRobo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-teal-500/40 w-full max-w-5xl max-h-[92vh] rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-y-auto custom-scrollbar">
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shadow-md">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Assistente de Instalação Local & Robô de Produção 24h
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    Carlos Cleton (Admin)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Estrutura de pastas, atalhos autônomos e execução passo a passo para deixar o cliente 100% funcionando.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA SUPERIOR: CONFIGURAÇÃO DE PASTA RAIZ & EMPRESA */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Pasta Raiz no Disco Local (Windows):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pastaRaiz}
                  onChange={(e) => setPastaRaiz(e.target.value)}
                  placeholder="C:\MidwayLab"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-teal-300 font-mono text-xs font-bold w-48 sm:w-56 focus:outline-none focus:border-teal-400"
                />
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  Empresa: <strong className="text-teal-300">{activeTenant?.nome || 'Cliente'}</strong>
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  Modelo: <strong className="text-cyan-300">{modeloAtivo}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={copiarChecklistInstalacao}
            className="bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
            title="Copiar todo o roteiro com caminhos para colar no WhatsApp ou enviar ao suporte"
          >
            <ListChecks className="w-4 h-4 text-teal-400" />
            📋 Copiar Roteiro (WhatsApp / Suporte)
          </button>
        </div>

        {/* GRID PRINCIPAL: 5 CARDS COM EXECUÇÃO INTEGRADA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD 1: GERAR PASTAS NO C:\ */}
          <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-teal-500/50 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5" /> ETAPA 1
                </span>
                {pastasCriadas.length > 0 ? (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pastas Criadas ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Pendente de geração</span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  1. Gerar Estrutura de Pastas no Disco Local
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Cria automaticamente a pasta <code className="text-teal-300 font-mono font-bold">{pastaRaiz}</code> com todas as subpastas necessárias para o Labfácil e para o analisador <strong className="text-slate-200">{modeloAtivo}</strong>, além dos atalhos executáveis.
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                <div>📁 <span className="text-teal-300">{pastaRaiz}\Labfacil\{modeloAtivo}\...</span></div>
                <div>📁 <span className="text-cyan-300">{pastaRaiz}\Equipamentos\{modeloAtivo}\...</span></div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isCriandoPastas}
                onClick={handleCriarPastas}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                <FolderCheck className={`w-4 h-4 ${isCriandoPastas ? 'animate-spin' : ''}`} />
                {isCriandoPastas ? 'Criando Pastas no C:\\...' : '📁 Executar: Criar Pastas com 1 Clique'}
              </button>
            </div>
          </div>

          {/* CARD 2: CONFIGURAR LABFÁCIL LIS */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-cyan-500/50 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" /> ETAPA 2
                </span>
                <span className="text-[10px] text-slate-400">LIS / Exportação</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  2. Configurar Labfácil (Entrada de Pedidos)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  No software Labfácil ou sistema de apoio, aponte a pasta de exportação de pedidos (XML ou JSON) para este diretório:
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold block">
                  Caminho de Entrada dos Pedidos:
                </span>
                <code className="text-xs font-mono text-cyan-300 font-bold block break-all select-all">
                  {pastaRaiz}\Labfacil\{modeloAtivo}\Entrada
                </code>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${pastaRaiz}\\Labfacil\\${modeloAtivo}\\Entrada`);
                  setCopiedEntrada(true);
                  setTimeout(() => setCopiedEntrada(false), 2000);
                  showNotification('📋 Caminho de Entrada copiado para colar no Labfácil!');
                }}
                className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedEntrada ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedEntrada ? 'Caminho Copiado!' : '📋 Copiar Caminho para o Labfácil'}
              </button>
            </div>
          </div>

          {/* CARD 3: CONFIGURAR ANALISADOR / EQUIPAMENTO */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-500/50 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> ETAPA 3
                </span>
                <span className="text-[10px] text-slate-400">Software do Analisador</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  3. Configurar Analisador ({modeloAtivo})
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  No software do aparelho (Sysmex, Horiba, Cormay, etc.), configure as duas pastas de integração:
                </p>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase block">Carga / Worklist:</span>
                    <span className="text-slate-200 text-[11px] font-bold truncate block">{pastaRaiz}\Equipamentos\{modeloAtivo}\Carga</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${pastaRaiz}\\Equipamentos\\${modeloAtivo}\\Carga`);
                      setCopiedCarga(true);
                      setTimeout(() => setCopiedCarga(false), 2000);
                      showNotification('📋 Caminho de Carga copiado!');
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
                    title="Copiar Carga"
                  >
                    {copiedCarga ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Resultados / Laudos:</span>
                    <span className="text-slate-200 text-[11px] font-bold truncate block">{pastaRaiz}\Equipamentos\{modeloAtivo}\Resultados</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${pastaRaiz}\\Equipamentos\\${modeloAtivo}\\Resultados`);
                      setCopiedResultados(true);
                      setTimeout(() => setCopiedResultados(false), 2000);
                      showNotification('📋 Caminho de Resultados copiado!');
                    }}
                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
                    title="Copiar Resultados"
                  >
                    {copiedResultados ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${pastaRaiz}\\Equipamentos\\${modeloAtivo}\\Carga`);
                  showNotification('📋 Caminho de Carga copiado!');
                }}
                className="w-1/2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Carga
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${pastaRaiz}\\Equipamentos\\${modeloAtivo}\\Resultados`);
                  showNotification('📋 Caminho de Resultados copiado!');
                }}
                className="w-1/2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Resultados
              </button>
            </div>
          </div>

          {/* CARD 4: ATIVAR ROBÔ 24H NO WINDOWS */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-500/50 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> ETAPA 4
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                    roboStatus.isRunning
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${roboStatus.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {roboStatus.isRunning ? 'ROBÔ ONLINE (24H)' : 'ROBÔ PARADO'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  4. Ativação do Robô Permanente (24h Windows)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  O robô monitora as pastas em segundo plano. Para nunca depender do navegador, use o atalho de 1 clique gerado na raiz:
                </p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px] block">Atalho no Windows Explorer:</span>
                <code className="text-emerald-300 font-mono font-bold text-xs mt-0.5 block">
                  👉 {pastaRaiz}\1_INSTALAR_ROBO_24H.bat
                </code>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Inicia automaticamente toda vez que o Windows ligar.
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              {roboStatus.isRunning ? (
                <button
                  type="button"
                  disabled={isLoadingRobo}
                  onClick={() => handleToggleRobo('parar')}
                  className="w-full sm:w-1/2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-3 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" /> Pausar Robô
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoadingRobo}
                  onClick={() => handleToggleRobo('iniciar')}
                  className="w-full sm:w-1/2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Executar: Iniciar Robô
                </button>
              )}

              <button
                type="button"
                disabled={isLoadingRobo}
                onClick={handleGerarScriptWindows}
                className="w-full sm:w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                title="Configurar inicialização automática no Windows"
              >
                <Zap className="w-3.5 h-3.5" /> Configurar Auto 24h
              </button>
            </div>
          </div>

          {/* CARD 5: TESTAR E VALIDAR ESTEIRA DE PONTA A PONTA (FULL-WIDTH) */}
          <div className="md:col-span-2 bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4.5 space-y-3.5 hover:border-amber-500/60 transition shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ETAPA 5
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  5. Testar e Validar Esteira de Ponta a Ponta
                </h4>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isTestingPedido}
                  onClick={() => handleToggleRobo('gerar_pedido_teste')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                  title="Gera um XML de teste na pasta Entrada e processa na hora"
                >
                  <FlaskConical className={`w-4 h-4 ${isTestingPedido ? 'animate-spin' : ''}`} />
                  {isTestingPedido ? 'Gerando Teste...' : '🧪 Executar Teste: Gerar Pedido na Entrada'}
                </button>

                <button
                  type="button"
                  disabled={isLoadingRobo}
                  onClick={() => handleToggleRobo('varrer_agora')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                  title="Força uma varredura imediata nas pastas"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRobo ? 'animate-spin' : ''}`} />
                  Varrer Agora
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Clique em <strong className="text-amber-300">"Executar Teste"</strong> para que o sistema gere um pedido XML real na pasta <code className="text-teal-300 font-mono font-bold">{pastaRaiz}\Labfacil\{modeloAtivo}\Entrada</code>. O robô irá processá-lo instantaneamente, gerando o arquivo de carga para o analisador em <code className="text-cyan-300 font-mono font-bold">{pastaRaiz}\Equipamentos\{modeloAtivo}\Carga</code> e movendo o original para <code className="text-slate-400 font-mono font-bold">Processados</code>.
            </p>

            {/* TERMINAL DE LOGS EM TEMPO REAL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" />
                  Terminal de Processamento em Tempo Real
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {roboStatus.logs.length} eventos registrados
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-1 text-slate-300">
                {roboStatus.logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-3 text-xs italic">
                    Nenhum arquivo processado ainda. Clique no botão acima "Executar Teste" para validar a esteira.
                  </div>
                ) : (
                  roboStatus.logs.slice(0, 15).map((log, i) => (
                    <div key={log.id || i} className="flex items-start gap-2 border-b border-slate-900 pb-1">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span
                        className={`font-bold shrink-0 ${
                          log.status === 'PROCESSADO'
                            ? 'text-emerald-400'
                            : log.status === 'ERRO'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {log.status}:
                      </span>
                      <span className="text-slate-200 truncate flex-1">{log.mensagem}</span>
                      <span className="text-slate-400 text-[10px] shrink-0 font-bold">
                        {log.paciente ? `(${log.paciente})` : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DICA PRÁTICA FORMATADA (SEM QUEBRA INDEVIDA DE PALAVRAS) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0 mt-0.5">💡</span>
            <p className="text-slate-300 leading-relaxed m-0">
              <strong className="text-teal-300 font-semibold">Dica de Gestão:</strong> Os arquivos executáveis <code className="text-cyan-300 font-mono font-bold">1_INSTALAR_ROBO_24H.bat</code>, <code className="text-cyan-300 font-mono font-bold">2_INICIAR_ROBO_BANDEJA.bat</code> e <code className="text-cyan-300 font-mono font-bold">3_VER_STATUS_ROBO.bat</code> ficam gravados na raiz de <code className="text-teal-300 font-mono font-bold">{pastaRaiz}</code> para que você ou o laboratório controlem tudo sem precisar abrir o código do projeto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(pastaRaiz);
              showNotification(`📋 Caminho '${pastaRaiz}' copiado!`);
            }}
            className="text-cyan-400 hover:text-cyan-300 font-mono text-xs font-bold underline shrink-0 cursor-pointer self-start sm:self-center"
          >
            Copiar "{pastaRaiz}"
          </button>
        </div>

        {/* ACORDEÃO OPCIONAL: CREDENCIAIS SEGURAS / TOKEN DE API */}
        <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/50">
          <button
            type="button"
            onClick={() => setShowCredenciais(!showCredenciais)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer hover:bg-slate-900/50"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Credenciais Seguras do Laboratório (Token de API & Arquivo .env)
            </span>
            {showCredenciais ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showCredenciais && (
            <div className="p-4 border-t border-slate-800/80 space-y-3 text-xs bg-slate-950/70">
              <p className="text-slate-400 leading-relaxed">
                A máquina do cliente utiliza apenas o Token de API do laboratório. <strong>Nenhuma senha ou chave mestra do banco de dados</strong> fica armazenada no computador local.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Token de API do Laboratório:</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <code className="text-emerald-300 font-mono font-bold truncate">
                      {activeTenant?.configuracoes?.api_token || 'Token não gerado'}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        const token = activeTenant?.configuracoes?.api_token || '';
                        if (token) {
                          navigator.clipboard.writeText(token);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                          showNotification('📋 Token copiado!');
                        }
                      }}
                      className="text-slate-400 hover:text-emerald-400 p-1 cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Configuração .env Pronta:</span>
                    <span className="text-xs text-slate-300">Contém o token e URL do servidor</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                      const token = activeTenant?.configuracoes?.api_token || '';
                      const envContent = [
                        '# MIDWAYLAB - CONFIGURACAO DO AGENTE LOCAL',
                        `MIDWAY_API_URL=${url}`,
                        `MIDWAY_AGENT_TOKEN=${token}`,
                        `EQUIPAMENTO=${modeloAtivo}`,
                        `PASTA_RAIZ=${pastaRaiz}`,
                        ''
                      ].join('\r\n');
                      downloadArquivo(envContent, '.env');
                      showNotification('📥 Arquivo .env baixado!');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar .env
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Fechar Assistente
          </button>
        </div>
      </div>
    </div>
  );
}
