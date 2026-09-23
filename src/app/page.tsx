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
  Filter,
  Link,
  ArrowLeftRight,
  Lock,
  LogOut,
  UserCheck,
  UserPlus,
  Key,
  Shield,
  Mail,
  User
} from "lucide-react";

export default function MidwayLabDashboard() {
  // USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  const [usersList, setUsersList] = useState([
    {
      id: "u1",
      nome: "Carlos Cleton",
      email: "carloscleton.nat@gmail.com",
      senha: "admin",
      role: "admin" as const,
      tenantId: null,
      tenantNome: "Super Admin (Ares)",
      status: "ativo" as const,
      criadoEm: "2026-09-23"
    },
    {
      id: "u2",
      nome: "Atendimento San Mathews",
      email: "atendimento@sanmathews.com.br",
      senha: "123",
      role: "tenant" as const,
      tenantId: "1",
      tenantNome: "LAB. ARES - SOFTLAB (San Mathews)",
      status: "ativo" as const,
      criadoEm: "2026-09-23"
    },
    {
      id: "u3",
      nome: "Operações Centro Diag.",
      email: "centro@labdiag.com.br",
      senha: "123",
      role: "tenant" as const,
      tenantId: "7",
      tenantNome: "LABORATORIO CENTRO DIAGNOSTICOS",
      status: "ativo" as const,
      criadoEm: "2026-09-23"
    }
  ]);

  // Current logged in user (null = renders Login Screen)
  const [currentUser, setCurrentUser] = useState<typeof usersList[0] | null>(null);

  // Login & Registration Forms State
  const [loginTab, setLoginTab] = useState<"login" | "solicitar">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Self-Registration Form State ("Solicitar Acesso")
  const [requestFormData, setRequestFormData] = useState({
    nomeLab: "",
    nomeResponsavel: "",
    email: "",
    senha: "",
    cnpj: ""
  });
  const [pendingRequests, setPendingRequests] = useState<Array<{ id: string; nomeLab: string; nomeResponsavel: string; email: string; cnpj: string; data: string }>>([
    {
      id: "req-1",
      nomeLab: "LABORATÓRIO BIO VIDA APÓIO",
      nomeResponsavel: "Dra. Maria Fernanda",
      email: "contato@biovidaapoio.com.br",
      cnpj: "12.345.678/0001-90",
      data: "23/09/2026 09:30"
    }
  ]);

  const [activeTab, setActiveTab] = useState<"depara" | "dashboard" | "operacoes" | "tenants" | "endpoints" | "logs" | "security">("depara");
  const [selectedTenant, setSelectedTenant] = useState("LAB. ARES - SOFTLAB (San Mathews)");

  // LOGIN HANDLERS
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const user = usersList.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim() && u.senha === loginPassword);
    if (!user) {
      setLoginError("E-mail ou senha incorretos! Verifique suas credenciais.");
      return;
    }
    if (user.status !== "ativo") {
      setLoginError("Esta conta está pendente de aprovação ou bloqueada.");
      return;
    }
    
    // Set Logged In User
    setCurrentUser(user);
    if (user.role === "tenant" && user.tenantNome) {
      setSelectedTenant(user.tenantNome);
    }
    showNotification(`👋 Bem-vindo de volta, ${user.nome}!`);
  };

  const handleDemoLogin = (email: string) => {
    const user = usersList.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      if (user.role === "tenant" && user.tenantNome) {
        setSelectedTenant(user.tenantNome);
      }
      showNotification(`⚡ Login Demo Realizado: ${user.nome} (${user.role === 'admin' ? 'Super Admin' : 'Cliente'})`);
    }
  };

  const handleRequestAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = {
      id: `req-${Date.now()}`,
      nomeLab: requestFormData.nomeLab,
      nomeResponsavel: requestFormData.nomeResponsavel,
      email: requestFormData.email,
      cnpj: requestFormData.cnpj,
      data: new Date().toLocaleString("pt-BR")
    };
    setPendingRequests(prev => [...prev, newReq]);
    setRequestFormData({ nomeLab: "", nomeResponsavel: "", email: "", senha: "", cnpj: "" });
    setLoginTab("login");
    showNotification("✅ Solicitação enviada com sucesso! O Admin (carloscleton.nat@gmail.com) analisará seu acesso.");
  };

  const handleApproveRequest = (req: typeof pendingRequests[0]) => {
    const newTenant = {
      id: String(Date.now()),
      nome: req.nomeLab,
      identificacaoEntidade: req.email,
      senhaWs: "Soft@2026",
      codigoAgente: "1",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: req.email,
      softlabSenha: "•••",
      ultimoLote: "0",
      status: "ONLINE"
    };

    const newUser = {
      id: `u-${Date.now()}`,
      nome: req.nomeResponsavel,
      email: req.email,
      senha: "123",
      role: "tenant" as const,
      tenantId: newTenant.id,
      tenantNome: newTenant.nome,
      status: "ativo" as const,
      criadoEm: new Date().toISOString().slice(0, 10)
    };

    setTenants(prev => [...prev, newTenant]);
    setUsersList(prev => [...prev, newUser]);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    showNotification(`🎉 Solicitação Aprovada! Novo laboratório '${req.nomeLab}' ativado no MidwayLab.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);
    showNotification("🔒 Sessão encerrada com sucesso.");
  };


  // DUAL SEARCH BARS STATE (SOFTLAB & AUTOLAC)
  const [searchSoftlab, setSearchSoftlab] = useState("");
  const [searchAutolac, setSearchAutolac] = useState("");

  // DE-PARA Status Filter
  const [deparaFilter, setDeparaFilter] = useState<"todos" | "mapeados" | "pendentes">("todos");

  // Selection state for Dual Matcher
  const [selectedSoftlabExam, setSelectedSoftlabExam] = useState<any | null>(null);
  const [selectedAutolacExam, setSelectedAutolacExam] = useState<any | null>(null);

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

  // Autolac Exams Catalog (Right Side)
  const [autolacCatalog, setAutolacCatalog] = useState([
    { codigo: "T3", nome: "Triiodotironina T3" },
    { codigo: "TSH", nome: "Hormônio Tireoestimulante Ultra" },
    { codigo: "HEMO", nome: "Hemograma Completo com Plaquetas" },
    { codigo: "GLIC", nome: "Glicose em Jejum" },
    { codigo: "5HIAA", nome: "Ácido 5 Hidroxi Indolacético (Urina 24h)" },
    { codigo: "2HG", nome: "Glicose Curva 2 Horas" },
    { codigo: "CREAT", nome: "Creatinina Sérica" },
    { codigo: "UREIA", nome: "Ureia Sérica" },
    { codigo: "CHOLEST", nome: "Colesterol Total" },
    { codigo: "TRIG", nome: "Triglicerídeos Séricos" },
    { codigo: "PSA", nome: "PSA Antígeno Prostático Específico" },
    { codigo: "HIV", nome: "Anti-HIV 1 e 2 Sorologia" },
    { codigo: "VDRL", nome: "VDRL Sorologia para Sífilis" }
  ]);

  // Softlab Exam Catalog (Left Side - 1,311 exames)
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

  // DYNAMIC FEATURE 1: DIRECT 1-CLICK DUAL MATCHER (SOFTLAB ↔ AUTOLAC)
  const handleLinkSelectedPair = () => {
    if (!selectedSoftlabExam || !selectedAutolacExam) {
      alert("Por favor, selecione um exame no painel do Softlab e um exame no painel do Autolac!");
      return;
    }

    setSoftlabExames(prev => prev.map(item => item.codigo === selectedSoftlabExam.codigo ? {
      ...item,
      autolacMapped: selectedAutolacExam.codigo
    } : item));

    showNotification(`🔗 Vínculo criado com sucesso: ${selectedSoftlabExam.codigo} (Softlab) ↔ ${selectedAutolacExam.codigo} (Autolac)!`);
    setSelectedSoftlabExam(null);
    setSelectedAutolacExam(null);
  };

  // DYNAMIC FEATURE 2: AUTO-MAPPER BY SIMILARITY
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

  // Filtered Softlab List
  const filteredSoftlabExames = softlabExames.filter(e => {
    const matchesSearch = e.codigo.toLowerCase().includes(searchSoftlab.toLowerCase()) || 
      e.descricao.toLowerCase().includes(searchSoftlab.toLowerCase()) ||
      e.autolacMapped.toLowerCase().includes(searchSoftlab.toLowerCase());
    
    if (deparaFilter === "mapeados") return matchesSearch && Boolean(e.autolacMapped);
    if (deparaFilter === "pendentes") return matchesSearch && !Boolean(e.autolacMapped);
    return matchesSearch;
  });

  // Filtered Autolac List
  const filteredAutolacCatalog = autolacCatalog.filter(a =>
    a.codigo.toLowerCase().includes(searchAutolac.toLowerCase()) ||
    a.nome.toLowerCase().includes(searchAutolac.toLowerCase())
  );

  // IF NOT LOGGED IN: RENDER BRANDED LOGIN & REGISTRATION PORTAL
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative font-sans select-none overflow-hidden">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-teal-500 text-slate-950 font-bold px-4 py-3 rounded-xl shadow-2xl shadow-teal-500/30 border border-teal-300 flex items-center gap-3 animate-bounce">
            <Sparkles className="w-5 h-5 text-slate-950" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl relative z-10">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-teal-500/20">
              <Activity className="w-8 h-8 text-slate-950 font-extrabold" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                MidwayLab <span className="text-xs bg-teal-500/15 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">Orquestrador SaaS</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">Plataforma de Integração Autolac ↔ Softlab Apoio</p>
            </div>
          </div>

          {/* Login / Self-Registration Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setLoginTab("login")}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                loginTab === "login"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => setLoginTab("solicitar")}
              className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                loginTab === "solicitar"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Solicitar Acesso
            </button>
          </div>

          {/* FORM 1: LOGIN */}
          {loginTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-400" /> E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex.: carloscleton.nat@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500/50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" /> Senha
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-teal-500/50 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Lock className="w-4 h-4" /> Entrar no MidwayLab
              </button>

              {/* DEMO PRESETS */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block text-center">
                  ⚡ Acesso Rápido para Testes (Demo Presets)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin("carloscleton.nat@gmail.com")}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-teal-500/30 p-2.5 rounded-xl text-left transition flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
                      <div>
                        <p className="font-bold text-slate-100">Carlos Cleton (Proprietário)</p>
                        <p className="text-[10px] text-teal-400 font-mono">carloscleton.nat@gmail.com</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-md">SUPER ADMIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin("atendimento@sanmathews.com.br")}
                    className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 p-2.5 rounded-xl text-left transition flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                      <div>
                        <p className="font-bold text-slate-200">Cliente: Lab San Mathews</p>
                        <p className="text-[10px] text-slate-400 font-mono">atendimento@sanmathews.com.br</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-md">CLIENTE</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* FORM 2: SOLICITAR ACESSO */}
          {loginTab === "solicitar" && (
            <form onSubmit={handleRequestAccessSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Laboratório</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Laboratório Bio Vida"
                  value={requestFormData.nomeLab}
                  onChange={(e) => setRequestFormData({ ...requestFormData, nomeLab: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nome do Responsável Técnico</label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Dra. Maria Fernanda"
                  value={requestFormData.nomeResponsavel}
                  onChange={(e) => setRequestFormData({ ...requestFormData, nomeResponsavel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">E-mail de Contato</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@lab.com.br"
                    value={requestFormData.email}
                    onChange={(e) => setRequestFormData({ ...requestFormData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">CNPJ do Laboratório</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={requestFormData.cnpj}
                    onChange={(e) => setRequestFormData({ ...requestFormData, cnpj: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Senha Desejada</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={requestFormData.senha}
                  onChange={(e) => setRequestFormData({ ...requestFormData, senha: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" /> Enviar Solicitação de Cadastro
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // IF LOGGED IN: RENDER DASHBOARD WITH USER ROLE ACCESS CONTROL
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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("depara")}>
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
        <div className="hidden lg:flex items-center gap-6 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl text-xs">
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

        {/* User Account & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
              {currentUser.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                {currentUser.nome}
                {currentUser.email === "carloscleton.nat@gmail.com" && <Shield className="w-3 h-3 text-amber-400" />}
              </p>
              <p className="text-[10px] text-teal-400 font-mono">
                {currentUser.role === 'admin' ? '👑 SUPER ADMIN (Proprietário)' : `🏥 Cliente: ${currentUser.tenantNome}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header Tabs (Role-Filtered) */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-2 flex items-center justify-between overflow-x-auto">
        <nav className="flex items-center gap-2">
          {/* TAB 1: DE-PARA (Visible to All) */}
          <button
            type="button"
            onClick={() => setActiveTab("depara")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "depara"
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <GitCompare className="w-4 h-4 text-teal-400" /> Mapeador DE-PARA Exames
          </button>

          {/* TAB 2: OPERAÇÕES (Visible to All) */}
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

          {/* TAB 3: LOGS (Visible to All) */}
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

          {/* ADMIN ONLY TABS */}
          {currentUser.role === "admin" && (
            <>
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
                onClick={() => setActiveTab("tenants")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === "tenants"
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Building2 className="w-4 h-4 text-cyan-400" /> Laboratórios Clientes ({tenants.length})
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
                <Code2 className="w-4 h-4 text-indigo-400" /> Endpoints Softlab API ({softlabEndpointsList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === "security"
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Segurança & Usuários ({usersList.length})
              </button>
            </>
          )}
        </nav>

        {/* TENANT SELECTOR OR LOCK BADGE */}
        {currentUser.role === "admin" ? (
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
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-bold">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Laboratório: {selectedTenant}</span>
          </div>
        )}
      </div>


      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB DE-PARA: ULTRA DYNAMIC DUAL-SEARCH EXAM MATCHER */}
        {activeTab === "depara" && (
          <div className="space-y-6">
            {/* Header & Productivity Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-teal-400" /> Mapeador Dinâmico DE-PARA (Softlab Apoio ↔ Autolac)
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Pesquise lado a lado nos catálogos do Softlab (1.311 exames) e do Autolac para relacionar exames instantaneamente com 1 clique!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* PROMINENT + NOVO MAPEAMENTO BUTTON RESTORED */}
                <button
                  type="button"
                  onClick={() => handleOpenMapExam(softlabExames[0])}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Novo Mapeamento
                </button>

                {/* AUTO-MAP BUTTON */}
                <button
                  type="button"
                  onClick={handleAutoMapAll}
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" /> Auto-Mapear por Similaridade
                </button>

                {/* CSV EXPORT */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 text-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" /> Exportar CSV
                </button>
              </div>
            </div>

            {/* DUAL SEARCH BARS LADO A LADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SOFTLAB SEARCH COLUMN */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" /> Catálogo Softlab Apoio (1.311 Exames)
                  </span>
                  <span className="text-[11px] font-mono bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20">
                    {filteredSoftlabExames.length} Encontrados
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="🔍 Pesquisar código/exame no Softlab..."
                    value={searchSoftlab}
                    onChange={(e) => setSearchSoftlab(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              {/* AUTOLAC SEARCH COLUMN */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-cyan-400" /> Catálogo Exames Autolac ({autolacCatalog.length})
                  </span>
                  <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                    {filteredAutolacCatalog.length} Encontrados
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="🔍 Pesquisar código/exame no Autolac..."
                    value={searchAutolac}
                    onChange={(e) => setSearchAutolac(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            {/* DUAL MATCHING SPLIT VIEW PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT PANEL: SOFTLAB LIST */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-[500px] overflow-y-auto">
                <p className="text-[11px] text-slate-400 font-semibold mb-2">1. Selecione um exame do Softlab Apoio:</p>
                {filteredSoftlabExames.map((item) => (
                  <div
                    key={item.codigo}
                    onClick={() => setSelectedSoftlabExam(item)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      selectedSoftlabExam?.codigo === item.codigo
                        ? "bg-teal-500/20 border-teal-500 text-teal-200 font-bold shadow-lg shadow-teal-500/10"
                        : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-teal-300 block">{item.codigo}</span>
                      <span className="font-semibold text-slate-100">{item.descricao}</span>
                    </div>

                    <div className="text-right">
                      {item.autolacMapped ? (
                        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded font-bold block">
                          Mapped: {item.autolacMapped}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT PANEL: AUTOLAC LIST */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-[500px] overflow-y-auto">
                <p className="text-[11px] text-slate-400 font-semibold mb-2">2. Selecione o exame correspondente no Autolac:</p>
                {filteredAutolacCatalog.map((item) => (
                  <div
                    key={item.codigo}
                    onClick={() => setSelectedAutolacExam(item)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      selectedAutolacExam?.codigo === item.codigo
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold shadow-lg shadow-cyan-500/10"
                        : "bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-300 block">{item.codigo}</span>
                      <span className="font-semibold text-slate-100">{item.nome}</span>
                    </div>

                    <Check className={`w-4 h-4 text-cyan-400 ${selectedAutolacExam?.codigo === item.codigo ? "opacity-100" : "opacity-0"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK LINK ACTION BAR */}
            {(selectedSoftlabExam || selectedAutolacExam) && (
              <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border border-teal-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 text-xs">
                  <ArrowLeftRight className="w-5 h-5 text-teal-400" />
                  <span>
                    Vincular: <strong className="text-teal-300 font-mono">{selectedSoftlabExam ? selectedSoftlabExam.codigo : "Selecione no Softlab"}</strong>
                    {" ↔ "}
                    <strong className="text-cyan-300 font-mono">{selectedAutolacExam ? selectedAutolacExam.codigo : "Selecione no Autolac"}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLinkSelectedPair}
                  disabled={!selectedSoftlabExam || !selectedAutolacExam}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-teal-500/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Link className="w-4 h-4" /> Confirmar Vínculo DE-PARA
                </button>
              </div>
            )}

            {/* FULL RELATIONAL TABLE */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Tabela Completa de Relacionamentos DE-PARA do Laboratório: <strong className="text-teal-300 font-semibold">{selectedTenant}</strong></span>
                <span className="font-mono text-teal-400 font-bold">1.311 Exames Ativos</span>
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
                    {filteredSoftlabExames.map((exam) => (
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

        {/* TAB SECURITY & USER MANAGEMENT */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" /> Gestão de Usuários & Segurança RBAC
                </h2>
                <p className="text-xs text-slate-400">Controle de acessos, aprovação de solicitações de novos clientes e gerenciamento do sistema</p>
              </div>

              {/* OWNER CARD */}
              <div className="bg-teal-500/10 border border-teal-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                <Shield className="w-6 h-6 text-amber-400" />
                <div>
                  <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold block">Proprietário do Sistema</span>
                  <span className="text-xs font-bold text-slate-100 font-mono">carloscleton.nat@gmail.com</span>
                </div>
              </div>
            </div>

            {/* PENDING APPROVALS SECTION */}
            {pendingRequests.length > 0 && (
              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-amber-500/5">
                  <div>
                    <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                      <UserPlus className="w-4 h-4 text-amber-400" /> Solicitações de Acesso Pendentes ({pendingRequests.length})
                    </h3>
                    <p className="text-xs text-slate-400">Novos laboratórios que solicitaram cadastro via tela inicial</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-5">Laboratório</th>
                        <th className="py-3 px-5">Responsável</th>
                        <th className="py-3 px-5">CNPJ</th>
                        <th className="py-3 px-5">E-mail de Contato</th>
                        <th className="py-3 px-5">Data</th>
                        <th className="py-3 px-5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-850 transition">
                          <td className="py-3.5 px-5 font-bold text-slate-100">{req.nomeLab}</td>
                          <td className="py-3.5 px-5 text-slate-300">{req.nomeResponsavel}</td>
                          <td className="py-3.5 px-5 font-mono text-slate-400">{req.cnpj}</td>
                          <td className="py-3.5 px-5 font-mono text-cyan-300 font-bold">{req.email}</td>
                          <td className="py-3.5 px-5 text-slate-400">{req.data}</td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => handleApproveRequest(req)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg transition shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 ml-auto text-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Aprovar & Ativar Laboratório
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REGISTERED USERS TABLE */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden space-y-0">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-teal-400" /> Usuários com Acesso Cadastrados ({usersList.length})
                  </h3>
                  <p className="text-xs text-slate-400">Contas ativas com credenciais de login no MidwayLab</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5">Nome do Usuário</th>
                      <th className="py-3.5 px-5">E-mail de Login</th>
                      <th className="py-3.5 px-5">Perfil (Role)</th>
                      <th className="py-3.5 px-5">Laboratório Vinculado</th>
                      <th className="py-3.5 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-850 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-teal-400" /> {u.nome}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-cyan-300 font-bold">{u.email}</td>
                        <td className="py-3.5 px-5">
                          {u.role === "admin" ? (
                            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-400" /> SUPER ADMIN
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-cyan-400" /> CLIENTE TENANT
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-300">{u.tenantNome || "Todos os Laboratórios (Global)"}</td>
                        <td className="py-3.5 px-5">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TECHNICAL SUPABASE SECURITY INFO */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">Row Level Security (RLS) & JWT Token Active</h4>
                  <p className="text-xs text-slate-300">
                    Todas as tabelas (<code className="text-teal-300">tenants</code>, <code className="text-teal-300">depara_exames</code>, <code className="text-teal-300">pedidos</code>) possuem isolamento por <code className="text-teal-300">tenant_id</code>. O acionamento público é totalmente bloqueado.
                  </p>
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

      {/* DYNAMIC MODAL 2: MAP EXAM DE-PARA */}
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
                        onClick={() => setMapFormData(prev => ({ ...prev, codigoAutolac: a.codigo }))}
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

      {/* WORKFLOW MODALS */}
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

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        MidwayLab SaaS v1.0 • Sistema Multiempresas de Integração Autolac ↔ Softlab Apoio • Hospedado na Vercel com Banco Supabase
      </footer>
    </div>
  );
}
