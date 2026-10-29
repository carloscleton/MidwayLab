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
  Download
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
  const [scriptWindowsGerado, setScriptWindowsGerado] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedStartupCmd, setCopiedStartupCmd] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
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

  // Carrega status atual do robô ao abrir o modal
  const carregarStatusRobo = async () => {
    try {
      const res = await fetch('/api/robot-service');
      const data = await res.json();
      if (data.success) {
        setRoboStatus({
          isRunning: Boolean(data.isRunning),
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

  const equipsFiltrados = equipamentos.filter(eq =>
    activeTenant ? eq.tenant_id === activeTenant.id : true
  );

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
          showNotification(`✓ Estrutura de pastas criada com sucesso no disco em ${data.pastaRaiz}!`);
        } else {
          // Ambiente Web/Vercel: baixa o script .bat para criar com 2 cliques no Windows
          if (data.batScript) {
            downloadArquivo(data.batScript, 'CRIAR_PASTAS_MIDWAYLAB.bat');
          }
          showNotification(`📥 Arquivo 'CRIAR_PASTAS_MIDWAYLAB.bat' baixado! Dê dois cliques para criar as pastas no seu Windows.`);
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

  const handleToggleRobo = async (acao: 'iniciar' | 'parar' | 'varrer_agora') => {
    setIsLoadingRobo(true);
    try {
      const res = await fetch('/api/robot-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          tenantId: activeTenant?.id,
          pastaRaiz: pastaRaiz
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
          pastaRaiz: pastaRaiz
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

        // Se veio o conteúdo do script, inicia download imediato para a máquina local
        if (data.batContent) {
          downloadArquivo(data.batContent, 'INICIAR_ROBO_MIDWAY.bat');
        }

        if (data.gravadoNoDisco) {
          showNotification(`✓ Script gerado em ${data.batPath} e configurado no Windows!`);
        } else {
          showNotification(`📥 Arquivo 'INICIAR_ROBO_MIDWAY.bat' baixado! Coloque-o na pasta Startup do Windows.`);
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
      <div className="bg-slate-900 border border-teal-500/40 w-full max-w-4xl max-h-[92vh] rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-y-auto custom-scrollbar">
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shadow-md">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Assistente de Instalação Local & Robô de Produção
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    Carlos Cleton (Admin)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cria a estrutura de pastas no computador local do laboratório e coloca o robô para rodar 24h sem depender de navegador.
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

        {/* PASSO 1: DADOS DA INSTALAÇÃO LOCAL */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-teal-400" />
              Passo 1: Definir Pasta Raiz do Disco Local
            </span>
            <span className="text-[11px] text-slate-400">
              Empresa: <strong className="text-slate-200">{activeTenant?.nome || 'Não selecionada'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] text-slate-300 font-semibold">
                Caminho Raiz no Disco Local (Recomendado C:\MidwayLab)
              </label>
              <input
                type="text"
                value={pastaRaiz}
                onChange={(e) => setPastaRaiz(e.target.value)}
                placeholder="C:\MidwayLab"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-400 font-bold"
              />
              <span className="text-[10px] text-slate-500 block">
                O sistema criará automaticamente as subpastas separadas para o Labfácil e para cada equipamento dentro deste diretório.
              </span>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                disabled={isCriandoPastas}
                onClick={handleCriarPastas}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                <FolderCheck className={`w-4 h-4 ${isCriandoPastas ? 'animate-spin' : ''}`} />
                {isCriandoPastas ? 'Criando Pastas...' : '📁 Gerar Pastas com 1 Clique'}
              </button>
            </div>
          </div>

          {/* LISTA DE EQUIPAMENTOS DA EMPRESA */}
          <div className="pt-2 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Equipamentos que receberão as pastas automáticas ({equipsFiltrados.length}):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {equipsFiltrados.length === 0 ? (
                <span className="text-xs text-amber-400 italic">
                  Nenhum equipamento cadastrado ainda nesta empresa. O sistema usará as pastas padrão do modelo.
                </span>
              ) : (
                equipsFiltrados.map(eq => (
                  <span
                    key={eq.id}
                    className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-200 text-xs font-mono flex items-center gap-1.5"
                  >
                    <Server className="w-3 h-3 text-cyan-400" />
                    <strong>{eq.nome}</strong> ({eq.modelo})
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* GUIA / EXEMPLO DA ESTRUTURA DE PASTAS CASO QUEIRA CRIAR MANUALMENTE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                Exemplo da Estrutura Oficial de Pastas (Referência para Criação Manual no Windows)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const modeloExemplo = equipsFiltrados[0]?.modelo || 'SYSMEX_UF_1500';
                const texto = [
                  `${pastaRaiz || 'C:\\MidwayLab'}\\`,
                  `├── Labfacil\\`,
                  `│   └── ${modeloExemplo}\\`,
                  `│       ├── Entrada\\       <- Onde o Labfácil deposita os pedidos`,
                  `│       ├── Processados\\   <- Arquivos já lidos e convertidos`,
                  `│       └── Erros\\         <- Arquivos com divergência`,
                  `└── Equipamentos\\`,
                  `    └── ${modeloExemplo}\\`,
                  `        ├── Carga\\         <- Onde o analisador busca a worklist`,
                  `        └── Resultados\\    <- Onde o analisador grava os resultados`
                ].join('\n');
                navigator.clipboard.writeText(texto);
                showNotification('📋 Exemplo de estrutura de pastas copiado para a área de transferência!');
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-lg font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Copiar árvore de exemplo para colar na documentação ou bloco de notas"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar Estrutura Exemplo
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Se preferir criar as pastas manualmente pelo Windows Explorer, siga exatamente este padrão de diretórios para garantir que o robô e o Labfácil se comuniquem perfeitamente:
          </p>

          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 font-mono text-[11px] text-teal-300 select-all leading-relaxed overflow-x-auto">
            <span className="text-amber-300 font-bold">{pastaRaiz || 'C:\\MidwayLab'}\</span><br />
            ├── <span className="text-slate-100 font-semibold">Labfacil\</span><br />
            │   └── <span className="text-cyan-300 font-bold">{equipsFiltrados[0]?.modelo || 'SYSMEX_UF_1500'}\</span><br />
            │       ├── <span className="text-emerald-400 font-bold">Entrada\</span>       <span className="text-slate-500">&lt;- Onde o Labfácil deposita os pedidos (XML / JSON)</span><br />
            │       ├── <span className="text-slate-400 font-bold">Processados\</span>   <span className="text-slate-500">&lt;- Arquivos já lidos e convertidos com timestamp</span><br />
            │       └── <span className="text-rose-400 font-bold">Erros\</span>         <span className="text-slate-500">&lt;- Arquivos com divergência para auditoria</span><br />
            └── <span className="text-slate-100 font-semibold">Equipamentos\</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;└── <span className="text-cyan-300 font-bold">{equipsFiltrados[0]?.modelo || 'SYSMEX_UF_1500'}\</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-indigo-300 font-bold">Carga\</span>         <span className="text-slate-500">&lt;- Onde o analisador busca a worklist gerada</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── <span className="text-amber-400 font-bold">Resultados\</span>    <span className="text-slate-500">&lt;- Onde o analisador grava os resultados processados</span>
          </div>
        </div>

        {/* FEEDBACK DE PASTAS CRIADAS */}
        {pastasCriadas.length > 0 && (
          <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Estrutura de Pastas Criada e Validada no Disco Local!
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full font-bold">
                {pastasCriadas.length} Analisadores Prontos
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {pastasCriadas.map((p, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span>🔬 {p.equipamentoNome} ({p.modelo})</span>
                    <span className="text-[10px] text-emerald-400">Permissão de Escrita: OK ✓</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1">
                    <div>📥 Labfácil Entrada: <span className="text-teal-300">{p.diretorioEntrada}</span></div>
                    <div>📦 Analisador Carga: <span className="text-cyan-300">{p.diretorioCarga}</span></div>
                    <div>✓ Labfácil Processados: <span className="text-slate-300">{p.diretorioProcessados}</span></div>
                    <div>📊 Analisador Resultados: <span className="text-slate-300">{p.diretorioResultados}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: CREDENCIAIS SEGURAS DA EMPRESA (INSTALAÇÃO NO CLIENTE) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Passo 2: Credenciais Seguras do Cliente (Token de API)
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ Zero Credenciais do Banco no Cliente
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Para garantir <strong>100% de segurança</strong> contra acessos indevidos e invasões, a máquina do cliente 
            <strong> NÃO possui senha do banco de dados (Supabase)</strong> nem chaves mestras. O robô local se comunica com a 
            nuvem MidwayLab utilizando exclusivamente o Token de API deste laboratório.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* SERVIDOR URL */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                URL da API MidwayLab (Servidor):
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-cyan-300 truncate font-bold">
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                    navigator.clipboard.writeText(url);
                    showNotification('📋 URL da API copiada!');
                  }}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 cursor-pointer"
                  title="Copiar URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* TOKEN DO CLIENTE */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                  Token Exclusivo do Laboratório:
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Ativo ✓</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-emerald-300 truncate font-bold select-all">
                  {activeTenant?.configuracoes?.api_token || 'Token não gerado (salve a empresa)'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const token = activeTenant?.configuracoes?.api_token || '';
                    if (token) {
                      navigator.clipboard.writeText(token);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                      showNotification('📋 Token de API copiado!');
                    }
                  }}
                  className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 cursor-pointer"
                  title="Copiar Token"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* BOTÕES DE DOWNLOAD .ENV E INSTRUÇÕES */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400">
              Arquivo de configuração pronto para colocar na pasta do robô:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                  const token = activeTenant?.configuracoes?.api_token || '';
                  const envContent = [
                    '# =====================================================================',
                    '# MIDWAYLAB - CONFIGURACAO SEGURA DO AGENTE LOCAL',
                    `# Laboratorio: ${activeTenant?.nome || 'Cliente'}`,
                    '# NENHUMA chave do banco Supabase fica nesta maquina.',
                    '# =====================================================================',
                    `MIDWAY_API_URL=${url}`,
                    `MIDWAY_AGENT_TOKEN=${token}`,
                    ''
                  ].join('\r\n');
                  downloadArquivo(envContent, '.env');
                  showNotification('📥 Arquivo .env seguro baixado com sucesso!');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" /> Baixar .env do Cliente
              </button>
            </div>
          </div>
        </div>

        {/* PASSO 3: COLOCAR ROBÔ EM PRODUÇÃO (24 HORAS) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-400" />
                Passo 3: Ativação do Robô em Produção 24 Horas
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                  roboStatus.isRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${roboStatus.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                {roboStatus.isRunning ? 'ROBÔ ONLINE (EM PRODUÇÃO)' : 'ROBÔ PARADO'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {roboStatus.isRunning ? (
                <button
                  type="button"
                  disabled={isLoadingRobo}
                  onClick={() => handleToggleRobo('parar')}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" /> Pausar Robô
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoadingRobo}
                  onClick={() => handleToggleRobo('iniciar')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Iniciar Robô em Produção
                </button>
              )}

              <button
                type="button"
                disabled={isLoadingRobo}
                onClick={() => handleToggleRobo('varrer_agora')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                title="Executar varredura manual imediata das pastas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRobo ? 'animate-spin' : ''}`} /> Varrer Agora
              </button>

              <button
                type="button"
                disabled={isLoadingRobo}
                onClick={handleGerarScriptWindows}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                title="Gera script .BAT para iniciar com o Windows"
              >
                <Terminal className="w-3.5 h-3.5" /> ⚡ Iniciar com o Windows (Startup)
              </button>
            </div>
          </div>

          {/* SCRIPT WINDOWS GERADO & INSTRUÇÕES DE STARTUP */}
          {scriptWindowsGerado && (
            <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/30 pb-2.5">
                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Script de Inicialização Automática Pronto!
                  </div>
                  <div className="text-slate-300">
                    Caminho padrão: <code className="text-teal-300 font-bold">{scriptWindowsGerado}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {scriptInfo?.batContent && (
                    <button
                      type="button"
                      onClick={() => downloadArquivo(scriptInfo.batContent, 'INICIAR_ROBO_MIDWAY.bat')}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .BAT
                    </button>
                  )}
                  {scriptInfo?.vbsContent && (
                    <button
                      type="button"
                      onClick={() => downloadArquivo(scriptInfo.vbsContent || '', 'MidwayLab_Silencioso.vbs')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      title="Script VBS para iniciar o robô sem janela preta aberta"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar .VBS (Oculto)
                    </button>
                  )}
                </div>
              </div>

              {/* GUIA PASSO A PASSO PARA INICIAR COM O WINDOWS */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2 text-[11px]">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  📌 Como colocar para iniciar sozinho ao ligar o computador Windows:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 font-sans">
                  <li>
                    Pressione as teclas <kbd className="bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono font-bold">Win + R</kbd> no teclado.
                  </li>
                  <li className="flex items-center gap-2 flex-wrap">
                    <span>Digite o comando:</span>
                    <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">shell:startup</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('shell:startup');
                        setCopiedStartupCmd(true);
                        setTimeout(() => setCopiedStartupCmd(false), 2000);
                      }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 underline font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedStartupCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedStartupCmd ? 'Copiado!' : 'Copiar comando'}
                    </button>
                  </li>
                  <li>
                    A pasta <strong className="text-slate-100">Inicializar do Windows</strong> vai se abrir. Cole o arquivo <code className="text-teal-300 font-mono">INICIAR_ROBO_MIDWAY.bat</code> lá dentro!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* ÚLTIMOS LOGS DO ROBÔ EM TEMPO REAL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                Logs de Execução do Robô (Últimos Processamentos)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {roboStatus.logs.length} registros capturados
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-1 text-slate-300">
              {roboStatus.logs.length === 0 ? (
                <div className="text-slate-500 text-center py-4 text-xs italic">
                  Nenhum arquivo processado ainda. Assim que o Labfácil gravar um arquivo na pasta de Entrada, os logs aparecerão aqui instantaneamente.
                </div>
              ) : (
                roboStatus.logs.slice(0, 20).map((log, i) => (
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

        {/* RODAPÉ DO MODAL */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Fechar Assistente
          </button>
        </div>
      </div>
    </div>
  );
}
