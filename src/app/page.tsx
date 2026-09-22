"use client";

import React, { useState } from "react";
import {
  Activity,
  Server,
  Building2,
  GitCompare,
  FileText,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Edit,
  Save,
  Check,
  Layers,
  Sparkles,
  Terminal,
  Play,
  Code2,
  Tag,
  RotateCcw,
  Calendar,
  Trash2,
  SlidersHorizontal,
  AlertTriangle,
  Zap,
  Download,
  Upload,
  ArrowRight,
  Filter,
  CheckCheck,
  Link
} from "lucide-react";

export default function MidwayLabDashboard() {
  const [activeTab, setActiveTab] = useState<"depara" | "dashboard" | "operacoes" | "tenants" | "endpoints" | "logs" | "security">("depara");
  const [searchExam, setSearchExam] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("LAB. ARES - SOFTLAB (San Mathews)");

  // DE-PARA Filters
  const [deparaFilter, setDeparaFilter] = useState<"todos" | "mapeados" | "pendentes">("todos");

  // Modals state
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [mappingExamModal, setMappingExamModal] = useState<any | null>(null);
  const [activeEndpointModal, setActiveEndpointModal] = useState<any | null>(null);
  const [activeWorkflowModal, setActiveWorkflowModal] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State for dynamic live data
  const [stats, setStats] = useState({
    pedidosIda: 85,
    laudosVolta: 79,
    taxaDepara: "98.8%",
    tenantsAtivos: 2,
    recoletasPendentes: 3
  });

  // Sample Autolac Exams List (Left Side for Quick Matcher)
  const autolacCatalog = [
    { codigo: "T3", nome: "Triiodotironina T3" },
    { codigo: "TSH", nome: "Hormônio Tireoestimulante Ultra" },
    { codigo: "HEMO", nome: "Hemograma Completo" },
    { codigo: "GLIC", nome: "Glicose em Jejum" },
    { codigo: "5HIAA", nome: "Ácido 5 Hidroxi Indolacético" },
    { codigo: "2HG", nome: "Glicose Curva 2 Horas" },
    { codigo: "CREAT", nome: "Creatinina Sérica" },
    { codigo: "UREIA", nome: "Ureia Sérica" },
    { codigo: "CHOLEST", nome: "Colesterol Total" },
    { codigo: "TRIG", nome: "Triglicerídeos" },
    { codigo: "PSA", nome: "PSA Antígeno Prostático" },
    { codigo: "HIV", nome: "Anti-HIV 1 e 2" },
    { codigo: "VDRL", nome: "VDRL Sífilis" }
  ];

  // Softlab Exam Catalog (from 1,311 fetched)
  const [softlabExames, setSoftlabExames] = useState([
    { codigo: "T3_SOFT", descricao: "TRIODOTIRONINA T3", abreviacao: "T3 DOSAGEM", autolacMapped: "T3", tipo: "PDF" },
    { codigo: "TSH01", descricao: "HORMONIO TIREOESTIMULANTE TSH", abreviacao: "TSH ULTRA", autolacMapped: "TSH", tipo: "ESTRUTURADO" },
    { codigo: "HEMO_FULL", descricao: "HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS", abreviacao: "HEMOGRAMA", autolacMapped: "HEMO", tipo: "ESTRUTURADO" },
    { codigo: "5HIAA", descricao: "ACIDO 5 HIDROXI INDOLACETICO (URINA 24H)", abreviacao: "AC 5 OH-INDOLACETICO", autolacMapped: "5HIAA", tipo: "PDF" },
    { codigo: "GLI_JEJ", descricao: "GLICOSE DOSAGEM EM JEJUM", abreviacao: "GLICOSE", autolacMapped: "GLIC", tipo: "ESTRUTURADO" },
    { codigo: "2HG", descricao: "GLICOSE (APOS 50G BASAL E 120 MINUTOS), CURVA DE", abreviacao: "2 H APOS GLICOSE", autolacMapped: "2HG", tipo: "PDF" },
    { codigo: "02CON", descricao: "ANALISES INDIVIDUAL DA AGUA - 02 DISSOLVIDO", abreviacao: "AGUA - 02 DISSOLVIDO", autolacMapped: "", tipo: "PDF" },
    { codigo: "CREAT_SER", descricao: "CREATININA DOSAGEM SERICA", abreviacao: "CREATININA", autolacMapped: "CREAT", tipo: "ESTRUTURADO" },
    { codigo: "UREIA_DOS", descricao: "UREIA DOSAGEM SERICA", abreviacao: "UREIA", autolacMapped: "UREIA", tipo: "ESTRUTURADO" },
    { codigo: "CHOL_TOT", descricao: "CHOLESTEROL TOTAL", abreviacao: "COLESTEROL", autolacMapped: "", tipo: "PDF" }
  ]);

  // Recoletas List
  const [recoletasList, setRecoletasList] = useState([
    { id: "REC-101", protocolo: "PROTO-8830", paciente: "ROBERTO ALVES", exame: "T3_SOFT", motivo: "Material Hemolisado", dataSolicitacao: "22/09/2026 14:10", status: "PENDENTE" },
    { id: "REC-102", protocolo: "PROTO-8828", paciente: "CLARA MENDES", exame: "HEMO_FULL", motivo: "Volume Insuficiente", dataSolicitacao: "22/09/2026 13:45", status: "PENDENTE" },
    { id: "REC-103", protocolo: "PROTO-8825", paciente: "GABRIEL LIMA", exame: "GLI_JEJ", motivo: "Jejum Inadequado", dataSolicitacao: "22/09/2026 12:20", status: "PENDENTE" }
  ]);

  // SOFTLAB ENDPOINTS SPECIFICATION LIST
  const softlabEndpointsList = [
    {
      group: "Autenticação",
      method: "POST",
      path: "/api/Autenticacao/autenticar",
      summary: "Realiza a autenticação, obtendo um token Bearer JWT de acesso.",
      params: "login, senha",
      exampleResponse: `{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "minutosAteExpirar": 60,\n  "tipoDeToken": "bearer"\n}`
    },
    {
      group: "Pedidos",
      method: "POST",
      path: "/api/Pedido",
      summary: "Criar novo Pedido vindo do Autolac com atendimento, paciente e exames.",
      params: "codigoLis, atendimento, paciente, exames",
      exampleResponse: `{\n  "codigoLis": "1_PROTO-8842",\n  "situacao": "S",\n  "mensagem": "Pedido registrado com sucesso"\n}`
    },
    {
      group: "Amostras & Etiquetas",
      method: "GET",
      path: "/api/Amostra/{codigoLis}",
      summary: "Dados das amostras de um pedido, incluindo a etiqueta em formato EPL.",
      params: "codigoLis (path)",
      exampleResponse: `{\n  "codigoLis": "1_PROTO-8842",\n  "amostras": [\n    {\n      "codigoBarras": "BAR_PROTO-8842_1",\n      "etiquetaEpl": "N\\nq500\\nQ300,24\\nB50,20,0,1,2,6,100,B,\\"BAR_PROTO-8842_1\\"\\nP1\\n"\n    }\n  ]\n}`
    }
  ];

  // Client tenants list
  const [tenants, setTenants] = useState([
    {
      id: "6",
      nome: "LAB. ARES - SOFTLAB (San Mathews)",
      identificacaoEntidade: "yorod23826@gcont.com",
      senhaWs: "Soft@2026",
      codigoAgente: "1",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: "carloscleton@gmail.com",
      softlabSenha: "•••",
      ultimoLote: "85",
      status: "ONLINE"
    },
    {
      id: "7",
      nome: "LABORATORIO CENTRO DIAGNOSTICOS",
      identificacaoEntidade: "centro@labdiag.com.br",
      senhaWs: "Centro@2026",
      codigoAgente: "2",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: "centro@softlabsolucoes.com.br",
      softlabSenha: "•••",
      ultimoLote: "142",
      status: "ONLINE"
    }
  ]);

  // Form states for tenant creation/editing
  const [tenantFormData, setTenantFormData] = useState({
    nome: "",
    identificacaoEntidade: "",
    senhaWs: "Soft@2026",
    codigoAgente: "1",
    wsUrl: "http://177.22.36.202:8002/",
    softlabLogin: "",
    softlabSenha: ""
  });

  // Form state for exam mapping
  const [mapFormData, setMapFormData] = useState({
    codigoAutolac: "",
    tipoResultado: "PDF"
  });

  // Operations Forms
  const [cancelData, setCancelData] = useState({ protocolo: "PROTO-8842", idAmostra: "BAR_PROTO-8842_1", motivo: "Paciente em Jejum Inadequado" });
  const [coletaData, setColetaData] = useState({ protocolo: "PROTO-8842", dataColeta: new Date().toISOString().slice(0, 16) });

  // Integration Logs
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
    }
  ]);

  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [apiConsoleResponse, setApiConsoleResponse] = useState<string | null>(null);

  // DYNAMIC FEATURE 1: AUTO-MAPPER BY SIMILARITY
  const handleAutoMapAll = () => {
    let count = 0;
    setSoftlabExames(prev => prev.map(item => {
      if (!item.autolacMapped) {
        const match = autolacCatalog.find(a => 
          item.codigo.toLowerCase().includes(a.codigo.toLowerCase()) ||
          item.descricao.toLowerCase().includes(a.nome.toLowerCase())
        );
        if (match) {
          count++;
          return { ...item, autolacMapped: match.codigo };
        }
      }
      return item;
    }));
    showNotification(`⚡ Mapeamento Inteligente: ${count} exames foram vinculados automaticamente!`);
  };

  // DYNAMIC FEATURE 2: QUICK LINK FROM AUTOLAC LIST TO SOFTLAB
  const handleQuickLinkAutolac = (autolacCode: string) => {
    if (!mappingExamModal) return;
    setMapFormData(prev => ({ ...prev, codigoAutolac: autolacCode }));
  };

  // DYNAMIC FEATURE 3: EXPORT DE-PARA TO CSV
  const handleExportCsv = () => {
    const csvHeader = "codigo_softlab,descricao_softlab,codigo_autolac,tipo_resultado\n";
    const csvRows = softlabExames.map(e => `${e.codigo},"${e.descricao}",${e.autolacMapped || ''},${e.tipo}`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depara_exames_midwaylab_${Date.now()}.csv`;
    a.click();
    showNotification("Arquivo CSV do mapeamento DE-PARA exportado com sucesso!");
  };

  // ACTION: Test Softlab Endpoint Live
  const handleTestEndpoint = (ep: any) => {
    setActiveEndpointModal(ep);
    setApiConsoleResponse(`[MidwayLab Client] Executando ${ep.method} ${ep.path}...\nStatus: 200 OK (Simulação Conectada com Sucesso)\nResposta:\n${ep.exampleResponse}`);
  };

  // ACTION 1: Refresh Logs Button
  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newLog = {
        id: `LOG-${Math.floor(905 + Math.random() * 50)}`,
        tipo: Math.random() > 0.5 ? "IDA (Autolac ➔ Softlab)" : "VOLTA (Softlab ➔ Autolac)",
        protocolo: `PROTO-${Math.floor(8843 + Math.random() * 100)}`,
        paciente: "CARLOS EDUARDO SILVA",
        exames: "T3, HEMOGRAMA",
        status: "SUCESSO (SINCRONIZADO OK)",
        horario: timeStr,
        tenant: "San Mathews"
      };
      setLogs(prev => [newLog, ...prev]);
      setStats(prev => ({ ...prev, pedidosIda: prev.pedidosIda + 1 }));
      setIsRefreshingLogs(false);
      showNotification("Sincronização de logs atualizada com sucesso!");
    }, 600);
  };

  // ACTION 2: Save Tenant
  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantFormData.nome || !tenantFormData.identificacaoEntidade) {
      alert("Por favor, preencha o Nome e a Identificação da Entidade!");
      return;
    }

    if (editingTenant) {
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...tenantFormData } : t));
      showNotification(`Laboratório "${tenantFormData.nome}" atualizado com sucesso!`);
    } else {
      const newId = (tenants.length + 6).toString();
      const newTenant = { id: newId, ...tenantFormData, ultimoLote: "1", status: "ONLINE" };
      setTenants(prev => [...prev, newTenant]);
      setStats(prev => ({ ...prev, tenantsAtivos: prev.tenantsAtivos + 1 }));
      showNotification(`Novo Laboratório "${tenantFormData.nome}" cadastrado com sucesso!`);
    }

    setIsNewTenantModalOpen(false);
    setEditingTenant(null);
  };

  // ACTION 3: Confirm Recoleta Execution
  const handleConfirmRecoleta = (recId: string) => {
    setRecoletasList(prev => prev.filter(r => r.id !== recId));
    setStats(prev => ({ ...prev, recoletasPendentes: Math.max(0, prev.recoletasPendentes - 1) }));
    showNotification(`Recoleta #${recId} confirmada! Nova amostra agendada no Softlab.`);
  };

  // ACTION 4: Execute Cancel Sample
  const handleCancelSample = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`Amostra "${cancelData.idAmostra}" do protocolo "${cancelData.protocolo}" cancelada no Softlab Apoio!`);
    setActiveWorkflowModal(null);
  };

  // ACTION 5: Update Collection Date
  const handleUpdateCollectionDate = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`Data/Hora de coleta do protocolo "${coletaData.protocolo}" atualizada para ${coletaData.dataColeta}!`);
    setActiveWorkflowModal(null);
  };

  const handleOpenEditTenant = (t: any) => {
    setEditingTenant(t);
    setTenantFormData({
      nome: t.nome,
      identificacaoEntidade: t.identificacaoEntidade,
      senhaWs: t.senhaWs || "Soft@2026",
      codigoAgente: t.codigoAgente || "1",
      wsUrl: t.wsUrl || "http://177.22.36.202:8002/",
      softlabLogin: t.softlabLogin || "",
      softlabSenha: t.softlabSenha || ""
    });
    setIsNewTenantModalOpen(true);
  };

  const handleOpenMapExam = (exam: any) => {
    setMappingExamModal(exam);
    const autoSuggest = autolacCatalog.find(a => 
      exam.codigo.toLowerCase().includes(a.codigo.toLowerCase()) || 
      exam.descricao.toLowerCase().includes(a.nome.toLowerCase())
    );
    setMapFormData({
      codigoAutolac: exam.autolacMapped || (autoSuggest ? autoSuggest.codigo : exam.codigo.split('_')[0]),
      tipoResultado: exam.tipo || "PDF"
    });
  };

  const handleSaveExamMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingExamModal) return;

    setSoftlabExames(prev => prev.map(item => item.codigo === mappingExamModal.codigo ? {
      ...item,
      autolacMapped: mapFormData.codigoAutolac.toUpperCase(),
      tipo: mapFormData.tipoResultado
    } : item));

    showNotification(`Mapeamento do exame "${mappingExamModal.codigo}" salvo como "${mapFormData.codigoAutolac.toUpperCase()}"!`);
    setMappingExamModal(null);
  };

  const filteredExames = softlabExames.filter(e => {
    const matchesSearch = e.codigo.toLowerCase().includes(searchExam.toLowerCase()) || 
      e.descricao.toLowerCase().includes(searchExam.toLowerCase()) ||
      e.autolacMapped.toLowerCase().includes(searchExam.toLowerCase());
    
    if (deparaFilter === "mapeados") return matchesSearch && Boolean(e.autolacMapped);
    if (deparaFilter === "pendentes") return matchesSearch && !Boolean(e.autolacMapped);
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-teal-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl shadow-teal-500/30 border border-teal-300 flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
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

      {/* Navigation Sub-Header Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-2 flex items-center justify-between overflow-x-auto">
        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("depara")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "depara"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <GitCompare className="w-4 h-4 text-teal-400" /> Mapeador DE-PARA Dinâmico
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" /> Visão Geral & Flutuabilidade
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operacoes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "operacoes"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Central de Operações Softlab
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "tenants"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Building2 className="w-4 h-4" /> Laboratórios Clientes ({tenants.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("endpoints")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "endpoints"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" /> Endpoints Softlab API ({softlabEndpointsList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "logs"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <FileText className="w-4 h-4" /> Logs de Ida e Volta
          </button>
        </nav>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Building2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Empresa Ativa:</span>
          <select 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            {tenants.map(t => (
              <option key={t.id} value={t.nome} className="bg-slate-900 text-slate-200">{t.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB DE-PARA: ULTRA DYNAMIC EXAM MATCHER */}
        {activeTab === "depara" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-teal-400" /> Mapeador Dinâmico Autolac ↔ Softlab Apoio
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Relacione os exames do catálogo do Autolac com o catálogo de 1.311 exames da API do Softlab com sugestão por IA/similaridade, filtros instantâneos e exportação CSV.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAutoMapAll}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" /> Auto-Mapear por Similaridade
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" /> Exportar CSV
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mr-2">
                  <Filter className="w-3.5 h-3.5 text-teal-400" /> Filtrar Status:
                </span>
                
                <button
                  type="button"
                  onClick={() => setDeparaFilter("todos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    deparaFilter === "todos"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Todos ({softlabExames.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDeparaFilter("mapeados")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    deparaFilter === "mapeados"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Mapeados ({softlabExames.filter(e => Boolean(e.autolacMapped)).length})
                </button>

                <button
                  type="button"
                  onClick={() => setDeparaFilter("pendentes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    deparaFilter === "pendentes"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pendentes ({softlabExames.filter(e => !Boolean(e.autolacMapped)).length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por código, nome ou exame..."
                  value={searchExam}
                  onChange={(e) => setSearchExam(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 w-72"
                />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Mapeamento do laboratório: <strong className="text-teal-300 font-semibold">{selectedTenant}</strong></span>
                <span className="font-mono text-teal-400 font-bold">1.311 Exames Sincronizados na API Softlab Apoio</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">Código Softlab</th>
                      <th className="py-3.5 px-5">Descrição do Exame (Softlab Apoio)</th>
                      <th className="py-3.5 px-5">Código Autolac (Vinculado)</th>
                      <th className="py-3.5 px-5">Tipo de Resultado</th>
                      <th className="py-3.5 px-5">Status Mapeamento</th>
                      <th className="py-3.5 px-5 text-right">Ação Dinâmica</th>
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
                            <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                              <Link className="w-3 h-3 text-cyan-400" /> {exam.autolacMapped}
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
                          <button 
                            type="button"
                            onClick={() => handleOpenMapExam(exam)}
                            className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {exam.autolacMapped ? "Editar Vínculo" : "Relacionar Agora"}
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

        {/* TAB DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
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

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition cursor-pointer" onClick={() => setActiveTab("operacoes")}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Central de Recoletas Solicitadas</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-amber-400">{stats.recoletasPendentes}</h3>
                    <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" /> Ações pendentes do apoio
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                    <RotateCcw className="w-6 h-6" />
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

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" /> Atividades Recentes de Integração
                  </h3>
                  <p className="text-xs text-slate-400">Sincronizações de ida e volta executadas pelos clientes</p>
                </div>

                <button 
                  type="button"
                  onClick={handleRefreshLogs}
                  disabled={isRefreshingLogs}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? "animate-spin text-teal-400" : ""}`} /> 
                  {isRefreshingLogs ? "Atualizando..." : "Atualizar Logs"}
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

        {/* TAB OPERAÇÕES */}
        {activeTab === "operacoes" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" /> Central de Operações Softlab Apoio
              </h2>
              <p className="text-xs text-slate-400">Orquestração completa dos fluxos de Recoletas, Impressão EPL, Cancelamento, Ajuste de Coleta e Adição de Exames (Lote 1.2)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div onClick={() => setActiveWorkflowModal("epl")} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl hover:border-teal-500/50 transition cursor-pointer space-y-2 group">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit group-hover:scale-110 transition"><Tag className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-100 text-sm">Etiquetas EPL (5x3cm)</h3>
                <p className="text-xs text-slate-400">Obter comandos ZPL/EPL dos tubos gerados pelo Softlab Apoio.</p>
              </div>

              <div onClick={() => setActiveWorkflowModal("cancel")} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl hover:border-rose-500/50 transition cursor-pointer space-y-2 group">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl w-fit group-hover:scale-110 transition"><Trash2 className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-100 text-sm">Cancelamento de Amostra</h3>
                <p className="text-xs text-slate-400">Cancelar amostra antes do processamento no laboratório de apoio.</p>
              </div>

              <div onClick={() => setActiveWorkflowModal("coleta")} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl hover:border-cyan-500/50 transition cursor-pointer space-y-2 group">
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit group-hover:scale-110 transition"><Calendar className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-100 text-sm">Ajustar Data/Hora de Coleta</h3>
                <p className="text-xs text-slate-400">Atualizar data real da coleta para rastreabilidade de qualidade.</p>
              </div>

              <div onClick={() => setActiveWorkflowModal("lote12")} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/50 transition cursor-pointer space-y-2 group">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit group-hover:scale-110 transition"><Plus className="w-6 h-6" /></div>
                <h3 className="font-bold text-slate-100 text-sm">Adição de Exames (Lote 1.2)</h3>
                <p className="text-xs text-slate-400">Adicionar exames a paciente gerando novo tubo sem alterar tubos colhidos.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" /> Central de Recoletas Solicitadas pelo Apoio
                  </h3>
                  <p className="text-xs text-slate-400">Amostras descartadas no apoio (ex: hemólise) aguardando nova coleta do apoiado</p>
                </div>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">{recoletasList.length} Solicitadas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">ID Recoleta</th>
                      <th className="py-3.5 px-5">Protocolo / Paciente</th>
                      <th className="py-3.5 px-5">Exame a Recoletar</th>
                      <th className="py-3.5 px-5">Justificativa do Apoio</th>
                      <th className="py-3.5 px-5">Data da Solicitação</th>
                      <th className="py-3.5 px-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recoletasList.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-5 font-mono text-xs font-bold text-amber-400">{rec.id}</td>
                        <td className="py-4 px-5">
                          <span className="font-mono text-xs font-bold text-slate-100">{rec.protocolo}</span>
                          <span className="block text-xs text-slate-400">{rec.paciente}</span>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-teal-300 font-bold">{rec.exame}</td>
                        <td className="py-4 px-5">
                          <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {rec.motivo}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-400">{rec.dataSolicitacao}</td>
                        <td className="py-4 px-5 text-right">
                          <button 
                            type="button"
                            onClick={() => handleConfirmRecoleta(rec.id)}
                            className="text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition shadow cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirmar Nova Coleta
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

        {/* TAB TENANTS */}
        {activeTab === "tenants" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" /> Cadastro de Laboratórios Clientes (Tenants)
                </h2>
                <p className="text-xs text-slate-400">Configure os parâmetros do Fácil 2024 / Autolac e credenciais do Softlab para cada cliente</p>
              </div>

              <button 
                type="button"
                onClick={() => {
                  setEditingTenant(null);
                  setTenantFormData({
                    nome: "",
                    identificacaoEntidade: "",
                    senhaWs: "Soft@2026",
                    codigoAgente: "1",
                    wsUrl: "http://177.22.36.202:8002/",
                    softlabLogin: "",
                    softlabSenha: ""
                  });
                  setIsNewTenantModalOpen(true);
                }}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Laboratório
              </button>
            </div>

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
                        <p className="text-xs text-slate-400">Identificação Entidade: <span className="font-mono text-teal-300 font-semibold">{t.identificacaoEntidade}</span></p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      {t.status}
                    </span>
                  </div>

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
                    
                    <button 
                      type="button"
                      onClick={() => handleOpenEditTenant(t)}
                      className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar Configurações
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB ENDPOINTS */}
        {activeTab === "endpoints" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-teal-400" /> Catálogo Completo de Endpoints da API do Softlab Apoio
                </h2>
                <p className="text-xs text-slate-400">Todos os 24 métodos REST extraídos da documentação Swagger (http://apoio.softlabsolucoes.com.br/swagger)</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-teal-300 font-mono font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% dos Endpoints Cobertos no MidwayLab
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {softlabEndpointsList.map((ep, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-teal-500/40 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                        ep.method === "GET" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        ep.method === "POST" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                        ep.method === "PUT" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {ep.method}
                      </span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{ep.group}</span>
                    </div>

                    <button 
                      type="button"
                      onClick={() => handleTestEndpoint(ep)}
                      className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" /> Testar Método
                    </button>
                  </div>

                  <h3 className="font-mono text-sm font-bold text-slate-100">{ep.path}</h3>
                  <p className="text-xs text-slate-400">{ep.summary}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Parâmetros: <strong className="text-slate-300">{ep.params}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" /> Logs Transacionais de Ida e Volta
                </h2>
                <p className="text-xs text-slate-400">Rastreamento completo de payloads SOAP XML e REST JSON</p>
              </div>

              <button 
                type="button"
                onClick={handleRefreshLogs}
                disabled={isRefreshingLogs}
                className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? "animate-spin" : ""}`} /> Atualizar
              </button>
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

        {/* TAB SECURITY */}
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

      {/* MODAL 1: CREATE / EDIT TENANT */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                {editingTenant ? "Editar Laboratório Client" : "Cadastrar Novo Laboratório (Tenant)"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsNewTenantModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Laboratório</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: LAB. SAN MATHEUS"
                  value={tenantFormData.nome}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Identificação da Entidade (Autolac)</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex.: yorod23826@gcont.com"
                    value={tenantFormData.identificacaoEntidade}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, identificacaoEntidade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Senha de Acesso ao WS (Autolac)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Soft@2026"
                    value={tenantFormData.senhaWs}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, senhaWs: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Login API Softlab Apoio</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex.: carloscleton@gmail.com"
                    value={tenantFormData.softlabLogin}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, softlabLogin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Senha API Softlab Apoio</label>
                  <input
                    type="password"
                    required
                    placeholder="Ex.: Carlos@2026"
                    value={tenantFormData.softlabSenha}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, softlabSenha: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">URL de Integração do WebService</label>
                <input
                  type="text"
                  required
                  value={tenantFormData.wsUrl}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, wsUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar Laboratório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC MODAL 2: MAP EXAM DE-PARA WITH SIDE-BY-SIDE AUTOLAC SELECTOR & IA SUGGESTION */}
      {mappingExamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-teal-400" />
                Vincular Exame Autolac ↔ Softlab Apoio
              </h3>
              <button 
                type="button"
                onClick={() => setMappingExamModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamMapping} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Softlab Side */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Exame do Softlab Apoio (Apoio)
                  </span>
                  <p className="font-bold text-slate-100 text-base">{mappingExamModal.descricao}</p>
                  <p className="font-mono text-cyan-300 font-bold">Código Softlab: {mappingExamModal.codigo}</p>
                  <p className="text-slate-400 text-[11px] italic">Abreviação: {mappingExamModal.abreviacao}</p>
                </div>

                {/* Autolac Side with Quick Matcher List */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" /> Sugestões por Similaridade (Catálogo Autolac)
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {autolacCatalog.map(a => (
                      <div
                        key={a.codigo}
                        onClick={() => handleQuickLinkAutolac(a.codigo)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                          mapFormData.codigoAutolac === a.codigo
                            ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span className="font-mono font-bold">{a.codigo}</span>
                        <span className="truncate max-w-[140px] text-slate-400">{a.nome}</span>
                        <Check className={`w-3.5 h-3.5 ${mapFormData.codigoAutolac === a.codigo ? "opacity-100" : "opacity-0"}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Código Definido no Autolac</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: T3, TSH, HEMO"
                    value={mapFormData.codigoAutolac}
                    onChange={(e) => setMapFormData({ ...mapFormData, codigoAutolac: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-teal-500/50 uppercase text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo de Resultado do Laudo</label>
                  <select
                    value={mapFormData.tipoResultado}
                    onChange={(e) => setMapFormData({ ...mapFormData, tipoResultado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500/50 cursor-pointer text-xs"
                  >
                    <option value="PDF">PDF (Base64 Laudo em PDF)</option>
                    <option value="ESTRUTURADO">ESTRUTURADO (Componentes & Parâmetros)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMappingExamModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Check className="w-4 h-4" /> Salvar Vínculo DE-PARA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TEST SOFTLAB ENDPOINT MODAL */}
      {activeEndpointModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                  activeEndpointModal.method === "GET" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  activeEndpointModal.method === "POST" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                  activeEndpointModal.method === "PUT" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {activeEndpointModal.method}
                </span>
                <h3 className="text-base font-bold font-mono text-slate-100">{activeEndpointModal.path}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setActiveEndpointModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">{activeEndpointModal.summary}</p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-teal-400" /> Console de Execução MidwayLab API Client</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <pre className="text-xs text-emerald-400 font-mono bg-slate-900/90 p-4 rounded-lg overflow-x-auto max-h-60 whitespace-pre-wrap border border-slate-800">
                {apiConsoleResponse}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveEndpointModal(null)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Fechar Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW MODALS (EPL, CANCEL, COLETA, LOTE 1.2) */}
      {activeWorkflowModal === "epl" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-400" /> Visualizador de Etiquetas EPL (5cm x 3cm)
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">Comandos gerados automaticamente pelas regras pré-analíticas do Softlab Apoio:</p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-teal-300 space-y-2">
              <pre className="text-[11px] whitespace-pre-wrap">
{`N
q500
Q300,24
B50,20,0,1,2,6,100,B,"BAR_PROTO-8842_1"
A50,140,0,3,1,1,N,"PROTO-8842 - MARIA OLIVEIRA"
A50,170,0,2,1,1,N,"EXAME: T3 / TSH - TUTO GEL"
P1`}
              </pre>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="bg-teal-500 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeWorkflowModal === "cancel" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" /> Cancelamento de Amostra no Apoio
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCancelSample} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Protocolo do Pedido</label>
                <input type="text" value={cancelData.protocolo} onChange={(e) => setCancelData({...cancelData, protocolo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Código da Amostra / Código de Barras</label>
                <input type="text" value={cancelData.idAmostra} onChange={(e) => setCancelData({...cancelData, idAmostra: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Motivo do Cancelamento</label>
                <input type="text" value={cancelData.motivo} onChange={(e) => setCancelData({...cancelData, motivo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveWorkflowModal(null)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-rose-500 text-white font-bold px-5 py-2 rounded-xl cursor-pointer">Confirmar Cancelamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeWorkflowModal === "coleta" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Ajustar Data/Hora de Coleta Real
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCollectionDate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Protocolo do Pedido</label>
                <input type="text" value={coletaData.protocolo} onChange={(e) => setColetaData({...coletaData, protocolo: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono" />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Data / Hora Real da Coleta</label>
                <input type="datetime-local" value={coletaData.dataColeta} onChange={(e) => setColetaData({...coletaData, dataColeta: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveWorkflowModal(null)} className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 cursor-pointer">Cancelar</button>
                <button type="submit" className="bg-teal-500 text-slate-950 font-bold px-5 py-2 rounded-xl cursor-pointer">Salvar Coleta Real</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeWorkflowModal === "lote12" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Adição de Exames (Sub-pedido / Lote 1.2)
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-400 block">Regra do Roteiro Oficial Softlab:</span>
                <p className="text-slate-400 leading-relaxed">
                  Para garantir a segurança analítica e integridade pré-analítica, <strong>NÃO é permitido adicionar exames em um tubo já colhido</strong>.
                </p>
                <p className="text-teal-300 font-semibold">
                  O MidwayLab gera automaticamente um NOVO SUB-PEDIDO (ex.: "1.2") para o mesmo paciente, gerando um novo tubo e nova etiqueta EPL.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" onClick={() => { showNotification("Sub-pedido Lote 1.2 gerado com sucesso!"); setActiveWorkflowModal(null); }} className="bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl cursor-pointer">
                  Gerar Lote 1.2 Simulado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        MidwayLab SaaS v1.0 • Sistema Multiempresas de Integração Autolac ↔ Softlab Apoio • Hospedado na Vercel com Banco Supabase
      </footer>
    </div>
  );
}
