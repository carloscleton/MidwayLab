"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit2, Check, X, Tag, Beaker, HelpCircle } from "lucide-react";
import { IExameEquipamentoDoc } from "../data/equipamentos-catalog";

interface ExamesModeloCrudProps {
  exames: IExameEquipamentoDoc[];
  onChange: (novosExames: IExameEquipamentoDoc[]) => void;
  accentColor?: "teal" | "indigo";
}

export default function ExamesModeloCrud({
  exames = [],
  onChange,
  accentColor = "indigo"
}: ExamesModeloCrudProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form states para inclusão / edição
  const [formData, setFormData] = useState<IExameEquipamentoDoc>({
    codigoEquipamento: "",
    nomeExame: "",
    codigoLabfacilSugerido: "",
    amostraSugerida: "Soro",
    unidadePadrao: "mg/dL",
    metodoOuPrincipio: "",
    categoria: "Geral"
  });

  const isTeal = accentColor === "teal";
  const badgeBorder = isTeal ? "border-teal-500/30 text-teal-300 bg-teal-500/10" : "border-indigo-500/30 text-indigo-300 bg-indigo-500/10";
  const btnPrimary = isTeal ? "bg-teal-500 hover:bg-teal-400 text-slate-950" : "bg-indigo-600 hover:bg-indigo-500 text-white";
  const focusBorder = isTeal ? "focus:border-teal-500" : "focus:border-indigo-500";
  const highlightCode = isTeal ? "text-teal-400" : "text-indigo-400";

  // Filtragem dos exames
  const examesFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return exames;
    const q = searchTerm.toLowerCase().trim();
    return exames.filter(
      (ex) =>
        ex.codigoEquipamento?.toLowerCase().includes(q) ||
        ex.nomeExame?.toLowerCase().includes(q) ||
        ex.codigoLabfacilSugerido?.toLowerCase().includes(q) ||
        ex.categoria?.toLowerCase().includes(q) ||
        ex.metodoOuPrincipio?.toLowerCase().includes(q)
    );
  }, [exames, searchTerm]);

  const handleStartAdd = () => {
    setEditingIndex(null);
    setFormData({
      codigoEquipamento: "",
      nomeExame: "",
      codigoLabfacilSugerido: "",
      amostraSugerida: "Soro",
      unidadePadrao: "",
      metodoOuPrincipio: "",
      categoria: "Geral"
    });
    setIsAdding(true);
  };

  const handleStartEdit = (index: number) => {
    const item = exames[index];
    if (!item) return;
    setEditingIndex(index);
    setFormData({ ...item });
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigoEquipamento.trim() || !formData.nomeExame.trim()) {
      alert("Por favor, preencha o código do equipamento e o nome do exame.");
      return;
    }

    const itemFormatado: IExameEquipamentoDoc = {
      codigoEquipamento: formData.codigoEquipamento.trim().toUpperCase(),
      nomeExame: formData.nomeExame.trim(),
      codigoLabfacilSugerido: formData.codigoLabfacilSugerido?.trim() || formData.codigoEquipamento.trim().toUpperCase(),
      amostraSugerida: formData.amostraSugerida?.trim() || "Soro",
      unidadePadrao: formData.unidadePadrao?.trim() || "",
      metodoOuPrincipio: formData.metodoOuPrincipio?.trim() || "",
      categoria: formData.categoria?.trim() || "Geral"
    };

    if (editingIndex !== null) {
      // Edição
      const novos = [...exames];
      novos[editingIndex] = itemFormatado;
      onChange(novos);
    } else {
      // Inclusão
      // Evitar código duplicado se já existir
      const jaExiste = exames.some(
        (ex) => ex.codigoEquipamento?.toUpperCase() === itemFormatado.codigoEquipamento
      );
      if (jaExiste) {
        if (!confirm(`O código ${itemFormatado.codigoEquipamento} já existe neste analisador. Deseja adicionar mesmo assim?`)) {
          return;
        }
      }
      onChange([...exames, itemFormatado]);
    }

    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number, cod: string) => {
    if (confirm(`Remover o exame/código [${cod}] da lista do analisador?`)) {
      const novos = exames.filter((_, i) => i !== index);
      onChange(novos);
    }
  };

  return (
    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
      {/* CABEÇALHO DO CRUD E FILTRO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Tag className={`w-4 h-4 ${highlightCode}`} />
            <span className="text-xs font-bold text-slate-200">
              Códigos de Exames do Analisador ({exames.length})
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${badgeBorder}`}>
              {examesFiltrados.length === exames.length
                ? `${exames.length} exames`
                : `${examesFiltrados.length} de ${exames.length}`}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Mapeamento de códigos técnicos transmitidos nas mensagens ASTM/HL7 e seu vínculo sugerido no Labfacil.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAdd}
          className={`${btnPrimary} font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto`}
        >
          <Plus className="w-3.5 h-3.5" /> Incluir Exame
        </button>
      </div>

      {/* BARRA DE PESQUISA / FILTRO RÁPIDO */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Pesquisar código (ex: WBC, GLI, HGB, TSH), nome do exame ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none ${focusBorder}`}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            title="Limpar pesquisa"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* FORMULÁRIO DE INCLUSÃO / EDIÇÃO INLINE */}
      {isAdding && (
        <form onSubmit={handleSaveForm} className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5 text-indigo-400" />
              {editingIndex !== null ? "Editar Código de Exame" : "Cadastrar Novo Código de Exame"}
            </span>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">
                Código no Analisador *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: WBC, GLI, CREA"
                value={formData.codigoEquipamento}
                onChange={(e) => setFormData({ ...formData, codigoEquipamento: e.target.value.toUpperCase() })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold focus:outline-none ${focusBorder}`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">
                Nome do Exame *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Glicose Enzimática / Leucócitos Totais"
                value={formData.nomeExame}
                onChange={(e) => setFormData({ ...formData, nomeExame: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none ${focusBorder}`}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                Código Labfacil Sugerido
              </label>
              <input
                type="text"
                placeholder="Ex: GLICOSE"
                value={formData.codigoLabfacilSugerido}
                onChange={(e) => setFormData({ ...formData, codigoLabfacilSugerido: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none ${focusBorder}`}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                Amostra Sugerida
              </label>
              <input
                type="text"
                placeholder="Ex: Soro, Sangue Total EDTA"
                value={formData.amostraSugerida}
                onChange={(e) => setFormData({ ...formData, amostraSugerida: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none ${focusBorder}`}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                Unidade Padrão
              </label>
              <input
                type="text"
                placeholder="Ex: mg/dL, 10^3/µL"
                value={formData.unidadePadrao}
                onChange={(e) => setFormData({ ...formData, unidadePadrao: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none ${focusBorder}`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] text-slate-400 mb-0.5">
                Método / Princípio Analítico
              </label>
              <input
                type="text"
                placeholder="Ex: Citometria Laser / GOD-PAP / Jaffé Cinético"
                value={formData.metodoOuPrincipio}
                onChange={(e) => setFormData({ ...formData, metodoOuPrincipio: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none ${focusBorder}`}
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Bioquímica, Hematologia, Hormônios"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none ${focusBorder}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-3 py-1 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${btnPrimary} font-bold px-4 py-1 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition`}
            >
              <Check className="w-3.5 h-3.5" />
              {editingIndex !== null ? "Atualizar Exame" : "Adicionar à Lista"}
            </button>
          </div>
        </form>
      )}

      {/* LISTAGEM DOS EXAMES */}
      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {examesFiltrados.length === 0 ? (
          <div className="bg-slate-950/70 border border-dashed border-slate-800 rounded-xl p-4 text-center">
            <HelpCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
            <p className="text-xs text-slate-400 font-sans">
              {searchTerm
                ? `Nenhum exame encontrado com o termo "${searchTerm}".`
                : "Nenhum exame cadastrado para este modelo de equipamento."}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-2 text-indigo-400 hover:underline text-xs font-sans cursor-pointer"
              >
                Limpar filtro de busca
              </button>
            )}
          </div>
        ) : (
          examesFiltrados.map((ex, idx) => {
            // Achar o index original no array exames para edição/exclusão segura
            const realIndex = exames.indexOf(ex);
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-950 hover:bg-slate-950/90 px-3 py-2 rounded-lg border border-slate-800/80 transition"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <span className={`${highlightCode} font-bold font-mono text-xs px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 flex-shrink-0`}>
                    {ex.codigoEquipamento}
                  </span>
                  <div className="min-w-0">
                    <span className="text-slate-200 font-sans text-xs font-medium block truncate" title={ex.nomeExame}>
                      {ex.nomeExame}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-sans">
                      {ex.categoria && (
                        <span className="text-slate-400">🏷️ {ex.categoria}</span>
                      )}
                      {ex.amostraSugerida && (
                        <span>• Amostra: {ex.amostraSugerida}</span>
                      )}
                      {ex.unidadePadrao && (
                        <span>• Unid: {ex.unidadePadrao}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-mono" title="Código Labfacil Sugerido">
                    Labfacil: {ex.codigoLabfacilSugerido || "-"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(realIndex >= 0 ? realIndex : idx)}
                      className="p-1 text-slate-400 hover:text-teal-300 rounded hover:bg-slate-900 cursor-pointer transition"
                      title="Editar exame"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(realIndex >= 0 ? realIndex : idx, ex.codigoEquipamento)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 cursor-pointer transition"
                      title="Excluir exame"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
