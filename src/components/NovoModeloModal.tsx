"use client";

import React, { useState } from "react";
import { Sparkles, Search, RefreshCw, Cpu, Tag, Globe, Save, X } from "lucide-react";
import { ModelosEquipamentosService, IModeloEquipamentoRecord } from "../services/modelos-equipamentos-service";

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

        {/* CAMPO DE PESQUISA NA WEB / DOCUMENTAÇÃO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">
            Nome ou Modelo do Equipamento (Ex.: Sysmex XN-550, Cobas c311, Snibe Maglumi 800, Dymind DH36):
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ex.: Sysmex XN-550 / Roche Cobas c311 / Mindray BS-380 / Snibe Maglumi..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePesquisar();
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              disabled={isSearchingDoc || !searchDocQuery.trim()}
              onClick={handlePesquisar}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
            >
              {isSearchingDoc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearchingDoc ? "Pesquisando Doc..." : "Pesquisar Web"}
            </button>
          </div>
        </div>

        {/* RESULTADO PRELIMINAR / FORMULÁRIO DO NOVO MODELO */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {searchedModeloResult ? (
            <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block font-mono">Modelo Identificado</span>
                  <h4 className="text-base font-bold text-slate-100">{searchedModeloResult.nome_completo}</h4>
                </div>
                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                  Código: {searchedModeloResult.codigo_modelo}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Protocolo de Comunicação</span>
                  <input
                    type="text"
                    value={searchedModeloResult.protocolo_comunicacao}
                    onChange={(e) => setSearchedModeloResult({ ...searchedModeloResult, protocolo_comunicacao: e.target.value })}
                    className="w-full bg-transparent text-teal-300 font-mono font-bold mt-0.5 focus:outline-none focus:border-b border-indigo-500"
                  />
                </div>
              </div>

              {/* CONFIGURAÇÃO JSONB */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" /> Configuração Padrão (JSONB)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tipo Conexão</span>
                    <span className="text-slate-200 font-mono font-bold">{searchedModeloResult.configuracoes?.tipo_comunicacao || "TCP_IP"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Formato Mensagem</span>
                    <span className="text-slate-200 font-mono font-bold">{searchedModeloResult.configuracoes?.formato_arquivo || "ASTM"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Porta / Baud</span>
                    <span className="text-slate-200 font-mono font-bold">
                      {searchedModeloResult.configuracoes?.porta
                        ? `Porta ${searchedModeloResult.configuracoes.porta}`
                        : (searchedModeloResult.configuracoes?.baud_rate ? `${searchedModeloResult.configuracoes.baud_rate} bps` : "N/D")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">IP Padrão</span>
                    <span className="text-slate-200 font-mono font-bold">{searchedModeloResult.configuracoes?.ip_host || "192.168.1.50"}</span>
                  </div>
                </div>
              </div>

              {/* PREVIEW DE TESTES MAPEADOS */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" /> Testes / Códigos Identificados na Documentação ({searchedModeloResult.exames?.length || 0})
                  </span>
                  <span className="text-[10px] text-slate-500">Mapeados automaticamente com Labfacil</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {searchedModeloResult.exames?.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950 px-2.5 py-1 rounded border border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400 font-bold">{ex.codigoEquipamento}</span>
                        <span className="text-slate-300 font-sans text-xs">{ex.nomeExame}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                          Labfacil: {ex.codigoLabfacilSugerido || "-"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans">{ex.amostraSugerida || "Soro"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
