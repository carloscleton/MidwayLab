"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Save, ArrowDownToLine, CheckSquare, X, Search, Check } from "lucide-react";
import type { ICalculadoExame, ILinhaResultado, IExameEquipamentoRecord } from "../services/equipamento-exames-service";
import { validarFormula, calcularFormula, aplicarMascara } from "../lib/formula-calculados";

interface Props {
  exame: IExameEquipamentoRecord;
  todosExames: IExameEquipamentoRecord[];
  salvando: boolean;
  onChange: (patch: Partial<IExameEquipamentoRecord>) => void;
  onGravar: () => void;
  onMoverExamesParaCa?: (examesOrigem: IExameEquipamentoRecord[]) => void;
}

const inputCls =
  "w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-teal-500/60";

export default function ExameResultadosCalculados({
  exame,
  todosExames,
  salvando,
  onChange,
  onGravar,
  onMoverExamesParaCa
}: Props) {
  const linhas = exame.linhasResultado || [];
  const calculados = exame.calculados || [];
  const [testeValores, setTesteValores] = useState<Record<string, string>>({});
  const [testeAberto, setTesteAberto] = useState<number | null>(null);

  // Estado para mover itens do catálogo (itens com badge verde) para as linhas de resultado
  const [itemSelecionadoParaMover, setItemSelecionadoParaMover] = useState<string>("");
  const [isModalLoteOpen, setIsModalLoteOpen] = useState(false);
  const [buscaLote, setBuscaLote] = useState("");
  const [itensLoteSelecionados, setItensLoteSelecionados] = useState<Set<string>>(new Set());
  const [isDragOverLinhas, setIsDragOverLinhas] = useState(false);

  // Lista de outros exames do catálogo que podem ser movidos para cá
  const candidatosMover = useMemo(() => {
    return todosExames.filter(e => {
      const ehProprio = (e.id && exame.id ? e.id === exame.id : e.codigoEquipamento.toUpperCase() === exame.codigoEquipamento.toUpperCase());
      return !ehProprio;
    });
  }, [todosExames, exame]);

  // Candidatos filtrados na busca do modal em lote
  const candidatosFiltrados = useMemo(() => {
    const q = buscaLote.trim().toLowerCase();
    if (!q) return candidatosMover;
    return candidatosMover.filter(c =>
      c.codigoEquipamento.toLowerCase().includes(q) ||
      (c.nomeExame && c.nomeExame.toLowerCase().includes(q)) ||
      (c.codigoLabfacilSugerido && c.codigoLabfacilSugerido.toLowerCase().includes(q))
    );
  }, [candidatosMover, buscaLote]);

  // Códigos que podem ser usados nas fórmulas: exames do aparelho, linhas de resultado e outros calculados
  const codigosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    todosExames.forEach(e => {
      if (e.codigoEquipamento) set.add(e.codigoEquipamento.toUpperCase());
      (e.linhasResultado || []).forEach(l => l.codigoEquipamento && set.add(l.codigoEquipamento.toUpperCase()));
    });
    calculados.forEach(c => c.codigo && set.add(c.codigo.toUpperCase()));
    return Array.from(set);
  }, [todosExames, calculados]);

  const setLinha = (i: number, patch: Partial<ILinhaResultado>) =>
    onChange({ linhasResultado: linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const setCalc = (i: number, patch: Partial<ICalculadoExame>) =>
    onChange({ calculados: calculados.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });

  const moverLinha = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= linhas.length || fromIdx === toIdx) return;
    const nova = [...linhas];
    const [removido] = nova.splice(fromIdx, 1);
    nova.splice(toIdx, 0, removido);
    onChange({ linhasResultado: nova });
  };

  const moverCalc = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= calculados.length || fromIdx === toIdx) return;
    const nova = [...calculados];
    const [removido] = nova.splice(fromIdx, 1);
    nova.splice(toIdx, 0, removido);
    onChange({ calculados: nova });
  };

  const addLinha = () =>
    onChange({
      linhasResultado: [
        ...linhas,
        {
          codigoEquipamento: exame.codigoEquipamento,
          descricao: exame.nomeExame,
          parametroRetorno: exame.codigoLabfacilSugerido,
          enviaParaEquip: true,
          mascara: "",
          fatorMultiplicacao: ""
        }
      ]
    });

  const addCalc = () =>
    onChange({
      calculados: [
        ...calculados,
        { codigo: "", descricao: "", parametroRetorno: exame.codigoLabfacilSugerido, formula: "", global: false, mascara: "", calcularAutomaticamente: true }
      ]
    });

  const resultadoTeste = (c: ICalculadoExame): string => {
    try {
      const valores: Record<string, number> = {};
      Object.keys(testeValores).forEach(k => {
        const n = Number(String(testeValores[k]).replace(",", "."));
        if (testeValores[k] !== "" && !Number.isNaN(n)) valores[k] = n;
      });
      const r = calcularFormula(c.formula, valores);
      return r === null ? "— (faltam valores ou divisão por zero)" : aplicarMascara(r, c.mascara);
    } catch (e: any) {
      return e.message;
    }
  };

  const refsDaFormula = (f: string): string[] =>
    Array.from(new Set((f.match(/\[([^\]]+)\]/g) || []).map(s => s.slice(1, -1).trim().toUpperCase())));

  const th = "py-1.5 px-2 text-left font-bold text-slate-300 bg-slate-900 border-b border-slate-800";

  return (
    <div className="space-y-4 text-xs">
      {/* REALIZADOS NO EQUIPAMENTO (LINHAS DE RESULTADO) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOverLinhas(true);
        }}
        onDragLeave={() => setIsDragOverLinhas(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOverLinhas(false);
          const fromIdxStr = e.dataTransfer.getData("text/plain");
          const fromIdx = fromIdxStr !== "" ? parseInt(fromIdxStr, 10) : null;
          if (fromIdx !== null && !isNaN(fromIdx) && todosExames[fromIdx]) {
            const exOrigem = todosExames[fromIdx];
            const ehProprio = (exOrigem.id && exame.id ? exOrigem.id === exame.id : exOrigem.codigoEquipamento.toUpperCase() === exame.codigoEquipamento.toUpperCase());
            if (!ehProprio && onMoverExamesParaCa) {
              onMoverExamesParaCa([exOrigem]);
            }
          }
        }}
        className={`border rounded-lg p-2.5 space-y-2.5 transition ${
          isDragOverLinhas
            ? "border-emerald-400 bg-emerald-950/30 ring-2 ring-emerald-500/50"
            : "border-slate-800 bg-slate-900/30"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Realizados no Equipamento (linhas de resultado)
            </span>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
              {linhas.length} {linhas.length === 1 ? 'linha' : 'linhas'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* SELETOR RÁPIDO PARA MOVER ITEM DO CATÁLOGO (VERDE) */}
            {candidatosMover.length > 0 && onMoverExamesParaCa && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/40 rounded-lg px-2 py-1 shadow-sm">
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 whitespace-nowrap">
                  <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" /> Mover do catálogo:
                </span>
                <select
                  value={itemSelecionadoParaMover}
                  onChange={(e) => setItemSelecionadoParaMover(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded px-1.5 py-0.5 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-emerald-400 max-w-[200px]"
                >
                  <option value="">-- Escolha o item (verde) --</option>
                  {candidatosMover.map((c) => (
                    <option key={c.id || c.codigoEquipamento} value={c.codigoEquipamento}>
                      {c.codigoEquipamento} - {c.nomeExame || c.codigoEquipamento}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!itemSelecionadoParaMover}
                  onClick={() => {
                    const alvo = candidatosMover.find(c => c.codigoEquipamento === itemSelecionadoParaMover);
                    if (alvo && onMoverExamesParaCa) {
                      onMoverExamesParaCa([alvo]);
                      setItemSelecionadoParaMover("");
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 shadow"
                  title="Mover o exame selecionado para dentro deste exame como linha de resultado"
                >
                  Mover para cá
                </button>

                {/* BOTÃO PARA SELEÇÃO EM LOTE */}
                <button
                  type="button"
                  onClick={() => {
                    setItensLoteSelecionados(new Set());
                    setBuscaLote("");
                    setIsModalLoteOpen(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition border border-emerald-500/30 flex items-center gap-1"
                  title="Selecionar múltiplos itens do catálogo para mover de uma vez só"
                >
                  <CheckSquare className="w-3 h-3" /> Em Lote...
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={addLinha}
              className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-lg px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold text-[11px] transition"
            >
              <Plus className="w-3.5 h-3.5" /> Incluir Linha
            </button>
          </div>
        </div>

        {isDragOverLinhas && (
          <div className="py-2 px-3 bg-emerald-500/20 border-2 border-dashed border-emerald-400 rounded-lg text-center text-emerald-200 text-xs font-bold animate-pulse">
            📥 Solte o exame aqui para adicioná-lo como linha de resultado de {exame.codigoEquipamento}!
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr>
              <th className={th + " w-16 text-center"}>Nº / Ordem</th>
              <th className={th}>Código no Equip.</th>
              <th className={th}>Descrição</th>
              <th className={th}>Parâmetro de Retorno</th>
              <th className={th + " text-center"}>Envia p/ Equip.</th>
              <th className={th}>Máscara</th>
              <th className={th}>Fator de Multiplicação</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={8} className="py-3 px-2 text-slate-400 text-center italic bg-slate-950/40 rounded">
                Nenhuma linha de resultado. Clique em <strong>+ Incluir Linha</strong>, selecione no <strong>Mover do catálogo</strong> ou arraste um exame para cá.
              </td></tr>
            )}
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
                <td className="p-1 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-bold tabular-nums w-4 text-right">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moverLinha(i, i - 1)}
                        className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition text-[10px] font-bold leading-none"
                        title="Mover para cima"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={i === linhas.length - 1}
                        onClick={() => moverLinha(i, i + 1)}
                        className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition text-[10px] font-bold leading-none"
                        title="Mover para baixo"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-1"><input className={inputCls} value={l.codigoEquipamento} onChange={e => setLinha(i, { codigoEquipamento: e.target.value.toUpperCase() })} /></td>
                <td className="p-1"><input className={inputCls} value={l.descricao} onChange={e => setLinha(i, { descricao: e.target.value })} /></td>
                <td className="p-1"><input className={inputCls} value={l.parametroRetorno} onChange={e => setLinha(i, { parametroRetorno: e.target.value.toUpperCase() })} /></td>
                <td className="p-1 text-center"><input type="checkbox" checked={l.enviaParaEquip} onChange={e => setLinha(i, { enviaParaEquip: e.target.checked })} /></td>
                <td className="p-1"><input className={inputCls} placeholder="0.00" value={l.mascara} onChange={e => setLinha(i, { mascara: e.target.value })} /></td>
                <td className="p-1"><input className={inputCls} placeholder="1" value={l.fatorMultiplicacao} onChange={e => setLinha(i, { fatorMultiplicacao: e.target.value })} /></td>
                <td className="p-1 text-right">
                  <button type="button" title="Excluir linha" onClick={() => onChange({ linhasResultado: linhas.filter((_, idx) => idx !== i) })} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE SELEÇÃO EM LOTE DE ITENS DO CATÁLOGO */}
      {isModalLoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
                  Mover itens do Catálogo para {exame.codigoEquipamento}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecione os exames que deseja transformar em linhas de resultado de <strong>{exame.codigoEquipamento} ({exame.nomeExame})</strong>.
                  Eles serão removidos da lista de exames principais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalLoteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE PESQUISA E AÇÃO MARCAR TODOS */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por código ou descrição (ex: RBC, WBC, URINA)..."
                  value={buscaLote}
                  onChange={(e) => setBuscaLote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (itensLoteSelecionados.size === candidatosFiltrados.length && candidatosFiltrados.length > 0) {
                    setItensLoteSelecionados(new Set());
                  } else {
                    const todosKeys = new Set(candidatosFiltrados.map(c => c.codigoEquipamento));
                    setItensLoteSelecionados(todosKeys);
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer whitespace-nowrap"
              >
                {itensLoteSelecionados.size === candidatosFiltrados.length && candidatosFiltrados.length > 0
                  ? "Desmarcar Todos"
                  : `Marcar Todos (${candidatosFiltrados.length})`}
              </button>
            </div>

            {/* LISTA DE ITENS CANDIDATOS */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[45vh] border border-slate-800/80 rounded-xl p-2 bg-slate-950/50">
              {candidatosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  Nenhum exame encontrado com o filtro atual.
                </div>
              ) : (
                candidatosFiltrados.map((item) => {
                  const isChecked = itensLoteSelecionados.has(item.codigoEquipamento);
                  return (
                    <label
                      key={item.id || item.codigoEquipamento}
                      className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer select-none ${
                        isChecked
                          ? "bg-emerald-950/40 border-emerald-500/50 text-slate-100"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const novoSet = new Set(itensLoteSelecionados);
                            if (novoSet.has(item.codigoEquipamento)) {
                              novoSet.delete(item.codigoEquipamento);
                            } else {
                              novoSet.add(item.codigoEquipamento);
                            }
                            setItensLoteSelecionados(novoSet);
                          }}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                        />
                        <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-bold font-mono">
                          {item.codigoEquipamento}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">
                            {item.nomeExame}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cód. Labfacil: <strong className="text-cyan-300 font-mono">{item.codigoLabfacilSugerido || item.codigoEquipamento}</strong>
                            {item.unidadePadrao && item.unidadePadrao !== "-" ? ` • Unidade: ${item.unidadePadrao}` : ""}
                            {item.amostraSugerida ? ` • Amostra: ${item.amostraSugerida}` : ""}
                          </div>
                        </div>
                      </div>

                      {item.linhasResultado && item.linhasResultado.length > 0 && (
                        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                          {item.linhasResultado.length} sublinhas
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Selecionados: <strong className="text-emerald-300">{itensLoteSelecionados.size}</strong> de {candidatosFiltrados.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalLoteOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={itensLoteSelecionados.size === 0}
                  onClick={() => {
                    const selecionados = candidatosMover.filter(c => itensLoteSelecionados.has(c.codigoEquipamento));
                    if (selecionados.length > 0 && onMoverExamesParaCa) {
                      onMoverExamesParaCa(selecionados);
                      setIsModalLoteOpen(false);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Mover Selecionados ({itensLoteSelecionados.size}) para Linhas de Resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULADOS */}
      <div className="border border-slate-800 rounded-lg p-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200">Calculados</span>
          <button type="button" onClick={addCalc} className="text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer font-semibold">
            <Plus className="w-3.5 h-3.5" /> Incluir
          </button>
        </div>
        <p className="text-[10px] text-slate-500">
          Fórmula: use [CÓDIGO] para referenciar exames e + - * / ( ). Ex.: <code className="text-teal-300">[COL]-[TRI]/5-[HDLM]</code>
        </p>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th + " w-16 text-center"}>Nº / Ordem</th>
              <th className={th}>Código</th>
              <th className={th}>Descrição</th>
              <th className={th}>Parâmetro de Retorno</th>
              <th className={th}>Fórmula</th>
              <th className={th + " text-center"}>Global</th>
              <th className={th}>Máscara</th>
              <th className={th + " text-center"}>Calcular automaticamente</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {calculados.length === 0 && (
              <tr><td colSpan={9} className="py-2 px-2 text-slate-500">Nenhum exame calculado. Clique em Incluir.</td></tr>
            )}
            {calculados.map((c, i) => {
              const erro = c.formula ? validarFormula(c.formula, codigosDisponiveis) : null;
              return (
                <React.Fragment key={i}>
                  <tr className="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
                    <td className="p-1 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-mono text-slate-400 font-bold tabular-nums w-4 text-right">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moverCalc(i, i - 1)}
                            className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition text-[10px] font-bold leading-none"
                            title="Mover para cima"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={i === calculados.length - 1}
                            onClick={() => moverCalc(i, i + 1)}
                            className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default transition text-[10px] font-bold leading-none"
                            title="Mover para baixo"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-1"><input className={inputCls} value={c.codigo} onChange={e => setCalc(i, { codigo: e.target.value.toUpperCase() })} /></td>
                    <td className="p-1"><input className={inputCls} value={c.descricao} onChange={e => setCalc(i, { descricao: e.target.value })} /></td>
                    <td className="p-1"><input className={inputCls} value={c.parametroRetorno} onChange={e => setCalc(i, { parametroRetorno: e.target.value.toUpperCase() })} /></td>
                    <td className="p-1">
                      <input className={inputCls + (erro ? " border-rose-500/60" : "")} placeholder="[COL]-[TRI]/5-[HDLM]" value={c.formula} onChange={e => setCalc(i, { formula: e.target.value })} />
                    </td>
                    <td className="p-1 text-center"><input type="checkbox" checked={c.global} onChange={e => setCalc(i, { global: e.target.checked })} /></td>
                    <td className="p-1"><input className={inputCls} placeholder="0.00" value={c.mascara} onChange={e => setCalc(i, { mascara: e.target.value })} /></td>
                    <td className="p-1 text-center"><input type="checkbox" checked={c.calcularAutomaticamente} onChange={e => setCalc(i, { calcularAutomaticamente: e.target.checked })} title="Marcado: o sistema calcula ao receber os resultados. Desmarcado: apenas cadastro da fórmula." /></td>
                    <td className="p-1 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setTesteAberto(testeAberto === i ? null : i)} className="px-1.5 text-[10px] text-cyan-300 hover:text-cyan-200 cursor-pointer font-bold" title="Testar fórmula">ƒ Testar</button>
                      <button type="button" title="Excluir calculado" onClick={() => onChange({ calculados: calculados.filter((_, idx) => idx !== i) })} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                  {(erro || testeAberto === i) && (
                    <tr>
                      <td colSpan={9} className="px-2 pb-2">
                        {erro && <div className="text-rose-400 text-[10px]">⚠ {erro}</div>}
                        {testeAberto === i && !erro && c.formula && (
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                            {refsDaFormula(c.formula).map(ref => (
                              <label key={ref} className="flex items-center gap-1">
                                {ref}
                                <input
                                  className={inputCls + " w-20"}
                                  value={testeValores[ref] ?? ""}
                                  onChange={e => setTesteValores(prev => ({ ...prev, [ref]: e.target.value }))}
                                />
                              </label>
                            ))}
                            <span className="font-bold text-emerald-300">= {resultadoTeste(c)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={salvando}
          onClick={onGravar}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {salvando ? "Gravando..." : "Gravar"}
        </button>
      </div>
    </div>
  );
}
