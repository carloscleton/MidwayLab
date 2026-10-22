"use client";

import React, { useState } from "react";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Sparkles,
  Search,
  RefreshCw,
  Cpu,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  FileText
} from "lucide-react";
import { ModelosEquipamentosService, IModeloEquipamentoRecord } from "../services/modelos-equipamentos-service";

interface GerenciarModelosModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogoModelos: IModeloEquipamentoRecord[];
  onAtualizarCatalogo: () => Promise<void>;
  onAbrirNovoModeloWeb: () => void;
  showNotification: (msg: string) => void;
}

export default function GerenciarModelosModal({
  isOpen,
  onClose,
  catalogoModelos,
  onAtualizarCatalogo,
  onAbrirNovoModeloWeb,
  showNotification
}: GerenciarModelosModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingModelo, setEditingModelo] = useState<IModeloEquipamentoRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  if (!isOpen) return null;

  const modelosFiltrados = catalogoModelos.filter(m =>
    m.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo_modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.fabricante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tipo_analise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAtivo = async (modelo: IModeloEquipamentoRecord) => {
    try {
      const novoStatus = !modelo.ativo;
      const res = await ModelosEquipamentosService.salvarModelo({
        ...modelo,
        ativo: novoStatus
      });
      if (res.success) {
        showNotification(`✓ Modelo '${modelo.nome_completo}' agora está ${novoStatus ? "ATIVO (Online)" : "INATIVO (Offline)"}!`);
        await onAtualizarCatalogo();
      } else {
        showNotification(`⚠️ Erro ao atualizar status: ${res.error || "desconhecido"}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro: ${err.message}`);
    }
  };

  const handleExcluirModelo = async (modelo: IModeloEquipamentoRecord) => {
    const confirmMsg = `Tem certeza que deseja remover o modelo '${modelo.nome_completo}' (${modelo.codigo_modelo}) do banco de dados?`;
    if (!confirm(confirmMsg)) return;

    setIsDeleting(modelo.codigo_modelo);
    try {
      const res = await ModelosEquipamentosService.excluirModelo({
        id: modelo.id,
        codigo_modelo: modelo.codigo_modelo
      });
      if (res.success) {
        showNotification(`🗑️ Modelo '${modelo.nome_completo}' removido do banco com sucesso!`);
        await onAtualizarCatalogo();
      } else {
        showNotification(`⚠️ Não foi possível excluir o modelo: ${res.error || "Erro no banco de dados."}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro ao excluir: ${err.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModelo) return;

    setIsSaving(true);
    try {
      const res = await ModelosEquipamentosService.salvarModelo(editingModelo);
      if (res.success) {
        showNotification(`✓ Modelo '${editingModelo.nome_completo}' atualizado com sucesso!`);
        await onAtualizarCatalogo();
        setEditingModelo(null);
      } else {
        showNotification(`⚠️ Erro ao salvar: ${res.error || "desconhecido"}`);
      }
    } catch (err: any) {
      showNotification(`⚠️ Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-2xl p-6 space-y-4 shadow-2xl relative flex flex-col">
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-400" />
              <h3 className="text-lg font-bold text-slate-100">
                Catálogo Global de Modelos de Equipamentos (Banco Supabase)
              </h3>
              <span className="bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                {catalogoModelos.length} Modelos Cadastrados
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie os analisadores laboratoriais suportados pelo sistema. Edite dados de conexão, ative/desative (Online/Offline) ou exclua modelos do banco.
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

        {/* BARRA DE AÇÕES E PESQUISA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por nome do equipamento, fabricante, código ou tipo de análise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onAbrirNovoModeloWeb();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> + Novo Modelo (Pesquisa Web)
          </button>
        </div>

        {/* LISTAGEM DOS MODELOS (TABELA / CARDS CRUD) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {modelosFiltrados.length === 0 ? (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
              <Server className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">Nenhum modelo localizado</h4>
              <p className="text-xs text-slate-500">Tente buscar por outro termo ou cadastre um novo analisador via pesquisa web.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modelosFiltrados.map((modelo) => {
                const img = modelo.configuracoes?.imagem_url || modelo.imagem_url;
                const isOff = modelo.ativo === false;

                return (
                  <div
                    key={modelo.id || modelo.codigo_modelo}
                    className={`bg-slate-950 border rounded-xl p-3.5 space-y-3 transition ${
                      isOff ? "border-slate-800/60 opacity-60 bg-slate-950/40" : "border-slate-800 hover:border-teal-500/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Foto Real */}
                      {img ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                          <img src={img} alt={modelo.nome_completo} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600 flex-shrink-0 text-[10px]">
                          Sem Foto
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-100 text-xs truncate" title={modelo.nome_completo}>
                            {modelo.nome_completo}
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                              isOff
                                ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isOff ? "OFFLINE" : "ATIVO"}
                          </span>
                        </div>

                        <span className="text-[10px] text-teal-400 font-mono font-bold block mt-0.5">
                          {modelo.codigo_modelo} • {modelo.fabricante}
                        </span>

                        <span className="text-[10px] text-slate-400 block truncate" title={modelo.tipo_analise}>
                          {modelo.tipo_analise}
                        </span>
                      </div>
                    </div>

                    {/* DADOS DE PROTOCOLO, IP E EXAMES */}
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 text-[10px] font-mono space-y-1 text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2" title={modelo.protocolo_comunicacao}>
                          Protocolo: <strong className="text-slate-200">{modelo.protocolo_comunicacao}</strong>
                        </span>
                        <span className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {modelo.exames?.length || 0} Exames
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/50">
                        <span>
                          Modo: <strong className="text-teal-400">{modelo.configuracoes?.tipo_comunicacao || 'TCP_IP'}</strong>
                          {(modelo.configuracoes?.tipo_comunicacao || 'TCP_IP') === 'TCP_IP' && (
                            <> • IP: <strong className="text-teal-300">{modelo.configuracoes?.ip_host || '192.168.1.150'}</strong>:<strong className="text-teal-300">{modelo.configuracoes?.porta || 5100}</strong></>
                          )}
                          {modelo.configuracoes?.tipo_comunicacao === 'SERIAL' && (
                            <> • Baud: <strong className="text-slate-300">{modelo.configuracoes?.baud_rate || 9600} bps</strong></>
                          )}
                        </span>
                        <span>Fmt: <strong className="text-amber-400">{modelo.configuracoes?.formato_arquivo || 'ASTM'}</strong></span>
                      </div>
                    </div>

                    {/* AÇÕES CRUD */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      {/* TOGGLE ATIVO / DESATIVAR (OFF) */}
                      <button
                        type="button"
                        onClick={() => handleToggleAtivo(modelo)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer ${
                          isOff
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                        title={isOff ? "Ativar modelo para aparecer nos seletores" : "Deixar modelo OFF / inativo"}
                      >
                        {isOff ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        {isOff ? "Ativar Modelo" : "Deixar OFF"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* EDITAR */}
                        <button
                          type="button"
                          onClick={() => setEditingModelo({ ...modelo })}
                          className="text-[10px] text-slate-300 hover:text-teal-300 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer flex items-center gap-1 font-semibold"
                          title="Editar especificações e configurações do modelo"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>

                        {/* EXCLUIR */}
                        <button
                          type="button"
                          disabled={isDeleting === modelo.codigo_modelo}
                          onClick={() => handleExcluirModelo(modelo)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer flex items-center gap-1 font-semibold disabled:opacity-50"
                          title="Excluir modelo do banco de dados"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-400 font-mono">
            Modelos ativos ficam automaticamente disponíveis em todos os dropdowns (Simulador, Monitoramento e Vínculo por Empresa).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* SUB-MODAL: EDITAR MODELO */}
      {editingModelo && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl max-h-[90vh] rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-teal-400" /> Editar Modelo: {editingModelo.codigo_modelo}
              </h3>
              <button
                type="button"
                onClick={() => setEditingModelo(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo do Equipamento</label>
                <input
                  type="text"
                  required
                  value={editingModelo.nome_completo}
                  onChange={(e) => setEditingModelo({ ...editingModelo, nome_completo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fabricante</label>
                  <input
                    type="text"
                    required
                    value={editingModelo.fabricante}
                    onChange={(e) => setEditingModelo({ ...editingModelo, fabricante: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Análise</label>
                  <input
                    type="text"
                    required
                    value={editingModelo.tipo_analise}
                    onChange={(e) => setEditingModelo({ ...editingModelo, tipo_analise: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Protocolo de Comunicação</label>
                  <button
                    type="button"
                    onClick={() => {
                      // Buscar comunicação padrão do modelo
                      const protocolos = editingModelo.configuracoes?.protocolos_suportados || [];
                      const defaultProto = protocolos[0] || editingModelo.protocolo_comunicacao;
                      let tipoCom: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' = 'TCP_IP';
                      let fmt: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV' = 'ASTM';
                      let porta = 5100;

                      if (defaultProto.includes('Serial') || defaultProto.includes('RS-232')) {
                        tipoCom = 'SERIAL';
                        fmt = defaultProto.includes('HL7') ? 'HL7' : 'ASTM';
                      } else if (defaultProto.includes('Arquivo')) {
                        tipoCom = 'ARQUIVO_COMPARTILHADO';
                        fmt = 'JSON';
                      } else {
                        tipoCom = 'TCP_IP';
                        fmt = defaultProto.includes('HL7') ? 'HL7' : 'ASTM';
                        porta = 5100;
                      }

                      setEditingModelo({
                        ...editingModelo,
                        protocolo_comunicacao: defaultProto,
                        configuracoes: {
                          ...editingModelo.configuracoes,
                          tipo_comunicacao: tipoCom,
                          formato_arquivo: fmt,
                          porta: porta,
                          ip_host: editingModelo.configuracoes?.ip_host || '192.168.1.150'
                        }
                      });
                      showNotification("⚡ Protocolo e parâmetros de comunicação padrão restaurados!");
                    }}
                    className="text-[10px] text-teal-400 hover:text-teal-300 font-mono font-bold underline cursor-pointer"
                  >
                    ⚡ Restaurar Comunicação Padrão
                  </button>
                </div>

                {(() => {
                  const protos = editingModelo.configuracoes?.protocolos_suportados && editingModelo.configuracoes.protocolos_suportados.length > 0
                    ? editingModelo.configuracoes.protocolos_suportados
                    : [
                        editingModelo.protocolo_comunicacao,
                        'ASTM E1394-97 (TCP/IP Porta 5100)',
                        'ASTM E1394-97 (Serial RS-232 9600 8N1)',
                        'HL7 v2.3.1 (TCP/IP Porta 5100)',
                        'Arquivo Compartilhado (JSON Worklist)'
                      ].filter((v, i, a) => a.indexOf(v) === i);

                  return (
                    <select
                      value={editingModelo.protocolo_comunicacao}
                      onChange={(e) => {
                        const selProto = e.target.value;
                        let tipoCom: 'SERIAL' | 'TCP_IP' | 'ARQUIVO_COMPARTILHADO' = 'TCP_IP';
                        let fmt: 'XML' | 'JSON' | 'ASTM' | 'HL7' | 'CSV' = 'ASTM';
                        let porta = 5100;

                        if (selProto.includes('Serial') || selProto.includes('RS-232')) {
                          tipoCom = 'SERIAL';
                          fmt = selProto.includes('HL7') ? 'HL7' : 'ASTM';
                        } else if (selProto.includes('Arquivo')) {
                          tipoCom = 'ARQUIVO_COMPARTILHADO';
                          fmt = 'JSON';
                        } else {
                          tipoCom = 'TCP_IP';
                          fmt = selProto.includes('HL7') ? 'HL7' : 'ASTM';
                          porta = 5100;
                        }

                        setEditingModelo({
                          ...editingModelo,
                          protocolo_comunicacao: selProto,
                          configuracoes: {
                            ...editingModelo.configuracoes,
                            tipo_comunicacao: tipoCom,
                            formato_arquivo: fmt,
                            porta: porta,
                            ip_host: editingModelo.configuracoes?.ip_host || '192.168.1.150'
                          }
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-teal-300 font-mono font-bold focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {protos.map((p, idx) => (
                        <option key={idx} value={p}>
                          {idx === 0 ? `⭐ [Padrão Default] ${p}` : p}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL da Imagem Real do Equipamento</label>
                <input
                  type="text"
                  value={editingModelo.configuracoes?.imagem_url || ""}
                  onChange={(e) =>
                    setEditingModelo({
                      ...editingModelo,
                      configuracoes: {
                        ...editingModelo.configuracoes,
                        imagem_url: e.target.value
                      }
                    })
                  }
                  placeholder="https://exemplo.com/foto-do-equipamento.png"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              {/* CONFIGURAÇÃO JSONB */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" /> Parâmetros de Comunicação & Rede (JSONB)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Tipo de Comunicação</label>
                    <select
                      value={editingModelo.configuracoes?.tipo_comunicacao || "TCP_IP"}
                      onChange={(e) =>
                        setEditingModelo({
                          ...editingModelo,
                          configuracoes: {
                            ...editingModelo.configuracoes,
                            tipo_comunicacao: e.target.value as any
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="TCP_IP">🌐 TCP_IP (Rede Local / Ethernet)</option>
                      <option value="SERIAL">🔌 SERIAL (RS-232 / COM)</option>
                      <option value="ARQUIVO_COMPARTILHADO">📁 ARQUIVO_COMPARTILHADO (Pastas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Formato do Protocolo / Mensagem</label>
                    <select
                      value={editingModelo.configuracoes?.formato_arquivo || "ASTM"}
                      onChange={(e) =>
                        setEditingModelo({
                          ...editingModelo,
                          configuracoes: {
                            ...editingModelo.configuracoes,
                            formato_arquivo: e.target.value as any
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="ASTM">ASTM E1394-97 / E1381</option>
                      <option value="HL7">HL7 v2.3.1 / v2.5</option>
                      <option value="JSON">JSON (Worklist API)</option>
                      <option value="CSV">CSV / TXT Delimitado</option>
                      <option value="XML">XML Estruturado</option>
                    </select>
                  </div>
                </div>

                {/* CAMPOS ESPECÍFICOS DE REDE TCP/IP COM IP HOST */}
                {(editingModelo.configuracoes?.tipo_comunicacao || "TCP_IP") === "TCP_IP" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-teal-300 font-semibold mb-1">
                        Endereço IP do Analisador na Rede (Host IP)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 192.168.1.150"
                        value={editingModelo.configuracoes?.ip_host ?? "192.168.1.150"}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              ip_host: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-teal-500/40 rounded-lg px-2.5 py-1.5 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-0.5 block">
                        IP fixo configurado na placa de rede do equipamento para troca de dados via socket.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-teal-300 font-semibold mb-1">Porta TCP</label>
                      <input
                        type="number"
                        placeholder="5100"
                        value={editingModelo.configuracoes?.porta ?? 5100}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              porta: parseInt(e.target.value) || 5100
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-teal-500/40 rounded-lg px-2.5 py-1.5 text-teal-300 font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-0.5 block">
                        Porta padrão de escuta/envio.
                      </span>
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS DE SERIAL RS-232 */}
                {editingModelo.configuracoes?.tipo_comunicacao === "SERIAL" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Baud Rate</label>
                      <select
                        value={editingModelo.configuracoes?.baud_rate || 9600}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              baud_rate: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
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
                        value={editingModelo.configuracoes?.data_bits || 8}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              data_bits: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value={8}>8 bits</option>
                        <option value={7}>7 bits</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Paridade</label>
                      <select
                        value={editingModelo.configuracoes?.parity || "none"}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              parity: e.target.value as any
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value="none">None (Nenhum)</option>
                        <option value="even">Even (Par)</option>
                        <option value="odd">Odd (Ímpar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Stop Bits</label>
                      <select
                        value={editingModelo.configuracoes?.stop_bits || 1}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              stop_bits: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 font-mono text-xs"
                      >
                        <option value={1}>1 bit</option>
                        <option value={2}>2 bits</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS DE ARQUIVO COMPARTILHADO */}
                {editingModelo.configuracoes?.tipo_comunicacao === "ARQUIVO_COMPARTILHADO" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Diretório de Carga (Worklist)</label>
                      <input
                        type="text"
                        placeholder="Ex: C:\Equipamentos\Carga"
                        value={editingModelo.configuracoes?.diretorio_carga || "C:\\Equipamentos\\Carga"}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              diretorio_carga: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Diretório de Resultados</label>
                      <input
                        type="text"
                        placeholder="Ex: C:\Equipamentos\Resultados"
                        value={editingModelo.configuracoes?.diretorio_resultados || "C:\\Equipamentos\\Resultados"}
                        onChange={(e) =>
                          setEditingModelo({
                            ...editingModelo,
                            configuracoes: {
                              ...editingModelo.configuracoes,
                              diretorio_resultados: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modeloAtivoCheck"
                  checked={editingModelo.ativo !== false}
                  onChange={(e) => setEditingModelo({ ...editingModelo, ativo: e.target.checked })}
                  className="rounded border-slate-800 text-teal-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="modeloAtivoCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Modelo Ativo (disponível para seleção nas empresas e simulador)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingModelo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
