"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  Building2,
  GitCompare,
  FileText,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Sliders,
  Settings,
  User,
  LogOut,
  Layers,
  FileSpreadsheet
} from "lucide-react";

export default function MidwayLabDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tenants" | "depara" | "logs" | "security">("dashboard");
  const [searchExam, setSearchExam] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("San Mathews (ID: 6)");

  // State for mock & dynamic live data
  const [stats, setStats] = useState({
    pedidosIda: 85,
    laudosVolta: 79,
    taxaDepara: "98.8%",
    tenantsAtivos: 3
  });

  // Softlab Exam Catalog sample (from 1,311 fetched)
  const [softlabExames, setSoftlabExames] = useState([
    { codigo: "T3_SOFT", descricao: "TRIODOTIRONINA T3", abreviacao: "T3 DOSAGEM", autolacMapped: "T3", tipo: "PDF" },
    { codigo: "TSH01", descricao: "HORMONIO TIREOESTIMULANTE TSH", abreviacao: "TSH ULTRA", autolacMapped: "TSH", tipo: "ESTRUTURADO" },
    { codigo: "HEMO_FULL", descricao: "HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS", abreviacao: "HEMOGRAMA", autolacMapped: "HEMO", tipo: "ESTRUTURADO" },
    { codigo: "5HIAA", descricao: "ACIDO 5 HIDROXI INDOLACETICO (URINA 24H)", abreviacao: "AC 5 OH-INDOLACETICO", autolacMapped: "5HIAA", tipo: "PDF" },
    { codigo: "GLI_JEJ", descricao: "GLICOSE DOSAGEM EM JEJUM", abreviacao: "GLICOSE", autolacMapped: "GLIC", tipo: "ESTRUTURADO" },
    { codigo: "2HG", descricao: "GLICOSE (APOS 50G BASAL E 120 MINUTOS), CURVA DE", abreviacao: "2 H APOS GLICOSE", autolacMapped: "2HG", tipo: "PDF" },
    { codigo: "02CON", descricao: "ANALISES INDIVIDUAL DA AGUA - 02 DISSOLVIDO", abreviacao: "AGUA - 02 DISSOLVIDO", autolacMapped: "", tipo: "PDF" }
  ]);

  // Client tenants list
  const [tenants, setTenants] = useState([
    {
      id: "6",
      nome: "LAB. ARES - SOFTLAB (San Mathews)",
      identificacaoEntidade: "yorod23826@gcont.com",
      codigoAgente: "1",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: "carloscleton@gmail.com",
      ultimoLote: "85",
      status: "ONLINE"
    },
    {
      id: "7",
      nome: "LABORATORIO CENTRO DIAGNOSTICOS",
      identificacaoEntidade: "centro@labdiag.com.br",
      codigoAgente: "2",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: "centro@softlabsolucoes.com.br",
      ultimoLote: "142",
      status: "ONLINE"
    }
  ]);

  // Integration Logs (Ida e Volta)
  const [logs, setLogs] = useState([
    {
      id: "LOG-904",
      tipo: "IDA (Autolac ➔ Softlab)",
      protocolo: "PROTO-8842",
      paciente: "MARIA OLIVEIRA SILVA",
      exames: "T3, TSH",
      status: "SUCESSO (ETIQUETAS EPL GERADAS)",
      horario: "14:42:10",
      tenant: "San Mathews"
    },
    {
      id: "LOG-903",
      tipo: "VOLTA (Softlab ➔ Autolac)",
      protocolo: "PROTO-8840",
      paciente: "JOAO PEDRO SANTOS",
      exames: "HEMOGRAMA",
      status: "ENTREGUE (LAUDO PDF BASE64)",
      horario: "14:38:05",
      tenant: "San Mathews"
    },
    {
      id: "LOG-902",
      tipo: "IDA (Autolac ➔ Softlab)",
      protocolo: "PROTO-8841",
      paciente: "ANA CARLA SOUZA",
      exames: "GLICOSE",
      status: "SUCESSO (ETIQUETAS EPL GERADAS)",
      horario: "14:31:40",
      tenant: "Centro Diagnósticos"
    }
  ]);

  const filteredExames = softlabExames.filter(e => 
    e.codigo.toLowerCase().includes(searchExam.toLowerCase()) || 
    e.descricao.toLowerCase().includes(searchExam.toLowerCase()) ||
    e.autolacMapped.toLowerCase().includes(searchExam.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
                MidwayLab <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-medium">SaaS Multi-Tenant</span>
              </h1>
              <p className="text-xs text-slate-400">Broker de Integração Autolac ↔ Softlab Apoio</p>
            </div>
          </div>
        </div>

        {/* Live Service Status Indicator */}
        <div className="hidden md:flex items-center gap-6 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Supabase DB:</span>
            <span className="text-emerald-400 font-semibold">Online (iibw...co)</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Softlab API:</span>
            <span className="text-teal-300 font-semibold">1.311 Exames</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Autolac WS:</span>
            <span className="text-cyan-300 font-semibold">Porta 8002</span>
          </div>
        </div>

        {/* User Account & Supabase Auth Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
              CA
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">carloscleton@gmail.com</p>
              <p className="text-[10px] text-teal-400 font-mono">Super Admin (Supabase Auth)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Header */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-2 flex items-center justify-between overflow-x-auto">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "dashboard"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" /> Visão Geral & Flutuabilidade
          </button>

          <button
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "tenants"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Building2 className="w-4 h-4" /> Laboratórios Clientes ({tenants.length})
          </button>

          <button
            onClick={() => setActiveTab("depara")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "depara"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <GitCompare className="w-4 h-4" /> Tabela DE-PARA de Exames
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "logs"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4" /> Logs de Ida e Volta
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "security"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Supabase RLS & Segurança
          </button>
        </nav>

        {/* Current Selected Tenant Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Building2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Empresa Ativa:</span>
          <span className="text-slate-200 font-semibold">{selectedTenant}</span>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* SaaS Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-teal-500/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedidos de Ida (Autolac ➔ Softlab)</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.pedidosIda}</h3>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +12% hoje (Lote #{tenants[0].ultimoLote})
                    </p>
                  </div>
                  <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laudos de Volta (Softlab ➔ Autolac)</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.laudosVolta}</h3>
                    <p className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> PDF Base64 & RTF Prontos
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Sucesso DE-PARA</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.taxaDepara}</h3>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mapeamentos validados
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <GitCompare className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laboratórios no SaaS</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.tenantsAtivos}</h3>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Supabase Multi-Tenant RLS
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5" /> Fluxo de Comunicação Bidirecional
                </div>
                <h2 className="text-xl font-bold text-slate-100">Como o MidwayLab conecta o Autolac ao Softlab Apoio</h2>
                <p className="text-sm text-slate-400 max-w-2xl">
                  O Autolac dispara os atendimentos via SOAP XML para o MidwayLab. O MidwayLab valida no Supabase, converte a tabela DE-PARA e insere no Softlab Apoio. Quando o laudo é liberado, o MidwayLab transforma em PDF/RTF e entrega ao Autolac.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab("logs")}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-teal-500/20"
                >
                  Ver Logs em Tempo Real <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" /> Atividades Recentes de Integração
                  </h3>
                  <p className="text-xs text-slate-400">Sincronizações de ida e volta executadas pelos clientes</p>
                </div>
                <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">ID / Horário</th>
                      <th className="py-3.5 px-5">Direção</th>
                      <th className="py-3.5 px-5">Laboratório Tenant</th>
                      <th className="py-3.5 px-5">Protocolo / Paciente</th>
                      <th className="py-3.5 px-5">Exames Mapeados</th>
                      <th className="py-3.5 px-5">Status da Operação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-5 font-mono text-xs">
                          <span className="font-bold text-slate-200">{log.id}</span>
                          <span className="block text-slate-500">{log.horario}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            log.tipo.includes("IDA")
                              ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {log.tipo.includes("IDA") ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {log.tipo.split(" ")[0]}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-200">{log.tenant}</td>
                        <td className="py-4 px-5">
                          <span className="font-mono text-xs text-teal-300 font-semibold">{log.protocolo}</span>
                          <span className="block text-xs text-slate-400">{log.paciente}</span>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-300">{log.exames}</td>
                        <td className="py-4 px-5">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TENANTS (LABORATÓRIOS CLIENTES) */}
        {activeTab === "tenants" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" /> Cadastro de Laboratórios Clientes (Tenants)
                </h2>
                <p className="text-xs text-slate-400">Configure os parâmetros do Fácil 2024 / Autolac e credenciais do Softlab para cada cliente</p>
              </div>

              <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-teal-500/20">
                <Plus className="w-4 h-4" /> Cadastrar Novo Laboratório
              </button>
            </div>

            {/* Tenants Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.map((t) => (
                <div key={t.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-teal-500/40 transition">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                        #{t.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-base">{t.nome}</h3>
                        <p className="text-xs text-slate-400">ID Entidade Autolac: <span className="font-mono text-teal-300 font-semibold">{t.identificacaoEntidade}</span></p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {t.status}
                    </span>
                  </div>

                  {/* Autolac Screen Details Matching Screenshot */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">URL do WebService Autolac</span>
                      <span className="font-mono text-slate-200 font-medium break-all">{t.wsUrl}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Login API Softlab Apoio</span>
                      <span className="font-mono text-slate-200 font-medium break-all">{t.softlabLogin}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Código do Agente Autolac</span>
                      <span className="font-mono text-teal-400 font-bold">{t.codigoAgente}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Último Lote Enviado</span>
                      <span className="font-mono text-cyan-400 font-bold">#{t.ultimoLote}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">Tabela de Mapeamento: <strong className="text-teal-300">5 Exames Vinculados</strong></span>
                    <button className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition">
                      Editar Configurações
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DE-PARA MAPEAMENTO DE EXAMES */}
        {activeTab === "depara" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-teal-400" /> Mapeamento DE-PARA de Exames
                </h2>
                <p className="text-xs text-slate-400">Vincule os códigos de exames do Autolac (ex.: T3) aos 1.311 exames da API do Softlab</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por código ou exame..."
                    value={searchExam}
                    onChange={(e) => setSearchExam(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 w-64"
                  />
                </div>

                <button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-teal-500/20">
                  <Plus className="w-4 h-4" /> Novo Mapeamento
                </button>
              </div>
            </div>

            {/* Exam Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Mostrando catálogo sincronizado da API do Softlab Apoio</span>
                <span className="font-mono text-teal-400">Total: 1.311 Exames Disponíveis</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">Código Softlab</th>
                      <th className="py-3.5 px-5">Descrição do Exame (Softlab)</th>
                      <th className="py-3.5 px-5">Código Autolac (Mapeado)</th>
                      <th className="py-3.5 px-5">Tipo de Resultado</th>
                      <th className="py-3.5 px-5">Status do Mapeamento</th>
                      <th className="py-3.5 px-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredExames.map((exam) => (
                      <tr key={exam.codigo} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-5 font-mono text-xs font-bold text-teal-300">{exam.codigo}</td>
                        <td className="py-4 px-5 font-medium text-slate-200">
                          {exam.descricao}
                          <span className="block text-xs text-slate-500">{exam.abreviacao}</span>
                        </td>
                        <td className="py-4 px-5">
                          {exam.autolacMapped ? (
                            <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                              {exam.autolacMapped}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Não mapeado</span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            exam.tipo === "PDF"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          }`}>
                            {exam.tipo}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {exam.autolacMapped ? (
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mapeado
                            </span>
                          ) : (
                            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition font-medium">
                            {exam.autolacMapped ? "Editar" : "Mapear Agora"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" /> Logs Transacionais de Ida e Volta
                </h2>
                <p className="text-xs text-slate-400">Rastreamento completo de payloads SOAP XML e REST JSON</p>
              </div>
            </div>

            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-teal-400">{log.id}</span>
                      <span className="text-xs text-slate-400">{log.horario}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">{log.tenant}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {log.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-teal-400 font-bold block mb-2">SOAP XML Autolac ({log.tipo.split(" ")[0]}):</span>
                      <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {`<root>\n  <codigoLab>${log.tenant}</codigoLab>\n  <solicitacao>\n    <protocolo>${log.protocolo}</protocolo>\n    <paciente>${log.paciente}</paciente>\n    <exame>${log.exames}</exame>\n  </solicitacao>\n</root>`}
                      </pre>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-cyan-400 font-bold block mb-2">REST JSON Softlab Apoio:</span>
                      <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {`{\n  "codigoLis": "${log.protocolo}",\n  "paciente": "${log.paciente}",\n  "status": "PROCESSADO_SUCESSO",\n  "exames": ["${log.exames}"]\n}`}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY SUPABASE */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" /> Supabase RLS & Segurança Multi-Tenant
              </h2>
              <p className="text-xs text-slate-400">Painel de proteção e segurança ativada do projeto MidwayLab</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">Row Level Security (RLS) Ativo</h4>
                  <p className="text-xs text-slate-300">
                    Todas as tabelas (<code className="text-teal-300">tenants</code>, <code className="text-teal-300">depara_exames</code>, <code className="text-teal-300">pedidos</code>) estão protegidas. Acesso público revogado e liberado apenas para administradores via Supabase Auth e o backend MidwayLab via service_role secret.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">URL do Projeto Supabase:</span>
                  <span className="text-teal-300 block">https://iibwbufbshqiaeorwoja.supabase.co</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">Chave de Conexão Backend:</span>
                  <span className="text-cyan-300 block font-bold">service_role secret (JWT Protegido no .env)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        MidwayLab SaaS v1.0 • Sistema Multiempresas de Integração Autolac ↔ Softlab Apoio • Hospedado na Vercel com Banco Supabase
      </footer>
    </div>
  );
}
