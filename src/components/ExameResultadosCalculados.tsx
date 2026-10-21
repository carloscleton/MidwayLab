"use client";

import React, { useMemo, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import type { ICalculadoExame, ILinhaResultado, IExameEquipamentoRecord } from "../services/equipamento-exames-service";
import { validarFormula, calcularFormula, aplicarMascara } from "../lib/formula-calculados";

interface Props {
  exame: IExameEquipamentoRecord;
  todosExames: IExameEquipamentoRecord[];
  salvando: boolean;
  onChange: (patch: Partial<IExameEquipamentoRecord>) => void;
  onGravar: () => void;
}

const inputCls =
  "w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-100 font-mono focus:outline-none focus:border-teal-500/60";

export default function ExameResultadosCalculados({ exame, todosExames, salvando, onChange, onGravar }: Props) {
  const linhas = exame.linhasResultado || [];
  const calculados = exame.calculados || [];
  const [testeValores, setTesteValores] = useState<Record<string, string>>({});
  const [testeAberto, setTesteAberto] = useState<number | null>(null);

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
      <div className="border border-slate-800 rounded-lg p-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200">Realizados no Equipamento (linhas de resultado)</span>
          <button type="button" onClick={addLinha} className="text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer font-semibold">
            <Plus className="w-3.5 h-3.5" /> Incluir
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr>
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
              <tr><td colSpan={7} className="py-2 px-2 text-slate-500">Nenhuma linha de resultado. Clique em Incluir.</td></tr>
            )}
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-slate-800/60">
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
              <tr><td colSpan={8} className="py-2 px-2 text-slate-500">Nenhum exame calculado. Clique em Incluir.</td></tr>
            )}
            {calculados.map((c, i) => {
              const erro = c.formula ? validarFormula(c.formula, codigosDisponiveis) : null;
              return (
                <React.Fragment key={i}>
                  <tr className="border-b border-slate-800/60">
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
                      <td colSpan={8} className="px-2 pb-2">
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
