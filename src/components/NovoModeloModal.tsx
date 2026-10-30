"use client";

import React, { useState } from "react";
import { Sparkles, Search, RefreshCw, Cpu, Tag, Globe, Save, X, Image as ImageIcon, UploadCloud, Link as LinkIcon, FileText, CheckCircle2 } from "lucide-react";
import { ModelosEquipamentosService, IModeloEquipamentoRecord } from "../services/modelos-equipamentos-service";
import ExamesModeloCrud from "./ExamesModeloCrud";

interface NovoModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeloSalvo: () => void;
  showNotification: (msg: string) => void;
}

export default function NovoModeloModal({
  isOpen,
  onClose,
  onModeloSalvo,
  showNotification
}: NovoModeloModalProps) {
  const [searchDocQuery, setSearchDocQuery] = useState("");
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [searchedModeloResult, setSearchedModeloResult] = useState<IModeloEquipamentoRecord | null>(null);
  const [isSavingNovoModelo, setIsSavingNovoModelo] = useState(false);
  const [modoEntrada, setModoEntrada] = useState<"PESQUISA" | "PDF" | "LINK">("PESQUISA");
  const [manualUrl, setManualUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingManual, setIsProcessingManual] = useState(false);
  const [feedbackManual, setFeedbackManual] = useState<string | null>(null);

  const handleProcessarManual = async () => {
    if (modoEntrada === "PDF" && !selectedFile) {
      showNotification("Selecione um arquivo PDF ou documento do manual.");
      return;
    }
    if (modoEntrada === "LINK" && !manualUrl.trim()) {
      showNotification("Informe o link da documentação técnica na internet.");
      return;
    }

    setIsProcessingManual(true);
    setFeedbackManual(null);

    try {
      const formData = new FormData();
      if (modoEntrada === "PDF" && selectedFile) {
        formData.append("manualFile", selectedFile);
      } else if (modoEntrada === "LINK") {
        formData.append("urlLink", manualUrl.trim());
      }

      const res = await fetch("/api/parse-equipment-manual", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (data.success && data.modelo) {
        setSearchedModeloResult(data.modelo);
        setFeedbackManual(`✓ ${data.totalExamesExtraidos} exames e parâmetros extraídos com sucesso do documento!`);
        showNotification(`🎉 Manual lido com sucesso! ${data.modelo.nome_completo} configurado.`);
      } else {
        setFeedbackManual(`⚠️ ${data.message || "Não foi possível extrair os dados do documento."}`);
        showNotification(`⚠️ Falha ao ler manual: ${data.message || "Erro"}`);
      }
    } catch (err: any) {
      setFeedbackManual(`❌ Erro ao analisar manual: ${err.message}`);
      showNotification(`❌ Erro ao processar documento: ${err.message}`);
    } finally {
      setIsProcessingManual(false);
    }
  };

  if (!isOpen) return null;

  const handlePesquisar = async () => {
    if (!searchDocQuery.trim()) return;
    setIsSearchingDoc(true);
    try {
      const res = await fetch("/api/search-equipment-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo: searchDocQuery.trim() })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSearchedModeloResult(json.data);
        showNotification(`✓ Documentação técnica localizada para ${json.data.nome_completo}!`);
      } else {
        showNotification(`⚠️ Não foi possível obter detalhes automáticos: ${json.message || "erro"}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro na pesquisa: ${err.message}`);
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const handleSalvar = async () => {
    if (!searchedModeloResult) return;
    setIsSavingNovoModelo(true);
    try {
      const res = await ModelosEquipamentosService.salvarModelo(searchedModeloResult);
      if (res.success) {
        showNotification(`🎉 Modelo ${searchedModeloResult.nome_completo} salvo no banco com sucesso!`);
        onModeloSalvo();
        onClose();
      } else {
        showNotification(`⚠️ Erro ao salvar modelo: ${res.error || "desconhecido"}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro ao gravar modelo: ${err.message}`);
    } finally {
      setIsSavingNovoModelo(false);
    }
  };

  // Protocolos suportados disponíveis
  const listaProtocolos = searchedModeloResult?.configuracoes?.protocolos_suportados && searchedModeloResult.configuracoes.protocolos_suportados.length > 0
    ? searchedModeloResult.configuracoes.protocolos_suportados
    : [searchedModeloResult?.protocolo_comunicacao || 'ASTM E1394-97 (TCP/IP Porta 5100)'];

  // Imagem do equipamento
  const imagemEquipamento = searchedModeloResult?.configuracoes?.imagem_url || searchedModeloResult?.imagem_url;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] rounded-2xl p-6 space-y-4 shadow-2xl relative flex flex-col">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Cadastrar Novo Modelo de Analisador
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite o nome ou modelo do equipamento. O sistema consulta a documentação técnica oficial, identifica portas, protocolos (ASTM/HL7/Serial/TCP) e pré-configura os testes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELETOR DE MÉTODO DE IDENTIFICAÇÃO DO ANALISADOR */}
        <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setModoEntrada("PESQUISA")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                modoEntrada === "PESQUISA"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Pesquisar na Web / IA
            </button>
            <button
              type="button"
              onClick={() => setModoEntrada("PDF")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                modoEntrada === "PDF"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> Enviar Manual em PDF
            </button>
            <button
              type="button"
              onClick={() => setModoEntrada("LINK")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                modoEntrada === "LINK"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Colar Link Oficial
            </button>
          </div>

          {/* MODO 1: PESQUISA WEB */}
          {modoEntrada === "PESQUISA" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Digite o nome ou modelo do equipamento (Ex.: Thermo Indiko, Sysmex UF-1500, Cobas c311):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ex.: Thermo Indiko / Sysmex UF-1500 / Cobas c311 / Snibe Maglumi..."
                    value={searchDocQuery}
                    onChange={(e) => setSearchDocQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePesquisar();
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearchingDoc || !searchDocQuery.trim()}
                  onClick={handlePesquisar}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  {isSearchingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  {isSearchingDoc ? "Buscando..." : "Pesquisar Web"}
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: UPLOAD DO MANUAL EM PDF */}
          {modoEntrada === "PDF" && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">
                Selecione o Manual Técnico / Host Interface Guide do Equipamento (.pdf, .txt, .docx):
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <label className="w-full flex-1 border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/80 rounded-xl p-3 text-center cursor-pointer transition">
                  <input
                    type="file"
                    accept=".pdf,.txt,.json,.xml"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold">
                      {selectedFile ? selectedFile.name : "Clique para selecionar o PDF do manual do equipamento"}
                    </span>
                  </div>
                </label>
                <button
                  type="button"
                  disabled={isProcessingManual || !selectedFile}
                  onClick={handleProcessarManual}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingManual ? "animate-spin" : ""}`} />
                  {isProcessingManual ? "Lendo Manual..." : "Processar Manual"}
                </button>
              </div>
            </div>
          )}

          {/* MODO 3: LINK DA DOCUMENTAÇÃO NA WEB */}
          {modoEntrada === "LINK" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                Cole a URL oficial do manual ou página de especificações do fabricante:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://exemplo.com/manual_interface_equipamento.pdf"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={isProcessingManual || !manualUrl.trim()}
                  onClick={handleProcessarManual}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingManual ? "animate-spin" : ""}`} />
                  {isProcessingManual ? "Acessando..." : "Extrair do Link"}
                </button>
              </div>
            </div>
          )}

          {feedbackManual && (
            <div className="text-[11px] font-mono p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{feedbackManual}</span>
            </div>
          )}
        </div>

        {/* RESULTADO PRELIMINAR / FORMULÁRIO DO NOVO MODELO */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {searchedModeloResult ? (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-4">
              
              {/* CABEÇALHO DO MODELO IDENTIFICADO COM IMAGEM */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl">
                {imagemEquipamento ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/30 flex-shrink-0 relative group">
                    <img
                      src={imagemEquipamento}
                      alt={searchedModeloResult.nome_completo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] font-mono text-indigo-300 px-1 py-0.5 rounded">
                      Foto Oficial
                    </span>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-600 flex-shrink-0">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-500" />
                    <span className="text-[9px]">Sem Imagem</span>
                  </div>
                )}

                <div className="flex-1 space-y-1 w-full">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">
                      Modelo Identificado
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                      Código: {searchedModeloResult.codigo_modelo}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100">{searchedModeloResult.nome_completo}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {searchedModeloResult.descricao || `Analisador clínico automatizado fabricado por ${searchedModeloResult.fabricante}.`}
                  </p>
                </div>
              </div>

              {/* CAMPOS PRINCIPAIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Fabricante</span>
                  <input
                    type="text"
                    value={searchedModeloResult.fabricante}
                    onChange={(e) => setSearchedModeloResult({ ...searchedModeloResult, fabricante: e.target.value })}
                    className="w-full bg-transparent text-slate-100 font-bold mt-0.5 focus:outline-none focus:border-b border-indigo-500"
                  />
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Tipo de Análise</span>
                  <input
                    type="text"
                    value={searchedModeloResult.tipo_analise}
                    onChange={(e) => setSearchedModeloResult({ ...searchedModeloResult, tipo_analise: e.target.value })}
                    className="w-full bg-transparent text-slate-100 font-bold mt-0.5 focus:outline-none focus:border-b border-indigo-500"
                  />
                </div>
              </div>

              {/* SELETOR DE PROTOCOLO DE COMUNICAÇÃO (DROPDOWN DINÂMICO COM PADRÃO DEFAULT) */}
              <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-teal-400" /> Protocolo de Comunicação
                  </label>
                  <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 rounded font-mono">
                    Padrão Recomendado / Default
                  </span>
                </div>

                <select
                  value={searchedModeloResult.protocolo_comunicacao}
                  onChange={(e) => {
                    const selectedProto = e.target.value;
                    let tipoCom: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' = 'TCP_IP';
                    let fmt: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV' = 'ASTM';
                    let porta = 5100;

                    if (selectedProto.includes('Serial') || selectedProto.includes('RS-232')) {
                      tipoCom = 'SERIAL';
                      fmt = selectedProto.includes('HL7') ? 'HL7' : 'ASTM';
                    } else if (selectedProto.includes('Arquivo')) {
                      tipoCom = 'ARQUIVO_COMPARTILHADO';
                      fmt = 'JSON';
                    } else {
                      tipoCom = 'TCP_IP';
                      fmt = selectedProto.includes('HL7') ? 'HL7' : 'ASTM';
                      porta = 5100;
                    }

                    setSearchedModeloResult({
                      ...searchedModeloResult,
                      protocolo_comunicacao: selectedProto,
                      configuracoes: {
                        ...searchedModeloResult.configuracoes,
                        tipo_comunicacao: tipoCom,
                        formato_arquivo: fmt,
                        porta: porta
                      }
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-teal-300 font-mono font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {listaProtocolos.map((proto, idx) => (
                    <option key={idx} value={proto}>
                      {idx === 0 ? `⭐ [Padrão Default] ${proto}` : proto}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block">
                  Selecione o protocolo desejado caso sua rede use interfaceamento alternativo (ex.: Serial vs TCP/IP).
                </span>
              </div>

              {/* CONFIGURAÇÃO JSONB */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" /> Parâmetros de Conexão Recomendados (JSONB)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Tipo de Comunicação</label>
                    <select
                      value={searchedModeloResult.configuracoes?.tipo_comunicacao || "TCP_IP"}
                      onChange={(e) =>
                        setSearchedModeloResult({
                          ...searchedModeloResult,
                          configuracoes: {
                            ...searchedModeloResult.configuracoes,
                            tipo_comunicacao: e.target.value as any
                          }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="TCP_IP">🌐 TCP_IP (Rede Local / Ethernet)</option>
                      <option value="SERIAL">🔌 SERIAL (RS-232 / COM)</option>
                      <option value="ARQUIVO_COMPARTILHADO">📁 ARQUIVO_COMPARTILHADO (Pastas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Formato do Protocolo / Mensagem</label>
                    <select
                      value={searchedModeloResult.configuracoes?.formato_arquivo || "ASTM"}
                      onChange={(e) =>
                        setSearchedModeloResult({
                          ...searchedModeloResult,
                          configuracoes: {
                            ...searchedModeloResult.configuracoes,
                            formato_arquivo: e.target.value as any
                          }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="ASTM">ASTM E1394-97 / E1381</option>
                      <option value="HL7">HL7 v2.3.1 / v2.5</option>
                      <option value="JSON">JSON (Worklist API)</option>
                      <option value="CSV">CSV / TXT Delimitado</option>
                      <option value="XML">XML Estruturado</option>
                    </select>
                  </div>
                </div>

                {/* CAMPOS ESPECÍFICOS DE REDE TCP/IP */}
                {(searchedModeloResult.configuracoes?.tipo_comunicacao || "TCP_IP") === "TCP_IP" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-teal-300 font-semibold mb-1">
                        Endereço IP Padrão do Analisador na Rede (Host IP)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 192.168.1.150"
                        value={searchedModeloResult.configuracoes?.ip_host ?? "192.168.1.150"}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              ip_host: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-teal-500/40 rounded-lg px-2.5 py-1.5 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-teal-300 font-semibold mb-1">Porta TCP</label>
                      <input
                        type="number"
                        placeholder="5100"
                        value={searchedModeloResult.configuracoes?.porta ?? 5100}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              porta: parseInt(e.target.value) || 5100
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-teal-500/40 rounded-lg px-2.5 py-1.5 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS DE SERIAL RS-232 */}
                {searchedModeloResult.configuracoes?.tipo_comunicacao === "SERIAL" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Baud Rate</label>
                      <select
                        value={searchedModeloResult.configuracoes?.baud_rate || 9600}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              baud_rate: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value={9600}>9600</option>
                        <option value={19200}>19200</option>
                        <option value={38400}>38400</option>
                        <option value={57600}>57600</option>
                        <option value={115200}>115200</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Data Bits</label>
                      <select
                        value={searchedModeloResult.configuracoes?.data_bits || 8}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              data_bits: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value={8}>8 bits</option>
                        <option value={7}>7 bits</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Paridade</label>
                      <select
                        value={searchedModeloResult.configuracoes?.parity || "none"}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              parity: e.target.value as any
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value="none">None</option>
                        <option value="even">Even</option>
                        <option value="odd">Odd</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Stop Bits</label>
                      <select
                        value={searchedModeloResult.configuracoes?.stop_bits || 1}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              stop_bits: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value={1}>1 bit</option>
                        <option value={2}>2 bits</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS DE ARQUIVO COMPARTILHADO */}
                {searchedModeloResult.configuracoes?.tipo_comunicacao === "ARQUIVO_COMPARTILHADO" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Diretório de Carga</label>
                      <input
                        type="text"
                        placeholder="Ex: C:\Equipamentos\Carga"
                        value={searchedModeloResult.configuracoes?.diretorio_carga || "C:\\Equipamentos\\Carga"}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              diretorio_carga: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Diretório de Resultados</label>
                      <input
                        type="text"
                        placeholder="Ex: C:\Equipamentos\Resultados"
                        value={searchedModeloResult.configuracoes?.diretorio_resultados || "C:\\Equipamentos\\Resultados"}
                        onChange={(e) =>
                          setSearchedModeloResult({
                            ...searchedModeloResult,
                            configuracoes: {
                              ...searchedModeloResult.configuracoes,
                              diretorio_resultados: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CRUD E PESQUISA DOS CÓDIGOS DE EXAMES DO ANALISADOR */}
              <ExamesModeloCrud
                exames={searchedModeloResult.exames || []}
                onChange={(novosExames) =>
                  setSearchedModeloResult({
                    ...searchedModeloResult,
                    exames: novosExames
                  })
                }
                accentColor="indigo"
              />
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
              <Globe className="w-8 h-8 text-indigo-400/50 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Nenhum modelo pesquisado no momento</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Digite o nome de um equipamento que seu laboratório utiliza (ou planeja utilizar) e clique em "Pesquisar Web" para extrair os detalhes técnicos de interfaceamento.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!searchedModeloResult || isSavingNovoModelo}
            onClick={handleSalvar}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition"
          >
            {isSavingNovoModelo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSavingNovoModelo ? "Salvando no Banco..." : "Salvar Modelo no Catálogo"}
          </button>
        </div>
      </div>
    </div>
  );
}
