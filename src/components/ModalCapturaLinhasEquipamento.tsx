"use client";

import React, { useState } from "react";
import {
  Radio,
  X,
  FileText,
  Upload,
  Zap,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  Terminal,
  Activity,
  ArrowRight,
  Database
} from "lucide-react";
import {
  EquipmentSnifferService,
  ILinhaResultadoDetectada
} from "../services/equipment-sniffer-service";
import type { ILinhaResultado } from "../services/equipamento-exames-service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  codigoExameAlvo: string;
  nomeExameAlvo?: string;
  modeloEquipamento: string;
  configComunicacao?: {
    tipoComunicacao?: string;
    ipHost?: string;
    porta?: number | string;
    diretorioCarga?: string;
    diretorioResultados?: string;
  } | null;
  onAplicarLinhas: (linhas: ILinhaResultado[]) => void;
}

export default function ModalCapturaLinhasEquipamento({
  isOpen,
  onClose,
  codigoExameAlvo,
  nomeExameAlvo,
  modeloEquipamento,
  configComunicacao,
  onAplicarLinhas
}: Props) {
  const [activeTab, setActiveTab] = useState<"colar" | "rede">("colar");
  const [rawInput, setRawInput] = useState<string>("");
  const [isEscutando, setIsEscutando] = useState<boolean>(false);
  const [feedbackRede, setFeedbackRede] = useState<string | null>(null);

  // Lista de linhas detectadas pelo sniffer
  const [linhasDetectadas, setLinhasDetectadas] = useState<ILinhaResultadoDetectada[]>([]);
  const [formatoDetectado, setFormatoDetectado] = useState<string>("");
  const [linhasSelecionadas, setLinhasSelecionadas] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  // Analisa o texto bruto colado ou recebido
  const handleAnalisarTexto = (textoParaAnalisar?: string) => {
    const texto = textoParaAnalisar !== undefined ? textoParaAnalisar : rawInput;
    if (!texto.trim()) return;

    const res = EquipmentSnifferService.extrairLinhasDeRetornoBruto(texto);
    setFormatoDetectado(res.formatoDetectado);
    setLinhasDetectadas(res.linhas);

    // Por padrão seleciona todos os analitos detectados
    const todasChaves = new Set(res.linhas.map(l => l.codigoEquipamento));
    setLinhasSelecionadas(todasChaves);
  };

  // Carrega exemplo representativo do modelo selecionado
  const handleCarregarExemplo = (modelo: string) => {
    const exemplo = EquipmentSnifferService.gerarExemploRetornoEquipamento(modelo);
    setRawInput(exemplo.raw);
    handleAnalisarTexto(exemplo.raw);
  };

  // Upload de arquivo bruto (.astm, .hl7, .txt, .xml, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || "");
      setRawInput(content);
      handleAnalisarTexto(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Disparo de escuta / conexão com a máquina
  const handleEscutarEquipamento = async () => {
    setIsEscutando(true);
    setFeedbackRede("Conectando e escutando o equipamento...");

    try {
      const tipo = configComunicacao?.tipoComunicacao || "TCP_IP";
      const payload: any = {
        tipoComunicacao: tipo,
        ipHost: configComunicacao?.ipHost,
        porta: configComunicacao?.porta,
        diretorioCarga: configComunicacao?.diretorioCarga,
        diretorioResultados: configComunicacao?.diretorioResultados,
        escutarResultados: true,
        lerUltimoResultado: true
      };

      const res = await fetch("/api/test-equipment-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        const conteudoCapturado = data.respostaRecebida || data.ultimoResultadoConteudo || "";
        if (conteudoCapturado) {
          setRawInput(conteudoCapturado);
          setFeedbackRede(`✓ ${data.message}`);
          handleAnalisarTexto(conteudoCapturado);
        } else {
          setFeedbackRede(`✓ ${data.message} • Dica: Você pode disparar a transmissão de uma amostra no painel da máquina ou carregar um arquivo de exemplo.`);
        }
      } else {
        setFeedbackRede(`⚠️ ${data.message}`);
      }
    } catch (err: any) {
      setFeedbackRede(`❌ Falha na conexão: ${err.message}`);
    } finally {
      setIsEscutando(false);
    }
  };

  // Alterna seleção individual de analito
  const toggleLinha = (cod: string) => {
    setLinhasSelecionadas(prev => {
      const novo = new Set(prev);
      if (novo.has(cod)) novo.delete(cod);
      else novo.add(cod);
      return novo;
    });
  };

  // Alterna seleção de todos
  const toggleTodos = () => {
    if (linhasSelecionadas.size === linhasDetectadas.length) {
      setLinhasSelecionadas(new Set());
    } else {
      setLinhasSelecionadas(new Set(linhasDetectadas.map(l => l.codigoEquipamento)));
    }
  };

  // Aplica as linhas selecionadas no exame
  const handleConfirmar = () => {
    const filtradas: ILinhaResultado[] = linhasDetectadas
      .filter(l => linhasSelecionadas.has(l.codigoEquipamento))
      .map(l => ({
        codigoEquipamento: l.codigoEquipamento,
        descricao: l.descricao,
        parametroRetorno: l.parametroRetorno || codigoExameAlvo,
        enviaParaEquip: l.enviaParaEquip,
        mascara: l.mascara || "0.00",
        fatorMultiplicacao: l.fatorMultiplicacao || "1"
      }));

    onAplicarLinhas(filtradas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-teal-500/50 w-full max-w-4xl rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col animate-fadeIn">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Capturar Linhas de Resultado do Equipamento
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Equipamento: <strong className="text-teal-300 font-mono">{modeloEquipamento}</strong> • Exame Alvo: <strong className="text-purple-300 font-mono">{codigoExameAlvo}</strong> {nomeExameAlvo ? `(${nomeExameAlvo})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ABAS: COLAR/IMPORTAR vs CONECTAR EM REDE */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("colar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "colar"
                  ? "bg-teal-500 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Colar Retorno Bruto / Arquivo (ASTM / HL7 / Log)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("rede")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "rede"
                  ? "bg-teal-500 text-slate-950 shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              2. Conectar e Escutar Equipamento (TCP/IP / Pasta)
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            Auto-aprendizado de Analitos
          </span>
        </div>

        {/* CONTEÚDO DA ABA 1: COLAR / IMPORTAR */}
        {activeTab === "colar" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium">
                Cole a mensagem transmitida pelo analisador ou carregue um arquivo:
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCarregarExemplo("SYSMEX_UF_1500")}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚡ Exemplo Sysmex UF (ASTM)
                </button>
                <button
                  type="button"
                  onClick={() => handleCarregarExemplo("MINDRAY_BS_240")}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚡ Exemplo Mindray (HL7)
                </button>
                <button
                  type="button"
                  onClick={() => handleCarregarExemplo("CB350")}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  ⚡ Exemplo Bioquímica (JSON)
                </button>

                <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3 text-teal-400" /> Carregar Arquivo
                  <input
                    type="file"
                    accept=".astm,.hl7,.txt,.xml,.json,.csv,.res"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <textarea
              rows={4}
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                handleAnalisarTexto(e.target.value);
              }}
              placeholder="Cole aqui o frame de resposta do equipamento (ex: R|1|^^^WBC_MAINFORM|12.5|/uL... ou OBX|1|NM|WBC...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-teal-500/60 leading-relaxed custom-scrollbar select-all"
            />
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: CONECTAR NA REDE */}
        {activeTab === "rede" && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[11px] text-teal-400 font-mono font-bold block uppercase tracking-wider">
                  Configuração de Comunicação Detectada
                </span>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  Tipo: <strong>{configComunicacao?.tipoComunicacao || "TCP_IP"}</strong> • Destino:{" "}
                  <strong className="text-teal-300">
                    {configComunicacao?.tipoComunicacao === "ARQUIVO_COMPARTILHADO"
                      ? (configComunicacao.diretorioResultados || configComunicacao.diretorioCarga || "Pasta Local")
                      : `${configComunicacao?.ipHost || "192.168.1.150"}:${configComunicacao?.porta || 7002}`}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                disabled={isEscutando}
                onClick={handleEscutarEquipamento}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 shrink-0"
              >
                <Zap className={`w-4 h-4 fill-current ${isEscutando ? "animate-spin" : ""}`} />
                {isEscutando ? "Escutando porta..." : "▶ Conectar e Escutar Equipamento"}
              </button>
            </div>

            {feedbackRede && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{feedbackRede}</span>
              </div>
            )}
          </div>
        )}

        {/* ANALITOS EXTRAÍDOS (TABELA COM CHECKBOXES E AUTO-PREENCHIMENTO) */}
        <div className="flex-1 overflow-y-auto space-y-2 border-t border-slate-800 pt-3 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-teal-400" />
                Analitos Detectados ({linhasDetectadas.length})
              </span>
              {formatoDetectado && formatoDetectado !== "DESCONHECIDO" && (
                <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  Formato: {formatoDetectado}
                </span>
              )}
            </div>

            {linhasDetectadas.length > 0 && (
              <button
                type="button"
                onClick={toggleTodos}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                {linhasSelecionadas.size === linhasDetectadas.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> Selecionar Todos ({linhasDetectadas.length})
                  </>
                )}
              </button>
            )}
          </div>

          {linhasDetectadas.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">Sel.</th>
                    <th className="py-2 px-3">Código no Equip.</th>
                    <th className="py-2 px-3 font-sans">Descrição Sugerida</th>
                    <th className="py-2 px-3">Parâmetro de Retorno</th>
                    <th className="py-2 px-3 text-center">Envia?</th>
                    <th className="py-2 px-3 text-center">Máscara</th>
                    <th className="py-2 px-3 text-right">Valor / Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-[11px]">
                  {linhasDetectadas.map((ln, idx) => {
                    const isChecked = linhasSelecionadas.has(ln.codigoEquipamento);

                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleLinha(ln.codigoEquipamento)}
                        className={`transition cursor-pointer ${
                          isChecked ? "bg-teal-950/30 hover:bg-teal-950/40" : "opacity-40 hover:opacity-75"
                        }`}
                      >
                        <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLinha(ln.codigoEquipamento)}
                            className="rounded border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-bold text-teal-300">
                          {ln.codigoEquipamento}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-100 font-medium">
                          {ln.descricao}
                        </td>
                        <td className="py-2 px-3 text-amber-300">
                          <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            {ln.parametroRetorno || codigoExameAlvo}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-emerald-400 font-bold text-[10px]">✓ SIM</span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400">
                          {ln.mascara || "0.00"}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {ln.valorExemplo ? `${ln.valorExemplo} ${ln.unidade || ''}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Nenhum analito extraído ainda. Cole o retorno da máquina ou clique em um dos exemplos rápidos acima.
              </p>
            </div>
          )}
        </div>

        {/* RODAPÉ COM AÇÕES */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-400">
            {linhasSelecionadas.size} de {linhasDetectadas.length} analitos selecionados
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={linhasSelecionadas.size === 0}
              onClick={handleConfirmar}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-teal-500/20 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              Aplicar {linhasSelecionadas.size} Linhas no Exame ({codigoExameAlvo})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
