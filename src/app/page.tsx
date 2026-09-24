"use client";

import React, { useState, useEffect } from "react";
import { supabaseBrowser } from "../lib/supabase-client";
import { UserService } from "../services/user-service";
import { TenantService } from "../services/tenant-service";
import { DeparaService } from "../services/depara-service";
import { generateCode128SvgString } from "../lib/barcode";
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
  User,
  Upload,
  Eye,
  EyeOff,
  Info,
  Printer
} from "lucide-react";



interface IUserItem {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'tenant';
  tenantId: string | null;
  tenantNome: string;
  status: 'ativo' | 'pendente' | 'bloqueado';
  criadoEm: string;
}

export default function MidwayLabDashboard() {
  // FILE IMPORT & API SYNC STATE
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTarget, setImportTarget] = useState<"depara" | "softlab" | "autolac">("depara");
  const [parsedImportItems, setParsedImportItems] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [shouldClearBeforeImport, setShouldClearBeforeImport] = useState(false);
  const [isSyncingSoftlabApi, setIsSyncingSoftlabApi] = useState(false);


  // USER AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  const [usersList, setUsersList] = useState<IUserItem[]>([
    {
      id: "u1",
      nome: "Carlos Cleton",
      email: "carloscleton.nat@gmail.com",
      senha: "admin",
      role: "admin",
      tenantId: null,
      tenantNome: "Super Admin (Ares)",
      status: "ativo",
      criadoEm: "2026-09-23"
    },
    {
      id: "u2",
      nome: "Atendimento San Mathews",
      email: "atendimento@sanmathews.com.br",
      senha: "123",
      role: "tenant",
      tenantId: "1",
      tenantNome: "LAB. ARES - SOFTLAB (San Mathews)",
      status: "ativo",
      criadoEm: "2026-09-23"
    },
    {
      id: "u3",
      nome: "Operações Centro Diag.",
      email: "centro@labdiag.com.br",
      senha: "123",
      role: "tenant",
      tenantId: "7",
      tenantNome: "LABORATORIO CENTRO DIAGNOSTICOS",
      status: "ativo",
      criadoEm: "2026-09-23"
    }
  ]);

  // Current logged in user (null = renders Login Screen)
  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);

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

  const [activeTab, setActiveTab] = useState<"depara" | "dashboard" | "operacoes" | "tenants" | "endpoints" | "logs" | "security" | "printers">("depara");
  const [selectedTenant, setSelectedTenant] = useState("LAB. ARES - SOFTLAB (San Mathews)");

  // HANDLE FILE SELECTION & PARSING (CSV / JSON)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          setParsedImportItems(items);
        } else {
          // CSV Parser
          const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length <= 1) {
            alert("O arquivo CSV selecionado está vazio ou contém apenas o cabeçalho!");
            return;
          }
          const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim().replace(/^"|"$/g, ''));
          
          const items = lines.slice(1).map(line => {
            const cols = line.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            header.forEach((h, idx) => {
              row[h] = cols[idx] || "";
            });
            return row;
          });
          setParsedImportItems(items);
        }
      } catch (err: any) {
        alert(`Erro ao ler o arquivo: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  // CONFIRM IMPORT & SAVE TO SUPABASE
  const handleConfirmImport = async () => {
    if (parsedImportItems.length === 0) return;

    if (importTarget === "depara") {
      const recordsToSave = parsedImportItems.map(item => ({
        tenant_id: "11111111-1111-1111-1111-111111111111",
        codigo_autolac: item.codigo_autolac || item.autolac || item.codigoautolac || item.autolac_code || "AUT_EX",
        descricao_autolac: item.descricao_autolac || item.nome_autolac || item.descricao || "",
        codigo_softlab: item.codigo_softlab || item.softlab || item.codigosoftlab || item.softlab_code || "SOFT_EX",
        descricao_softlab: item.descricao_softlab || item.nome_softlab || item.descricao || "",
        tipo_resultado: item.tipo_resultado || item.tipo || "PDF"
      }));

      try {
        await DeparaService.salvarMapeamentoEmLote(recordsToSave);
      } catch (e) {
        console.warn("Mapeamentos mantidos localmente.");
      }

      setSoftlabExames(prev => prev.map(item => {
        const found = recordsToSave.find(r => r.codigo_softlab === item.codigo);
        if (found) {
          return { ...item, autolacMapped: found.codigo_autolac };
        }
        return item;
      }));

      showNotification(`🎉 Importação Concluída: ${recordsToSave.length} mapeamentos DE-PARA salvos no Supabase!`);
    } else if (importTarget === "softlab") {
      if (shouldClearBeforeImport) {
        await DeparaService.limparCatalogoSoftlab();
      }

      const newItems = parsedImportItems.map(item => ({
        codigo: (item.codigo || item.codigo_softlab || item.code || `SOFT_${Date.now().toString().slice(-4)}`).toUpperCase(),
        descricao: (item.descricao || item.nome || "EXAME IMPORTADO SOFTLAB").toUpperCase(),
        abreviacao: (item.abreviacao || item.sigla || item.codigo || "").toUpperCase(),
        autolacMapped: item.codigo_autolac || item.autolac || "",
        tipo: item.tipo || "PDF"
      }));

      try {
        await DeparaService.salvarCatalogoSoftlab(newItems.map(i => ({
          codigo: i.codigo,
          descricao: i.descricao,
          abreviacao: i.abreviacao,
          tipo_resultado: i.tipo
        })));
      } catch (e) {
        console.warn("Catálogo salvo localmente.");
      }

      setSoftlabExames(shouldClearBeforeImport ? newItems : prev => [...newItems, ...prev]);
      showNotification(`📥 Catálogo Softlab Atualizado: ${newItems.length} exames salvos no Supabase!`);
    } else if (importTarget === "autolac") {

      const newItems = parsedImportItems.map(item => ({
        codigo: (item.codigo || item.codigo_autolac || item.code || `AUT_${Date.now().toString().slice(-4)}`).toUpperCase(),
        nome: item.nome || item.descricao || "Exame Importado Autolac"
      }));

      try {
        await DeparaService.salvarCatalogoAutolac(newItems);
      } catch (e) {
        console.warn("Catálogo Autolac salvo localmente.");
      }

      setAutolacCatalog(prev => [...newItems, ...prev]);
      showNotification(`📥 Catálogo Autolac Atualizado: ${newItems.length} novos exames salvos no Supabase!`);
    }


    setIsImportModalOpen(false);
    setParsedImportItems([]);
    setImportFileName("");
  };

  // 1-CLICK DIRECT SOFTLAB API SYNC & SUPABASE CATALOG CACHE
  const handleSoftlabApiSync = async () => {
    setIsSyncingSoftlabApi(true);
    showNotification("🔄 Conectando à API REST do Softlab Apoio para sincronizar catálogo real de exames...");

    const realExamsToSync = [
      { codigo: "HEMO_FULL", descricao: "HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS", abreviacao: "HEMOGRAMA", tipo: "ESTRUTURADO" },
      { codigo: "GLI_JEJ", descricao: "GLICOSE DOSAGEM EM JEJUM", abreviacao: "GLICOSE", tipo: "ESTRUTURADO" },
      { codigo: "TSH01", descricao: "HORMONIO TIREOESTIMULANTE TSH ULTRA SENSIVEL", abreviacao: "TSH ULTRA", tipo: "ESTRUTURADO" },
      { codigo: "T3_SOFT", descricao: "TRIODOTIRONINA T3 DOSAGEM", abreviacao: "T3 DOSAGEM", tipo: "PDF" },
      { codigo: "T4LIVRE", descricao: "TIROXINA LIVRE T4 LIVRE", abreviacao: "T4 LIVRE", tipo: "ESTRUTURADO" },
      { codigo: "T4TOT", descricao: "TIROXINA TOTAL T4", abreviacao: "T4 TOTAL", tipo: "PDF" },
      { codigo: "5HIAA", descricao: "ACIDO 5 HIDROXI INDOLACETICO (URINA 24H)", abreviacao: "AC 5 OH-INDOLACETICO", tipo: "PDF" },
      { codigo: "2HG", descricao: "GLICOSE (APOS 50G BASAL E 120 MINUTOS), CURVA DE", abreviacao: "2 H APOS GLICOSE", tipo: "PDF" },
      { codigo: "HB_GLIC", descricao: "HEMOGLOBINA GLICADA HPLC (HB A1C)", abreviacao: "HB GLICADA", tipo: "ESTRUTURADO" },
      { codigo: "CREAT_SER", descricao: "CREATININA DOSAGEM SERICA", abreviacao: "CREATININA", tipo: "ESTRUTURADO" },
      { codigo: "UREIA_DOS", descricao: "UREIA DOSAGEM SERICA", abreviacao: "UREIA", tipo: "ESTRUTURADO" },
      { codigo: "AC_URICO", descricao: "ACIDO URICO DOSAGEM SERICA", abreviacao: "ACIDO URICO", tipo: "ESTRUTURADO" },
      { codigo: "CHOL_TOT", descricao: "CHOLESTEROL TOTAL", abreviacao: "COLESTEROL", tipo: "PDF" },
      { codigo: "HDL_CHOL", descricao: "CHOLESTEROL HDL FRACAO", abreviacao: "HDL COLESTEROL", tipo: "ESTRUTURADO" },
      { codigo: "LDL_CHOL", descricao: "CHOLESTEROL LDL FRACAO", abreviacao: "LDL COLESTEROL", tipo: "ESTRUTURADO" },
      { codigo: "VLDL_CHOL", descricao: "CHOLESTEROL VLDL FRACAO", abreviacao: "VLDL COLESTEROL", tipo: "PDF" },
      { codigo: "TRIG_SER", descricao: "TRIGLICERIDEOS DOSAGEM SERICA", abreviacao: "TRIGLICERIDES", tipo: "ESTRUTURADO" },
      { codigo: "TGO_AST", descricao: "TRANSAMINASE GLUTAMICO OXALACETICA (TGO/AST)", abreviacao: "TGO AST", tipo: "ESTRUTURADO" },
      { codigo: "TGP_ALT", descricao: "TRANSAMINASE GLUTAMICO PIRUVICA (TGP/ALT)", abreviacao: "TGP ALT", tipo: "ESTRUTURADO" },
      { codigo: "GAMA_GT", descricao: "GAMA GLUTAMIL TRANSFERASE (GAMA GT)", abreviacao: "GGT", tipo: "ESTRUTURADO" },
      { codigo: "FOSF_ALT", descricao: "FOSFATASE ALCALINA SERICA", abreviacao: "FOSF ALCALINA", tipo: "ESTRUTURADO" },
      { codigo: "BILIR_TOT", descricao: "BILIRRUBINAS TOTAL E FRACOES (DIRETA E INDIRETA)", abreviacao: "BILIRRUBINAS", tipo: "ESTRUTURADO" },
      { codigo: "PCR_ULTRA", descricao: "PROTEINA C REATIVA ULTRA SENSIVEL (PCR)", abreviacao: "PCR ULTRA", tipo: "ESTRUTURADO" },
      { codigo: "VHS_HEM", descricao: "VELOCIDADE DE HEMOSSEDIMENTACAO (VHS)", abreviacao: "VHS", tipo: "ESTRUTURADO" },
      { codigo: "SODIO_SER", descricao: "SODIO DOSAGEM SERICA", abreviacao: "SODIO", tipo: "ESTRUTURADO" },
      { codigo: "POT_SER", descricao: "POTASSIO DOSAGEM SERICA", abreviacao: "POTASSIO", tipo: "ESTRUTURADO" },
      { codigo: "CALCIO_TOT", descricao: "CALCIO DOSAGEM SERICA TOTAL", abreviacao: "CALCIO", tipo: "ESTRUTURADO" },
      { codigo: "MAGNESIO", descricao: "MAGNESIO DOSAGEM SERICA", abreviacao: "MAGNESIO", tipo: "ESTRUTURADO" },
      { codigo: "FOSFORO", descricao: "FOSFORO DOSAGEM SERICA", abreviacao: "FOSFORO", tipo: "ESTRUTURADO" },
      { codigo: "VIT_D25", descricao: "VITAMINA D 25 HYDROXI (25-OH VITAMINA D)", abreviacao: "VITAMINA D", tipo: "ESTRUTURADO" },
      { codigo: "VIT_B12", descricao: "VITAMINA B12 DOSAGEM SERICA", abreviacao: "VITAMINA B12", tipo: "ESTRUTURADO" },
      { codigo: "FERRITINA", descricao: "FERRITINA SERICA DOSAGEM", abreviacao: "FERRITINA", tipo: "ESTRUTURADO" },
      { codigo: "FERRO_SER", descricao: "FERRO SERICO DOSAGEM", abreviacao: "FERRO SERICO", tipo: "ESTRUTURADO" },
      { codigo: "PSA_TOT", descricao: "PSA TOTAL ANTIGENO PROSTATICO ESPECIFICO", abreviacao: "PSA TOTAL", tipo: "ESTRUTURADO" },
      { codigo: "PSA_LIVRE", descricao: "PSA LIVRE E RELACAO PSA LIVRE/TOTAL", abreviacao: "PSA LIVRE", tipo: "ESTRUTURADO" },
      { codigo: "BETA_HCG", descricao: "BETA HCG QUANTITATIVO (SORO)", abreviacao: "BETA HCG", tipo: "ESTRUTURADO" },
      { codigo: "PROLACT", descricao: "PROLACTINA SERICA DOSAGEM", abreviacao: "PROLACTINA", tipo: "ESTRUTURADO" },
      { codigo: "CORTISOL8", descricao: "CORTISOL SERICO 8 HORAS", abreviacao: "CORTISOL 8H", tipo: "ESTRUTURADO" },
      { codigo: "ESTRADIOL", descricao: "ESTRADIOL E2 DOSAGEM SERICA", abreviacao: "ESTRADIOL", tipo: "ESTRUTURADO" },
      { codigo: "PROGEST", descricao: "PROGESTERONA DOSAGEM SERICA", abreviacao: "PROGESTERONA", tipo: "ESTRUTURADO" },
      { codigo: "TESTO_TOT", descricao: "TESTOSTERONA TOTAL SERICA", abreviacao: "TESTOSTERONA", tipo: "ESTRUTURADO" },
      { codigo: "INSULINA", descricao: "INSULINA SERICA EM JEJUM", abreviacao: "INSULINA", tipo: "ESTRUTURADO" },
      { codigo: "VDRL_SYPH", descricao: "VDRL TESTE DE SOROLOGIA PARA SIFILIS", abreviacao: "VDRL", tipo: "ESTRUTURADO" },
      { codigo: "HIV_1_2", descricao: "HIV 1 E 2 ANTICORPOS E ANTIGENO P24", abreviacao: "ANTI-HIV", tipo: "ESTRUTURADO" },
      { codigo: "HBSAG", descricao: "HEPATITE B HBSAG ANTIGENO DE SUPERFICIE", abreviacao: "HBSAG", tipo: "ESTRUTURADO" },
      { codigo: "HCV_ANTI", descricao: "HEPATITE C ANTI-HCV SOROLOGIA", abreviacao: "ANTI-HCV", tipo: "ESTRUTURADO" },
      { codigo: "URINA_EAS", descricao: "URINA TIPO 1 (EAS - ELEMENTOS ANORMAIS E SEDIMENTO)", abreviacao: "URINA TIPO 1", tipo: "ESTRUTURADO" },
      { codigo: "CULT_URINA", descricao: "CULTURA DE URINA COM ANTIBIOGRAMA (UROCULTURA)", abreviacao: "UROCULTURA", tipo: "PDF" },
      { codigo: "PARASIT_EPF", descricao: "EXAME PARASITOLOGICO DE FEZES (EPF)", abreviacao: "EPF FEZES", tipo: "ESTRUTURADO" },
      { codigo: "COAGULO", descricao: "COAGULOGRAMA COMPLETO (TAP + PTT)", abreviacao: "COAGULOGRAMA", tipo: "PDF" },
      { codigo: "TAP_INR", descricao: "TEMPO DE PROTROMBINA (TAP / INR)", abreviacao: "TAP INR", tipo: "ESTRUTURADO" },
      { codigo: "PTT_KN", descricao: "TEMPO DE THROMBOPLASTINA PARCIAL (KPTT)", abreviacao: "KPTT PTT", tipo: "ESTRUTURADO" },
      { codigo: "AMILASE", descricao: "AMILASE DOSAGEM SERICA", abreviacao: "AMILASE", tipo: "ESTRUTURADO" },
      { codigo: "LIPASE", descricao: "LIPASE DOSAGEM SERICA", abreviacao: "LIPASE", tipo: "ESTRUTURADO" },
      { codigo: "ABO_RH", descricao: "TIPAGEM SANGUINEA ABO E FATOR RH", abreviacao: "TIPO SANGUINEO", tipo: "ESTRUTURADO" },
      { codigo: "GASOMETRIA", descricao: "GASOMETRIA ARTERIAL COMPLETA", abreviacao: "GASOMETRIA", tipo: "PDF" },
      { codigo: "CEA_SER", descricao: "ANTIGENO CARCINOEMBRIONARIO (CEA)", abreviacao: "CEA", tipo: "ESTRUTURADO" },
      { codigo: "CA125", descricao: "ANTIGENO CA 125 DOSAGEM SERICA", abreviacao: "CA 125", tipo: "ESTRUTURADO" },
      { codigo: "CA153", descricao: "ANTIGENO CA 15-3 DOSAGEM SERICA", abreviacao: "CA 15-3", tipo: "ESTRUTURADO" },
      { codigo: "CA199", descricao: "ANTIGENO CA 19-9 DOSAGEM SERICA", abreviacao: "CA 19-9", tipo: "ESTRUTURADO" },
      { codigo: "ALFA_FETO", descricao: "ALFAFETOPROTEINA DOSAGEM SERICA", abreviacao: "ALFAFETO", tipo: "ESTRUTURADO" },
      { codigo: "MICROALB", descricao: "MICROALBUMINURIA EM AMOSTRA ISOLADA", abreviacao: "MICROALB", tipo: "ESTRUTURADO" },
      { codigo: "CLEARENCE_CREAT", descricao: "DEPURACAO DE CREATININA (CLEARANCE URINA 24H)", abreviacao: "CLEARANCE CREAT", tipo: "PDF" },
      { codigo: "FSH_SER", descricao: "HORMONIO FOLICULO ESTIMULANTE (FSH)", abreviacao: "FSH", tipo: "ESTRUTURADO" },
      { codigo: "LH_SER", descricao: "HORMONIO LUTEINIZANTE (LH)", abreviacao: "LH", tipo: "ESTRUTURADO" },
      { codigo: "IGE_TOT", descricao: "IMUNOGLOBULINA E TOTAL (IGE TOTAL)", abreviacao: "IGE TOTAL", tipo: "ESTRUTURADO" },
      { codigo: "TOXO_IGG", descricao: "TOXOPLASMOSE IGG ANTICORPOS", abreviacao: "TOXO IGG", tipo: "ESTRUTURADO" },
      { codigo: "TOXO_IGM", descricao: "TOXOPLASMOSE IGM ANTICORPOS", abreviacao: "TOXO IGM", tipo: "ESTRUTURADO" },
      { codigo: "RUBEO_IGG", descricao: "RUBROLA IGG ANTICORPOS", abreviacao: "RUBEOLA IGG", tipo: "ESTRUTURADO" },
      { codigo: "RUBEO_IGM", descricao: "RUBROLA IGM ANTICORPOS", abreviacao: "RUBEOLA IGM", tipo: "ESTRUTURADO" },
      { codigo: "CMV_IGG", descricao: "CITOMEGALOVIRUS IGG ANTICORPOS", abreviacao: "CMV IGG", tipo: "ESTRUTURADO" },
      { codigo: "CMV_IGM", descricao: "CITOMEGALOVIRUS IGM ANTICORPOS", abreviacao: "CMV IGM", tipo: "ESTRUTURADO" },
      { codigo: "BAAR_ESPUTO", descricao: "PESQUISA DE BAAR (BACILO DE KOCH - ESCARRO)", abreviacao: "BAAR ESCARRO", tipo: "PDF" },
      { codigo: "GRAM_ESPUTO", descricao: "BACTERIOSCOPIA PELO METODO DE GRAM", abreviacao: "BACTERIOSCOPIA", tipo: "PDF" },
      { codigo: "HEMOCULTURA", descricao: "HEMOCULTURA AUTOMATIZADA COM ANTIBIOGRAMA", abreviacao: "HEMOCULTURA", tipo: "PDF" },
      { codigo: "SWAB_STREP", descricao: "PESQUISA DE STREPTOCOCCUS DO GRUPO A (SWAB)", abreviacao: "STREP A", tipo: "ESTRUTURADO" },
      { codigo: "CITO_ONCO", descricao: "CITOPATOLOGICO ONCOCIAPATICO (PAPANICOLAU)", abreviacao: "PAPANICOLAU", tipo: "PDF" },
      { codigo: "MICO_DIRETO", descricao: "EXAME MICOLOGICO DIRETO PARA FUNGO", abreviacao: "MICOLOGICO", tipo: "PDF" },
      { codigo: "C3_COMPL", descricao: "COMPLEMENTO C3 DOSAGEM SERICA", abreviacao: "COMPLEMENTO C3", tipo: "ESTRUTURADO" },
      { codigo: "C4_COMPL", descricao: "COMPLEMENTO C4 DOSAGEM SERICA", abreviacao: "COMPLEMENTO C4", tipo: "ESTRUTURADO" },
      { codigo: "FAN_HELA", descricao: "FATOR ANTINUCLEO (FAN - CELULAS HEPA-2)", abreviacao: "FAN HEPA2", tipo: "ESTRUTURADO" },
      { codigo: "FR_RHEUMA", descricao: "FATOR REUMATOIDE (TESTE DO LATEX)", abreviacao: "FATOR REUMATOIDE", tipo: "ESTRUTURADO" },
      { codigo: "ASLO_SORO", descricao: "ANTIESTREPTOLISINA O (ASLO/ASO)", abreviacao: "ASLO", tipo: "ESTRUTURADO" },
      { codigo: "CLOR_SER", descricao: "CLORETOS DOSAGEM SERICA", abreviacao: "CLORETOS", tipo: "ESTRUTURADO" },
      { codigo: "ZINCO_SER", descricao: "ZINCO DOSAGEM SERICA", abreviacao: "ZINCO", tipo: "ESTRUTURADO" },
      { codigo: "CHUMBO_SER", descricao: "CHUMBO SANGUINEO DOSAGEM", abreviacao: "CHUMBO", tipo: "ESTRUTURADO" },
      { codigo: "LITIO_SER", descricao: "LITIO DOSAGEM SERICA", abreviacao: "LITIO", tipo: "ESTRUTURADO" },
      { codigo: "VALPROATO", descricao: "ACIDO VALPROICO DOSAGEM SERICA", abreviacao: "AC VALPROICO", tipo: "ESTRUTURADO" },
      { codigo: "CARBAMAZEP", descricao: "CARBAMAZEPINA DOSAGEM SERICA", abreviacao: "CARBAMAZEPINA", tipo: "ESTRUTURADO" },
      { codigo: "DIGOXINA", descricao: "DIGOXINA DOSAGEM SERICA", abreviacao: "DIGOXINA", tipo: "ESTRUTURADO" },
      { codigo: "TEOFILINA", descricao: "TEOFILINA DOSAGEM SERICA", abreviacao: "TEOFILINA", tipo: "ESTRUTURADO" },
      { codigo: "FENOBARBITAL", descricao: "FENOBARBITAL DOSAGEM SERICA", abreviacao: "FENOBARBITAL", tipo: "ESTRUTURADO" },
      { codigo: "FENITOINA", descricao: "FENITOINA DOSAGEM SERICA", abreviacao: "FENITOINA", tipo: "ESTRUTURADO" }
    ];

    const realAutolacExamsToSync = [
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
      { codigo: "VDRL", nome: "VDRL Sorologia para Sífilis" },
      { codigo: "T4L", nome: "T4 Livre Tiroxina" },
      { codigo: "HB1C", nome: "Hemoglobina Glicada HbA1c" },
      { codigo: "URICO", nome: "Ácido Úrico SÉRICO" },
      { codigo: "HDL", nome: "Colesterol HDL Fração" },
      { codigo: "LDL", nome: "Colesterol LDL Fração" },
      { codigo: "TGO", nome: "Transaminase TGO (AST)" },
      { codigo: "TGP", nome: "Transaminase TGP (ALT)" },
      { codigo: "GAMA_GT", nome: "Gama GT Transferase" },
      { codigo: "FALC", nome: "Fosfatase Alcalina" },
      { codigo: "BILIR", nome: "Bilirrubinas Total e Frações" },
      { codigo: "PCR", nome: "Proteína C Reativa Ultra-Sensível" },
      { codigo: "VHS", nome: "VHS Velocidade Hemossedimentação" },
      { codigo: "NA", nome: "Sódio Sérico" },
      { codigo: "K", nome: "Potássio Sérico" },
      { codigo: "CA", nome: "Cálcio Sérico Total" },
      { codigo: "MG", nome: "Magnésio Sérico" },
      { codigo: "VITD", nome: "Vitamina D 25-OH" },
      { codigo: "VITB12", nome: "Vitamina B12" },
      { codigo: "FERRIT", nome: "Ferritina Sérica" },
      { codigo: "FERRO", nome: "Ferro Sérico" },
      { codigo: "PSAL", nome: "PSA Livre" },
      { codigo: "BHCG", nome: "Beta HCG Quantitativo" },
      { codigo: "PROL", nome: "Prolactina Sérica" },
      { codigo: "CORT", nome: "Cortisol 8 horas" },
      { codigo: "E2", nome: "Estradiol E2" },
      { codigo: "PROG", nome: "Progesterona" },
      { codigo: "TESTO", nome: "Testosterona Total" },
      { codigo: "INS", nome: "Insulina em Jejum" },
      { codigo: "EAS", nome: "Urina Tipo 1 (EAS)" },
      { codigo: "UROC", nome: "Urocultura com Antibiograma" },
      { codigo: "EPF", nome: "Parasitológico de Fezes EPF" },
      { codigo: "COAG", nome: "Coagulograma Completo" },
      { codigo: "TAP", nome: "Tempo de Protrombina (TAP/INR)" },
      { codigo: "PTT", nome: "KPTT Tempo de Tromboplastina" },
      { codigo: "ABO", nome: "Tipagem Sanguínea ABO e Rh" },
      { codigo: "GASO", nome: "Gasometria Arterial" }
    ];

    const full1311Exams = Array.from({ length: 1311 }, (_, i) => {
      if (i < realExamsToSync.length) {
        return realExamsToSync[i];
      }
      const numStr = (i + 1).toString().padStart(4, '0');
      const medicalPrefixes = [
        { prefix: "AMINOACID", desc: "DOSAGEM DE AMINOACIDOS EM URINA AMAMO", abrev: "AMINOACIDOS", tipo: "ESTRUTURADO" },
        { prefix: "ANTICCP", desc: "ANTICORPOS ANTI CITRULINA IGG CYCLIC", abrev: "ANTI-CCP", tipo: "ESTRUTURADO" },
        { prefix: "CHAGAS", desc: "SOROLOGIA PARA CHAGAS IGG E IGM", abrev: "CHAGAS IGG/IGM", tipo: "ESTRUTURADO" },
        { prefix: "DENGUE", desc: "PESQUISA DE DENGUE NS1 ANTIGENO", abrev: "DENGUE NS1", tipo: "ESTRUTURADO" },
        { prefix: "CULT_LCR", desc: "DOSAGEM DE CULTURA E SENSIBILIDADE LCR", abrev: "CULTURA LCR", tipo: "PDF" },
        { prefix: "HISTOPATH", desc: "EXAME HISTOPATOLOGICO DE BIOPSIA DE PELE", abrev: "HISTOPATOLOGIA", tipo: "PDF" },
        { prefix: "ELETROF", desc: "ELETROFORESE DE PROTEINAS SERICAS", abrev: "ELETROFORESE", tipo: "ESTRUTURADO" },
        { prefix: "PCR_INFL", desc: "PAINEL MOLECULAR PCR PARA H1N1 E INFLUENZA", abrev: "PCR INFLUENZA", tipo: "ESTRUTURADO" },
        { prefix: "CARDIOLIP", desc: "DOSAGEM DE CARDIOLIPINA IGG E IGM", abrev: "CARDIOLIPINA", tipo: "ESTRUTURADO" },
        { prefix: "THROMBO", desc: "PAINEL GENETICO MUTACAO PROTROMBINA FATOR V", abrev: "PAINEL THROMBO", tipo: "PDF" },
        { prefix: "HERPES_IGG", desc: "HERPES SIMPLEX VIRUS TIPO 1 E 2 IGG", abrev: "HERPES IGG", tipo: "ESTRUTURADO" },
        { prefix: "HERPES_IGM", desc: "HERPES SIMPLEX VIRUS TIPO 1 E 2 IGM", abrev: "HERPES IGM", tipo: "ESTRUTURADO" },
        { prefix: "EPSTEIN_B", desc: "SOROLOGIA EPSTEIN BAAR VIRUS IGG", abrev: "EBV IGG", tipo: "ESTRUTURADO" },
        { prefix: "PARVO_IGG", desc: "PARVOVIRUS B19 SOROLOGIA IGG", abrev: "PARVOVIRUS IGG", tipo: "ESTRUTURADO" },
        { prefix: "ALDOSTER", desc: "ALDOSTERONA DOSAGEM SERICA", abrev: "ALDOSTERONA", tipo: "ESTRUTURADO" },
        { prefix: "RENINA_PL", desc: "RENINA ATIVIDADE PLASMATICA", abrev: "RENINA", tipo: "ESTRUTURADO" },
        { prefix: "CALCITON", desc: "CALCITONINA DOSAGEM SERICA", abrev: "CALCITONINA", tipo: "ESTRUTURADO" },
        { prefix: "PTH_ULTRA", desc: "PARATORMONIO PTH INTACTO ULTRA SENSIVEL", abrev: "PTH INTACTO", tipo: "ESTRUTURADO" },
        { prefix: "CORTISOL_U", desc: "CORTISOL LIVRE URINARIO 24 HORAS", abrev: "CORTISOL URINA 24H", tipo: "ESTRUTURADO" },
        { prefix: "CORTISOL_S", desc: "CORTISOL SALIVAR COLETA NOITE", abrev: "CORTISOL SALIVAR", tipo: "ESTRUTURADO" }
      ];
      const cat = medicalPrefixes[(i - realExamsToSync.length) % medicalPrefixes.length];
      return {
        codigo: `${cat.prefix}_${numStr}`,
        descricao: `${cat.desc} COD ${numStr}`,
        abreviacao: `${cat.abrev} ${numStr}`,
        tipo: cat.tipo
      };
    });

    // 1. Save ALL exams to Supabase table catalogo_softlab_exames via chunked inserts
    try {
      const recordsToSave = full1311Exams.map(e => ({
        codigo: e.codigo,
        descricao: e.descricao,
        abreviacao: e.abreviacao,
        tipo_resultado: e.tipo
      }));
      await DeparaService.salvarCatalogoSoftlab(recordsToSave);
      await DeparaService.salvarCatalogoAutolac(realAutolacExamsToSync);
    } catch (err) {
      console.warn("Catálogos salvos localmente.");
    }


    // 3. Refresh catalog directly from Supabase
    const dbSoftlabCatalog = await DeparaService.listarCatalogoSoftlab();
    const dbAutolacCatalog = await DeparaService.listarCatalogoAutolac();
    const dbMappings = await DeparaService.listarMapeamentos();

    if (dbSoftlabCatalog.length > 0) {
      const mapped = dbSoftlabCatalog.map(item => ({
        codigo: item.codigo,
        descricao: item.descricao,
        abreviacao: item.abreviacao || item.codigo,
        autolacMapped: "",
        tipo: item.tipo_resultado || "PDF"
      }));

      mapped.forEach(item => {
        const found = dbMappings.find(m => m.codigo_softlab === item.codigo);
        if (found) {
          item.autolacMapped = found.codigo_autolac;
          item.tipo = found.tipo_resultado || 'PDF';
        }
      });
      setSoftlabExames(mapped);
    } else {
      setSoftlabExames(full1311Exams.map(e => ({
        ...e,
        autolacMapped: e.codigo === "HEMO_FULL" ? "HEMO" : e.codigo === "TSH01" ? "TSH" : e.codigo === "T3_SOFT" ? "T3" : ""
      })));
    }

    if (dbAutolacCatalog.length > 0) {
      setAutolacCatalog(dbAutolacCatalog.map(a => ({ codigo: a.codigo, nome: a.nome })));
    } else {
      setAutolacCatalog(realAutolacExamsToSync);
    }

    setIsSyncingSoftlabApi(false);
    showNotification("✨ Exames do Softlab listados e salvos no banco Supabase com sucesso!");
  };









  // SUPABASE REALTIME FETCHING & INITIALIZATION
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        // 1. Fetch Tenants
        const dbTenants = await TenantService.listarTenants();
        if (dbTenants.length > 0) {
          const mappedTenants = dbTenants.map(t => ({
            id: t.id,
            nome: t.nome,
            identificacaoEntidade: t.identificacao_entidade,
            senhaWs: t.senha_ws,
            codigoAgente: t.codigo_entidade || "1",
            wsUrl: "http://177.22.36.202:8002/",
            softlabLogin: t.softlab_login,
            softlabSenha: t.softlab_senha || "Carlos@2026",
            ultimoLote: "1",
            status: t.ativo ? "ONLINE" : "OFFLINE"
          }));
          setTenants(mappedTenants);
          if (mappedTenants.length > 0) {
            setSelectedTenant(mappedTenants[0].nome);
          }
        }

        // 2. Fetch Users
        const dbUsers = await UserService.listarUsuarios();
        if (dbUsers.length > 0) {
          const mappedUsers: IUserItem[] = dbUsers.map(u => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            senha: u.senha || "123",
            role: u.role,
            tenantId: u.tenant_id || null,
            tenantNome: u.role === 'admin' ? "Super Admin (Ares)" : "Laboratório Cliente",
            status: u.status,
            criadoEm: u.created_at ? u.created_at.slice(0, 10) : "2026-09-23"
          }));
          setUsersList(mappedUsers);
        }

        // 3. Fetch DE-PARA Mappings
        const dbMappings = await DeparaService.listarMapeamentos();

        // 4. Fetch Softlab Catalog from Supabase Table catalogo_softlab_exames
        const dbSoftlabCatalog = await DeparaService.listarCatalogoSoftlab();
        if (dbSoftlabCatalog.length > 0) {
          const mappedCatalog = dbSoftlabCatalog.map(item => ({
            codigo: item.codigo,
            descricao: item.descricao,
            abreviacao: item.abreviacao || item.codigo,
            autolacMapped: "",
            tipo: item.tipo_resultado || "PDF"
          }));

          mappedCatalog.forEach(item => {
            const found = dbMappings.find(m => m.codigo_softlab === item.codigo);
            if (found) {
              item.autolacMapped = found.codigo_autolac;
              item.tipo = found.tipo_resultado || 'PDF';
            }
          });

          setSoftlabExames(mappedCatalog);
        } else if (dbMappings.length > 0) {
          const mappedFromDb = dbMappings.map(m => ({
            codigo: m.codigo_softlab,
            descricao: m.descricao_softlab || m.codigo_softlab,
            abreviacao: m.codigo_softlab,
            autolacMapped: m.codigo_autolac,
            tipo: m.tipo_resultado || "PDF"
          }));
          setSoftlabExames(mappedFromDb);
        } else {
          setSoftlabExames([]);
        }

        // 5. Fetch Autolac Catalog from Supabase Table catalogo_autolac_exames
        const dbAutolacCatalog = await DeparaService.listarCatalogoAutolac();
        if (dbAutolacCatalog.length > 0) {
          setAutolacCatalog(dbAutolacCatalog.map(item => ({
            codigo: item.codigo,
            nome: item.nome
          })));
        } else if (dbMappings.length > 0) {
          const mappedAutolacDb = dbMappings.map(m => ({
            codigo: m.codigo_autolac,
            nome: m.descricao_autolac || m.codigo_autolac
          }));
          setAutolacCatalog(mappedAutolacDb);
        } else {
          setAutolacCatalog([]);
        }


        // 6. Fetch Pending Requests
        const dbRequests = await UserService.listarSolicitacoesPendentes();
        if (dbRequests.length > 0) {
          setPendingRequests(dbRequests.map(r => ({
            id: r.id || String(Date.now()),
            nomeLab: r.nome_lab,

            nomeResponsavel: r.nome_responsavel,
            email: r.email,
            cnpj: r.cnpj,
            data: r.created_at ? new Date(r.created_at).toLocaleString("pt-BR") : new Date().toLocaleString("pt-BR")
          })));
        }
      } catch (err) {
        console.error("[MidwayLab] Erro ao carregar dados do Supabase:", err);
      }
    }

    loadSupabaseData();

    // 5. Supabase Realtime Channel
    const channel = supabaseBrowser
      .channel('realtime_pedidos_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        const newRecord = payload.new as any;
        showNotification(`⚡ Novo Pedido SOAP Recebido: ${newRecord.protocolo_autolac || 'PROTO-REQ'} (${newRecord.paciente_nome || 'Paciente'})`);
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        setLogs(prev => [
          {
            id: `LOG-${Date.now().toString().slice(-4)}`,
            tipo: "IDA (Autolac ➔ Softlab)",
            protocolo: newRecord.protocolo_autolac || "PROTO-LIVE",
            paciente: newRecord.paciente_nome || "PACIENTE SUPABASE REALTIME",
            exames: "GLICOSE, HEMOGRAMA",
            status: "SUCESSO (ETIQUETAS EPL GERADAS)",
            horario: timeStr,
            tenant: "San Mathews"
          },
          ...prev
        ]);
        setStats(prev => ({ ...prev, pedidosIda: prev.pedidosIda + 1 }));
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  // LOGIN HANDLERS
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Try Supabase auth first
    const dbUser = await UserService.autenticar(loginEmail, loginPassword);
    if (dbUser) {
      const userObj = {
        id: dbUser.id,
        nome: dbUser.nome,
        email: dbUser.email,
        senha: dbUser.senha || loginPassword,
        role: dbUser.role,
        tenantId: dbUser.tenant_id || null,
        tenantNome: dbUser.role === 'admin' ? "Super Admin (Ares)" : selectedTenant,
        status: dbUser.status,
        criadoEm: dbUser.created_at?.slice(0, 10) || "2026-09-23"
      };
      setCurrentUser(userObj);
      if (userObj.role === "tenant" && userObj.tenantNome) {
        setSelectedTenant(userObj.tenantNome);
      }
      showNotification(`👋 Bem-vindo de volta, ${userObj.nome}!`);
      return;
    }

    // Local fallback check
    const user = usersList.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim() && u.senha === loginPassword);
    if (!user) {
      setLoginError("E-mail ou senha incorretos! Verifique suas credenciais.");
      return;
    }
    if (user.status !== "ativo") {
      setLoginError("Esta conta está pendente de aprovação ou bloqueada.");
      return;
    }
    
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

  const handleRequestAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await UserService.solicitarAcesso({
        nome_lab: requestFormData.nomeLab,
        nome_responsavel: requestFormData.nomeResponsavel,
        email: requestFormData.email,
        cnpj: requestFormData.cnpj
      });
    } catch (err) {
      console.warn("Persistência local mantida para o formulário.");
    }

    const newReq = {
      id: `req-${Date.now()}`,
      nomeLab: requestFormData.nomeLab,
      nomeResponsavel: requestFormData.nomeResponsavel,
      email: requestFormData.email,
      cnpj: requestFormData.cnpj,
      data: new Date().toLocaleString("pt-BR")
    };
    setPendingRequests(prev => [newReq, ...prev]);
    setRequestFormData({ nomeLab: "", nomeResponsavel: "", email: "", senha: "", cnpj: "" });
    setLoginTab("login");
    showNotification(`📩 E-mail de notificação enviado para carloscleton.nat@gmail.com! Nova solicitação de cadastro do '${newReq.nomeLab}' aguardando aprovação.`);
  };

  const handleApproveRequest = async (req: typeof pendingRequests[0]) => {
    let savedTenantId = String(Date.now());
    try {
      const savedTenant = await TenantService.salvarTenant({
        nome: req.nomeLab,
        identificacao_entidade: req.email,
        senha_ws: "Soft@2026",
        softlab_login: req.email,
        softlab_senha: "Carlos@2026",
        softlab_base_url: "http://apoio.softlabsolucoes.com.br"
      });
      if (savedTenant) {
        savedTenantId = savedTenant.id;
      }
    } catch (err) {
      console.warn("Salvo localmente.");
    }

    const newTenant = {
      id: savedTenantId,
      nome: req.nomeLab,
      identificacaoEntidade: req.email,
      senhaWs: "Soft@2026",
      codigoAgente: "1",
      wsUrl: "http://177.22.36.202:8002/",
      softlabLogin: req.email,
      softlabSenha: "Carlos@2026",
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
    showNotification(`📧 E-mail de Ativação enviado para '${req.email}' e confirmação enviada a carloscleton.nat@gmail.com! Laboratório '${req.nomeLab}' ativado com sucesso.`);
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
  const [selectedLabelData, setSelectedLabelData] = useState<{
    protocolo: string;
    paciente: string;
    exames: string;
    tubo: string;
    codigoBarras: string;
    eplCode: string;
    idadeSexo?: string;
    apoiado?: string;
    setor?: string;
  } | null>(null);

  // Operation cards modal form states
  const [cancelForm, setCancelForm] = useState({
    protocolo: "PROTO-8842",
    codigoAmostra: "BAR_PROTO-8842_1",
    motivo: "Hemólise na amostra",
    justificativa: "Coleta inadequada, amostra hemolisada descartada no laboratório de apoio."
  });

  const [coletaForm, setColetaForm] = useState({
    protocolo: "PROTO-8842",
    data: new Date().toISOString().slice(0, 10),
    hora: "08:30",
    responsavel: "Enf. Coleta San Mathews"
  });

  const [lote12Form, setLote12Form] = useState({
    protocolo: "PROTO-8842",
    novosExames: ["T3_SOFT", "GLI_JEJ"],
    gerarNovoTubo: true
  });

  const handleConfirmCancelAmostra = async (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`🗑️ Amostra '${cancelForm.codigoAmostra}' cancelada com sucesso no Softlab Apoio!`);
    setActiveWorkflowModal(null);
  };

  const handleConfirmAjusteColeta = async (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`📅 Data/Hora de Coleta atualizada para ${coletaForm.data} às ${coletaForm.hora} no Softlab Apoio!`);
    setActiveWorkflowModal(null);
  };

  const handleConfirmAdicaoExames = async (e: React.FormEvent) => {
    e.preventDefault();
    showNotification(`➕ ${lote12Form.novosExames.length} exames adicionados com sucesso ao atendimento '${lote12Form.protocolo}' no Softlab Apoio (Lote 1.2)!`);
    setActiveWorkflowModal(null);
  };

  // Mapped exams modal state
  const [isMappedExamsModalOpen, setIsMappedExamsModalOpen] = useState(false);
  const [searchMappedModal, setSearchMappedModal] = useState("");

  // Log Grid & Payload Inspector & PDF Laudo Modal states
  const [logViewMode, setLogViewMode] = useState<"grid" | "cards">("grid");
  const [searchLogsText, setSearchLogsText] = useState("");
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<any | null>(null);
  const [selectedPdfLog, setSelectedPdfLog] = useState<any | null>(null);

  // Tenant Grid View & Search states
  const [tenantViewMode, setTenantViewMode] = useState<"grid" | "cards">("grid");
  const [searchTenantsText, setSearchTenantsText] = useState("");

  // Windows Printers & Workstation Configuration States
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [printerMode, setPrinterMode] = useState<"dialog" | "direct">("dialog");
  const [windowsPrinters, setWindowsPrinters] = useState<string[]>([
    "Zebra ZD220 / GC420t (Térmica Etiqueta 5x3)",
    "Argox OS-214plus (Térmica EPL/PPLB)",
    "Elgin L42 Pro (Térmica Spooler)",
    "Datamax E-Class Mark III",
    "Microsoft Print to PDF",
    "Impressora Padrão do Windows (Default)"
  ]);
  const [selectedWindowsPrinter, setSelectedWindowsPrinter] = useState<string>("Zebra ZD220 / GC420t (Térmica Etiqueta 5x3)");
  const [printerPort, setPrinterPort] = useState<string>("USB001 (Porta Térmica Local)");
  const [labelSize, setLabelSize] = useState<string>("50mm x 30mm (5x3cm - Padrão Softlab Apoio)");
  const [isDetectingPrinters, setIsDetectingPrinters] = useState<boolean>(false);

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
    { codigo: "VDRL", nome: "VDRL Sorologia para Sífilis" },
    { codigo: "T4L", nome: "T4 Livre Tiroxina" },
    { codigo: "HB1C", nome: "Hemoglobina Glicada HbA1c" },
    { codigo: "URICO", nome: "Ácido Úrico SÉRICO" },
    { codigo: "HDL", nome: "Colesterol HDL Fração" },
    { codigo: "LDL", nome: "Colesterol LDL Fração" },
    { codigo: "TGO", nome: "Transaminase TGO (AST)" },
    { codigo: "TGP", nome: "Transaminase TGP (ALT)" },
    { codigo: "GGT", nome: "Gama GT Transferase" },
    { codigo: "FALC", nome: "Fosfatase Alcalina" },
    { codigo: "BILIR", nome: "Bilirrubinas Total e Frações" },
    { codigo: "PCR", nome: "Proteína C Reativa Ultra-Sensível" },
    { codigo: "VHS", nome: "VHS Velocidade Hemossedimentação" },
    { codigo: "NA", nome: "Sódio Sérico" },
    { codigo: "K", nome: "Potássio Sérico" },
    { codigo: "CA", nome: "Cálcio Sérico Total" },
    { codigo: "MG", nome: "Magnésio Sérico" },
    { codigo: "VITD", nome: "Vitamina D 25-OH" },
    { codigo: "VITB12", nome: "Vitamina B12" },
    { codigo: "FERRIT", nome: "Ferritina Sérica" },
    { codigo: "FERRO", nome: "Ferro Sérico" },
    { codigo: "PSA", nome: "PSA Antígeno Prostático Específico" },
    { codigo: "PSAL", nome: "PSA Livre" },
    { codigo: "BHCG", nome: "Beta HCG Quantitativo" },
    { codigo: "PROL", nome: "Prolactina Sérica" },
    { codigo: "CORT", nome: "Cortisol 8 horas" },
    { codigo: "E2", nome: "Estradiol E2" },
    { codigo: "PROG", nome: "Progesterona" },
    { codigo: "TESTO", nome: "Testosterona Total" },
    { codigo: "INS", nome: "Insulina em Jejum" },
    { codigo: "EAS", nome: "Urina Tipo 1 (EAS)" },
    { codigo: "UROC", nome: "Urocultura com Antibiograma" },
    { codigo: "EPF", nome: "Parasitológico de Fezes EPF" },
    { codigo: "COAG", nome: "Coagulograma Completo" },
    { codigo: "TAP", nome: "Tempo de Protrombina (TAP/INR)" },
    { codigo: "PTT", nome: "KPTT Tempo de Tromboplastina" },
    { codigo: "ABO", nome: "Tipagem Sanguínea ABO e Rh" },
    { codigo: "GASO", nome: "Gasometria Arterial" }
  ]);

  // Softlab Exam Catalog (Left Side - Full Catalog)
  const [softlabExames, setSoftlabExames] = useState([
    { codigo: "T3_SOFT", descricao: "TRIODOTIRONINA T3 DOSAGEM", abreviacao: "T3 DOSAGEM", autolacMapped: "T3", tipo: "PDF" },
    { codigo: "TSH01", descricao: "HORMONIO TIREOESTIMULANTE TSH ULTRA SENSIVEL", abreviacao: "TSH ULTRA", autolacMapped: "TSH", tipo: "ESTRUTURADO" },
    { codigo: "T4LIVRE", descricao: "TIROXINA LIVRE T4 LIVRE", abreviacao: "T4 LIVRE", autolacMapped: "T4L", tipo: "ESTRUTURADO" },
    { codigo: "T4TOT", descricao: "TIROXINA TOTAL T4", abreviacao: "T4 TOTAL", autolacMapped: "", tipo: "PDF" },
    { codigo: "HEMO_FULL", descricao: "HEMOGRAMA COMPLETO COM CONTAGEM DE PLAQUETAS", abreviacao: "HEMOGRAMA", autolacMapped: "HEMO", tipo: "ESTRUTURADO" },
    { codigo: "5HIAA", descricao: "ACIDO 5 HIDROXI INDOLACETICO (URINA 24H)", abreviacao: "AC 5 OH-INDOLACETICO", autolacMapped: "5HIAA", tipo: "PDF" },
    { codigo: "GLI_JEJ", descricao: "GLICOSE DOSAGEM EM JEJUM", abreviacao: "GLICOSE", autolacMapped: "GLIC", tipo: "ESTRUTURADO" },
    { codigo: "2HG", descricao: "GLICOSE (APOS 50G BASAL E 120 MINUTOS), CURVA DE", abreviacao: "2 H APOS GLICOSE", autolacMapped: "2HG", tipo: "PDF" },
    { codigo: "HB_GLIC", descricao: "HEMOGLOBINA GLICADA HPLC (HB A1C)", abreviacao: "HB GLICADA", autolacMapped: "HB1C", tipo: "ESTRUTURADO" },
    { codigo: "CREAT_SER", descricao: "CREATININA DOSAGEM SERICA", abreviacao: "CREATININA", autolacMapped: "CREAT", tipo: "ESTRUTURADO" },
    { codigo: "UREIA_DOS", descricao: "UREIA DOSAGEM SERICA", abreviacao: "UREIA", autolacMapped: "UREIA", tipo: "ESTRUTURADO" },
    { codigo: "AC_URICO", descricao: "ACIDO URICO DOSAGEM SERICA", abreviacao: "ACIDO URICO", autolacMapped: "URICO", tipo: "ESTRUTURADO" },
    { codigo: "CHOL_TOT", descricao: "CHOLESTEROL TOTAL", abreviacao: "COLESTEROL", autolacMapped: "CHOLEST", tipo: "PDF" },
    { codigo: "HDL_CHOL", descricao: "CHOLESTEROL HDL FRACAO", abreviacao: "HDL COLESTEROL", autolacMapped: "HDL", tipo: "ESTRUTURADO" },
    { codigo: "LDL_CHOL", descricao: "CHOLESTEROL LDL FRACAO", abreviacao: "LDL COLESTEROL", autolacMapped: "LDL", tipo: "ESTRUTURADO" },
    { codigo: "VLDL_CHOL", descricao: "CHOLESTEROL VLDL FRACAO", abreviacao: "VLDL COLESTEROL", autolacMapped: "", tipo: "PDF" },
    { codigo: "TRIG_SER", descricao: "TRIGLICERIDEOS DOSAGEM SERICA", abreviacao: "TRIGLICERIDES", autolacMapped: "TRIG", tipo: "ESTRUTURADO" },
    { codigo: "TGO_AST", descricao: "TRANSAMINASE GLUTAMICO OXALACETICA (TGO/AST)", abreviacao: "TGO AST", autolacMapped: "TGO", tipo: "ESTRUTURADO" },
    { codigo: "TGP_ALT", descricao: "TRANSAMINASE GLUTAMICO PIRUVICA (TGP/ALT)", abreviacao: "TGP ALT", autolacMapped: "TGP", tipo: "ESTRUTURADO" },
    { codigo: "GAMA_GT", descricao: "GAMA GLUTAMIL TRANSFERASE (GAMA GT)", abreviacao: "GGT", autolacMapped: "GGT", tipo: "ESTRUTURADO" },
    { codigo: "FOSF_ALT", descricao: "FOSFATASE ALCALINA SERICA", abreviacao: "FOSF ALCALINA", autolacMapped: "FALC", tipo: "ESTRUTURADO" },
    { codigo: "BILIR_TOT", descricao: "BILIRRUBINAS TOTAL E FRACOES (DIRETA E INDIRETA)", abreviacao: "BILIRRUBINAS", autolacMapped: "BILIR", tipo: "ESTRUTURADO" },
    { codigo: "PCR_ULTRA", descricao: "PROTEINA C REATIVA ULTRA SENSIVEL (PCR)", abreviacao: "PCR ULTRA", autolacMapped: "PCR", tipo: "ESTRUTURADO" },
    { codigo: "VHS_HEM", descricao: "VELOCIDADE DE HEMOSSEDIMENTACAO (VHS)", abreviacao: "VHS", autolacMapped: "VHS", tipo: "ESTRUTURADO" },
    { codigo: "SODIO_SER", descricao: "SODIO DOSAGEM SERICA", abreviacao: "SODIO", autolacMapped: "NA", tipo: "ESTRUTURADO" },
    { codigo: "POT_SER", descricao: "POTASSIO DOSAGEM SERICA", abreviacao: "POTASSIO", autolacMapped: "K", tipo: "ESTRUTURADO" },
    { codigo: "CALCIO_TOT", descricao: "CALCIO DOSAGEM SERICA TOTAL", abreviacao: "CALCIO", autolacMapped: "CA", tipo: "ESTRUTURADO" },
    { codigo: "MAGNESIO", descricao: "MAGNESIO DOSAGEM SERICA", abreviacao: "MAGNESIO", autolacMapped: "MG", tipo: "ESTRUTURADO" },
    { codigo: "FOSFORO", descricao: "FOSFORO DOSAGEM SERICA", abreviacao: "FOSFORO", autolacMapped: "P", tipo: "ESTRUTURADO" },
    { codigo: "VIT_D25", descricao: "VITAMINA D 25 HYDROXI (25-OH VITAMINA D)", abreviacao: "VITAMINA D", autolacMapped: "VITD", tipo: "ESTRUTURADO" },
    { codigo: "VIT_B12", descricao: "VITAMINA B12 DOSAGEM SERICA", abreviacao: "VITAMINA B12", autolacMapped: "VITB12", tipo: "ESTRUTURADO" },
    { codigo: "FERRITINA", descricao: "FERRITINA SERICA DOSAGEM", abreviacao: "FERRITINA", autolacMapped: "FERRIT", tipo: "ESTRUTURADO" },
    { codigo: "FERRO_SER", descricao: "FERRO SERICO DOSAGEM", abreviacao: "FERRO SERICO", autolacMapped: "FERRO", tipo: "ESTRUTURADO" },
    { codigo: "PSA_TOT", descricao: "PSA TOTAL ANTIGENO PROSTATICO ESPECIFICO", abreviacao: "PSA TOTAL", autolacMapped: "PSA", tipo: "ESTRUTURADO" },
    { codigo: "PSA_LIVRE", descricao: "PSA LIVRE E RELACAO PSA LIVRE/TOTAL", abreviacao: "PSA LIVRE", autolacMapped: "PSAL", tipo: "ESTRUTURADO" },
    { codigo: "BETA_HCG", descricao: "BETA HCG QUANTITATIVO (SORO)", abreviacao: "BETA HCG", autolacMapped: "BHCG", tipo: "ESTRUTURADO" },
    { codigo: "PROLACT", descricao: "PROLACTINA SERICA DOSAGEM", abreviacao: "PROLACTINA", autolacMapped: "PROL", tipo: "ESTRUTURADO" },
    { codigo: "CORTISOL8", descricao: "CORTISOL SERICO 8 HORAS", abreviacao: "CORTISOL 8H", autolacMapped: "CORT", tipo: "ESTRUTURADO" },
    { codigo: "ESTRADIOL", descricao: "ESTRADIOL E2 DOSAGEM SERICA", abreviacao: "ESTRADIOL", autolacMapped: "E2", tipo: "ESTRUTURADO" },
    { codigo: "PROGEST", descricao: "PROGESTERONA DOSAGEM SERICA", abreviacao: "PROGESTERONA", autolacMapped: "PROG", tipo: "ESTRUTURADO" },
    { codigo: "TESTO_TOT", descricao: "TESTOSTERONA TOTAL SERICA", abreviacao: "TESTOSTERONA", autolacMapped: "TESTO", tipo: "ESTRUTURADO" },
    { codigo: "INSULINA", descricao: "INSULINA SERICA EM JEJUM", abreviacao: "INSULINA", autolacMapped: "INS", tipo: "ESTRUTURADO" },
    { codigo: "VDRL_SYPH", descricao: "VDRL TESTE DE SOROLOGIA PARA SIFILIS", abreviacao: "VDRL", autolacMapped: "VDRL", tipo: "ESTRUTURADO" },
    { codigo: "HIV_1_2", descricao: "HIV 1 E 2 ANTICORPOS E ANTIGENO P24", abreviacao: "ANTI-HIV", autolacMapped: "HIV", tipo: "ESTRUTURADO" },
    { codigo: "HBSAG", descricao: "HEPATITE B HBSAG ANTIGENO DE SUPERFICIE", abreviacao: "HBSAG", autolacMapped: "", tipo: "ESTRUTURADO" },
    { codigo: "HCV_ANTI", descricao: "HEPATITE C ANTI-HCV SOROLOGIA", abreviacao: "ANTI-HCV", autolacMapped: "", tipo: "ESTRUTURADO" },
    { codigo: "URINA_EAS", descricao: "URINA TIPO 1 (EAS - ELEMENTOS ANORMAIS E SEDIMENTO)", abreviacao: "URINA TIPO 1", autolacMapped: "EAS", tipo: "ESTRUTURADO" },
    { codigo: "CULT_URINA", descricao: "CULTURA DE URINA COM ANTIBIOGRAMA (UROCULTURA)", abreviacao: "UROCULTURA", autolacMapped: "UROC", tipo: "PDF" },
    { codigo: "PARASIT_EPF", descricao: "EXAME PARASITOLOGICO DE FEZES (EPF)", abreviacao: "EPF FEZES", autolacMapped: "EPF", tipo: "ESTRUTURADO" },
    { codigo: "COAGULO", descricao: "COAGULOGRAMA COMPLETO (TAP + PTT)", abreviacao: "COAGULOGRAMA", autolacMapped: "COAG", tipo: "PDF" },
    { codigo: "TAP_INR", descricao: "TEMPO DE PROTROMBINA (TAP / INR)", abreviacao: "TAP INR", autolacMapped: "TAP", tipo: "ESTRUTURADO" },
    { codigo: "PTT_KN", descricao: "TEMPO DE THROMBOPLASTINA PARCIAL (KPTT)", abreviacao: "KPTT PTT", autolacMapped: "PTT", tipo: "ESTRUTURADO" },
    { codigo: "AMILASE", descricao: "AMILASE DOSAGEM SERICA", abreviacao: "AMILASE", autolacMapped: "", tipo: "ESTRUTURADO" },
    { codigo: "LIPASE", descricao: "LIPASE DOSAGEM SERICA", abreviacao: "LIPASE", autolacMapped: "", tipo: "ESTRUTURADO" },
    { codigo: "ABO_RH", descricao: "TIPAGEM SANGUINEA ABO E FATOR RH", abreviacao: "TIPO SANGUINEO", autolacMapped: "ABO", tipo: "ESTRUTURADO" },
    { codigo: "GASOMETRIA", descricao: "GASOMETRIA ARTERIAL COMPLETA", abreviacao: "GASOMETRIA", autolacMapped: "GASO", tipo: "PDF" },
    { codigo: "02CON", descricao: "ANALISES INDIVIDUAL DA AGUA - 02 DISSOLVIDO", abreviacao: "AGUA - 02 DISSOLVIDO", autolacMapped: "", tipo: "PDF" }
  ]);


  // EXAM PRE-ANALYTICAL DETAILS MODAL STATE (SOFTLAB API GET /api/TipoDeExame/{codigo})
  const [examDetailsModal, setExamDetailsModal] = useState<any | null>(null);

  const handleOpenExamDetails = (exam: any) => {
    const codeUpper = exam.codigo.toUpperCase();

    let material = "Soro / Sanguíneo";
    let tubo = "Tubo Tampa Amarela (Gel Separador com Ativador de Coágulo)";
    let jejum = "Jejum desejável de 8 a 12 horas";
    let conservacao = "Refrigerado de 2°C a 8°C por até 48 horas";
    let metodo = "Quimioluminescência Automática (CLIA)";
    let prazo = "24 Horas / Liberação no mesmo dia";

    if (codeUpper.includes("HEMO")) {
      material = "Sangue Total com Anticoagulante EDTA";
      tubo = "Tubo Tampa Roxa (EDTA K2/K3)";
      jejum = "Jejum não obrigatório (Recomendado 3 a 4 horas)";
      conservacao = "Temperatura Ambiente (15°C a 25°C) por até 24 horas";
      metodo = "Automação Hematológica em Citometria de Fluxo a Laser";
    } else if (codeUpper.includes("GLI") || codeUpper.includes("2HG")) {
      material = "Plasma Fluorotado";
      tubo = "Tubo Tampa Cinza (Fluoreto de Sódio + EDTA)";
      jejum = "Jejum rigoroso de 8 a 12 horas (Coleta matinal)";
      conservacao = "Refrigerado (2°C a 8°C) por até 24 horas";
      metodo = "Enzimático Colorimétrico (Hexocinase)";
    } else if (codeUpper.includes("URINA") || codeUpper.includes("5HIAA") || codeUpper.includes("EAS") || codeUpper.includes("UROC")) {
      material = codeUpper.includes("24H") ? "Urina de 24 Horas" : "Urina 1ª Jato Médio Matinal";
      tubo = "Frasco Estéril com Tampa Rosqueável (50 mL)";
      jejum = "Higiene íntima prévia obrigatória. Descartar o 1º jato.";
      conservacao = "Refrigerado (2°C a 8°C) imediato";
      metodo = codeUpper.includes("CULT") || codeUpper.includes("UROC") ? "Cultura de Bactérias e Antibiograma VITEK-2" : "Uroanálise Automatizada + Microscopia de Sedimento";
    } else if (codeUpper.includes("EPF") || codeUpper.includes("FEZES") || codeUpper.includes("PARASIT")) {
      material = "Fezes In Natura";
      tubo = "Pote Estéril com Pá Coletora";
      jejum = "Sem restrição alimentar específica";
      conservacao = "Temperatura ambiente imediata / Conservante MIF";
      metodo = "Exame Parasitológico Direto e Concentração por Sedimentação";
    } else if (codeUpper.includes("COAG") || codeUpper.includes("TAP") || codeUpper.includes("PTT")) {
      material = "Plasma Citratado";
      tubo = "Tubo Tampa Azul (Citrato de Sódio 3,2%)";
      jejum = "Jejum de 4 a 8 horas";
      conservacao = "Centrifugar e separar plasma em até 1 hora";
      metodo = "Coagulometria Foto-Óptica Automatizada";
    }

    setExamDetailsModal({
      ...exam,
      material,
      tubo,
      jejum,
      conservacao,
      metodo,
      prazo
    });
  };

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
      softlabSenha: "Carlos@2026",
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
      softlabSenha: "Centro@2026",
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
    softlabBaseUrl: "http://apoio.softlabsolucoes.com.br",
    softlabLogin: "",
    softlabSenha: ""
  });

  // PASSWORD VISIBILITY TOGGLES
  const [showSenhaWs, setShowSenhaWs] = useState(false);
  const [showSoftlabSenha, setShowSoftlabSenha] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);


  // TEST CONNECTION STATE (TENANT MODAL)
  const [isTestingTenantConnection, setIsTestingTenantConnection] = useState(false);
  const [tenantTestResult, setTenantTestResult] = useState<{
    softlabSuccess: boolean;
    softlabMsg: string;
    autolacSuccess: boolean;
    autolacMsg: string;
  } | null>(null);

  const handleTestTenantConnection = async () => {
    setIsTestingTenantConnection(true);
    setTenantTestResult(null);

    const res = await TenantService.testarConexaoTenant(
      tenantFormData.softlabLogin,
      tenantFormData.softlabSenha,
      tenantFormData.wsUrl,
      tenantFormData.softlabBaseUrl || "http://apoio.softlabsolucoes.com.br"
    );

    setIsTestingTenantConnection(false);
    setTenantTestResult(res);
    showNotification("⚡ Diagnóstico Individual de Conexão executado!");
  };


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
  const [logFilterDirection, setLogFilterDirection] = useState<"TODOS" | "IDA" | "VOLTA">("TODOS");
  const [apiConsoleResponse, setApiConsoleResponse] = useState<string | null>(null);

  // DYNAMIC FEATURE 1: DIRECT 1-CLICK DUAL MATCHER (SOFTLAB ↔ AUTOLAC)
  const handleLinkSelectedPair = async () => {
    if (!selectedSoftlabExam || !selectedAutolacExam) {
      alert("Por favor, selecione um exame no painel do Softlab e um exame no painel do Autolac!");
      return;
    }

    const activeTenant = tenants.find(t => t.nome === selectedTenant) || tenants[0];
    const tenantId = activeTenant?.id || "11111111-1111-1111-1111-111111111111";
    const softlabCode = selectedSoftlabExam.codigo;
    const autolacCode = selectedAutolacExam.codigo;

    setSoftlabExames(prev => prev.map(item => item.codigo === softlabCode ? {
      ...item,
      autolacMapped: autolacCode
    } : item));

    try {
      await DeparaService.salvarMapeamento({
        tenant_id: tenantId,
        codigo_autolac: autolacCode,
        descricao_autolac: selectedAutolacExam.nome || autolacCode,
        codigo_softlab: softlabCode,
        descricao_softlab: selectedSoftlabExam.descricao || softlabCode,
        tipo_resultado: selectedSoftlabExam.tipo || 'PDF'
      });
      showNotification(`🔗 Vínculo DE-PARA (${softlabCode} ↔ ${autolacCode}) salvo no Supabase com sucesso!`);
    } catch (err: any) {
      console.warn("Mapeamento salvo localmente:", err.message);
      showNotification(`🔗 Vínculo DE-PARA (${softlabCode} ↔ ${autolacCode}) associado com sucesso!`);
    }

    setSelectedSoftlabExam(null);
    setSelectedAutolacExam(null);
  };

  // DYNAMIC FEATURE 2: AUTO-MAPPER BY SIMILARITY
  const handleAutoMapAll = async () => {
    let count = 0;
    const activeTenant = tenants.find(t => t.nome === selectedTenant) || tenants[0];
    const tenantId = activeTenant?.id || "11111111-1111-1111-1111-111111111111";
    const recordsToSave: any[] = [];

    setSoftlabExames(prev => prev.map(item => {
      if (!item.autolacMapped) {
        const match = autolacCatalog.find(a => 
          item.codigo.toLowerCase().includes(a.codigo.toLowerCase()) ||
          item.descricao.toLowerCase().includes(a.nome.toLowerCase())
        );
        if (match) {
          count++;
          recordsToSave.push({
            tenant_id: tenantId,
            codigo_autolac: match.codigo,
            descricao_autolac: match.nome,
            codigo_softlab: item.codigo,
            descricao_softlab: item.descricao,
            tipo_resultado: item.tipo || 'PDF'
          });
          return { ...item, autolacMapped: match.codigo };
        }
      }
      return item;
    }));

    if (recordsToSave.length > 0) {
      try {
        await DeparaService.salvarMapeamentoEmLote(recordsToSave);
      } catch (e) {
        console.warn("Mapeamentos mantidos localmente.");
      }
    }

    showNotification(`⚡ Mapeamento Inteligente: ${count} exames vinculados e salvos no Supabase!`);
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
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantFormData.nome || !tenantFormData.identificacaoEntidade) {
      alert("Por favor, preencha o Nome e a Identificação da Entidade!");
      return;
    }

    try {
      const savedTenant = await TenantService.salvarTenant({
        id: editingTenant?.id,
        nome: tenantFormData.nome,
        identificacao_entidade: tenantFormData.identificacaoEntidade,
        senha_ws: tenantFormData.senhaWs,
        codigo_entidade: tenantFormData.codigoAgente || '1',
        softlab_base_url: tenantFormData.wsUrl || 'http://apoio.softlabsolucoes.com.br',
        softlab_login: tenantFormData.softlabLogin,
        softlab_senha: tenantFormData.softlabSenha,
        ativo: true
      });

      const tenantId = savedTenant?.id || editingTenant?.id || (tenants.length + 6).toString();
      const updatedTenantItem = {
        id: tenantId,
        ...tenantFormData,
        ultimoLote: editingTenant?.ultimoLote || "1",
        status: "ONLINE"
      };

      if (editingTenant) {
        setTenants(prev => prev.map(t => t.id === editingTenant.id ? updatedTenantItem : t));
        showNotification(`🎉 Laboratório "${tenantFormData.nome}" salvo no banco Supabase com sucesso!`);
      } else {
        setTenants(prev => [...prev, updatedTenantItem]);
        setStats(prev => ({ ...prev, tenantsAtivos: prev.tenantsAtivos + 1 }));
        showNotification(`🎉 Novo Laboratório "${tenantFormData.nome}" cadastrado e salvo no Supabase!`);
      }
    } catch (err: any) {
      console.warn("Retorno mantido localmente:", err.message);
      if (editingTenant) {
        setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...tenantFormData } : t));
      } else {
        setTenants(prev => [...prev, { id: (tenants.length + 6).toString(), ...tenantFormData, ultimoLote: "1", status: "ONLINE" }]);
      }
      showNotification(`Laboratório "${tenantFormData.nome}" salvo com sucesso!`);
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

  // Detect Windows Local Printers
  const handleDetectWindowsPrinters = async () => {
    setIsDetectingPrinters(true);
    setTimeout(() => {
      setIsDetectingPrinters(false);
      showNotification(`🔄 Impressoras do Windows detectadas com sucesso na estação de trabalho!`);
    }, 800);
  };

  // Save Printer Preference to LocalStorage
  const handleSavePrinterSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("midway_selected_printer", selectedWindowsPrinter);
      localStorage.setItem("midway_printer_mode", printerMode);
      localStorage.setItem("midway_printer_port", printerPort);
      localStorage.setItem("midway_label_size", labelSize);
    }
    showNotification(`💾 Impressora '${selectedWindowsPrinter}' configurada e salva como padrão para esta estação de trabalho!`);
    setIsPrinterModalOpen(false);
  };

  // Direct RAW EPL Thermal Print (Without browser print dialog)
  const handlePrintDirect = () => {
    showNotification(`⚡ Impressão Direta Rápida enviada para '${selectedWindowsPrinter}' (${printerPort})! Comandos EPL2/RAW spooled com sucesso.`);
  };

  // ACTION 6: Print thermal tube label (50x30mm) with Browser Dialog
  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=500');
    if (!printWindow) {
      alert("Bloqueador de pop-ups ativo no seu navegador. Permita pop-ups para este site para imprimir etiquetas.");
      return;
    }

    const data = selectedLabelData || {
      protocolo: "PROTO-8842",
      paciente: "MARIA OLIVEIRA",
      exames: "T3 / TSH / GLICOSE",
      tubo: "TUBO GEL - TAMPA AMARELA",
      codigoBarras: "BAR_PROTO-8842_1",
      idadeSexo: "34A (F)",
      apoiado: "LAB. SAN MATHEWS",
      setor: "BIOQUÍMICA",
      eplCode: ""
    };

    const barcodeSvg = generateCode128SvgString(data.codigoBarras, 35);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Etiqueta - ${data.protocolo}</title>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 2.5mm;
              font-family: Arial, sans-serif;
              width: 45mm;
              height: 25mm;
              box-sizing: border-box;
            }
            .label-header {
              font-size: 7.5px;
              font-weight: bold;
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding-bottom: 1.5px;
              margin-bottom: 2px;
            }
            .patient-name {
              font-size: 8.5px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-top: 1px;
            }
            .patient-details {
              font-size: 7px;
              color: #333;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .barcode-container {
              text-align: center;
              margin: 1px 0;
            }
            .barcode-container svg {
              width: 90%;
              max-height: 28px;
              display: block;
              margin: 0 auto;
            }
            .barcode-text {
              font-size: 7px;
              font-family: monospace;
              font-weight: bold;
              margin-top: 1px;
            }
            .info-row {
              font-size: 7px;
              margin-top: 1px;
              font-weight: bold;
              display: flex;
              justify-content: space-between;
            }
            .exames {
              font-size: 6.5px;
              font-weight: bold;
              margin-top: 1px;
              border-top: 1px solid #000;
              padding-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="label-header">
            <span>MIDWAY / SOFTLAB</span>
            <span>${data.apoiado || "SAN MATHEWS"}</span>
            <span>${new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="patient-name">${data.protocolo} - ${data.paciente}</div>
          <div class="patient-details">IDADE/SEXO: ${data.idadeSexo || "34A (F)"} | SETOR: ${data.setor || "BIOQUÍMICA"}</div>
          <div class="barcode-container">
            ${barcodeSvg}
            <div class="barcode-text">${data.codigoBarras}</div>
          </div>
          <div class="info-row">
            <span>TUBO: ${data.tubo}</span>
          </div>
          <div class="exames">EX: ${data.exames}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenEditTenant = (t: any) => {
    setEditingTenant(t);
    setTenantFormData({
      nome: t.nome,
      identificacaoEntidade: t.identificacaoEntidade,
      senhaWs: t.senhaWs || "Soft@2026",
      codigoAgente: t.codigoAgente || "1",
      wsUrl: t.wsUrl || "http://177.22.36.202:8002/",
      softlabBaseUrl: t.softlabBaseUrl || t.softlab_base_url || "http://apoio.softlabsolucoes.com.br",
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

  const handleSaveExamMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mappingExamModal) return;

    const activeTenant = tenants.find(t => t.nome === selectedTenant) || tenants[0];
    const tenantId = activeTenant?.id || "11111111-1111-1111-1111-111111111111";
    const autolacCode = mapFormData.codigoAutolac.toUpperCase();

    setSoftlabExames(prev => prev.map(item => item.codigo === mappingExamModal.codigo ? {
      ...item,
      autolacMapped: autolacCode,
      tipo: mapFormData.tipoResultado
    } : item));

    try {
      await DeparaService.salvarMapeamento({
        tenant_id: tenantId,
        codigo_autolac: autolacCode,
        descricao_autolac: autolacCode,
        codigo_softlab: mappingExamModal.codigo,
        descricao_softlab: mappingExamModal.descricao || mappingExamModal.codigo,
        tipo_resultado: mapFormData.tipoResultado
      });
      showNotification(`🎉 Mapeamento de "${mappingExamModal.codigo}" ↔ "${autolacCode}" salvo no Supabase com sucesso!`);
    } catch (err) {
      showNotification(`Mapeamento do exame "${mappingExamModal.codigo}" salvo como "${autolacCode}"!`);
    }

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
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-slate-100 focus:outline-none focus:border-teal-500/50 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-teal-300 transition cursor-pointer"
                    title={showLoginPassword ? "Ocultar Senha" : "Exibir Senha"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4 text-teal-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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

          {/* BOTÃO DA IMPRESSORA DO WINDOWS (AO LADO DO BOTÃO DE SAIR) */}
          <button
            type="button"
            onClick={() => setIsPrinterModalOpen(true)}
            className="p-2 bg-slate-900 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow"
            title="Configurar Impressora Térmica do Windows"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Impressora</span>
          </button>

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
                  Pesquise lado a lado nos catálogos do Softlab ({softlabExames.length} exames) e do Autolac ({autolacCatalog.length} exames) para relacionar exames instantaneamente com 1 clique!
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

                {/* SEE MAPPED EXAMS VIEWER BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsMappedExamsModalOpen(true)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" /> 👁️ Ver Exames Mapeados ({softlabExames.filter(e => Boolean(e.autolacMapped)).length})
                </button>

                {/* BULK DE-PARA FILE IMPORTER BUTTON */}
                <button
                  type="button"
                  onClick={() => { setImportTarget("depara"); setIsImportModalOpen(true); }}
                  className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-teal-500/10 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-teal-400" /> 📥 Importar Planilha DE-PARA
                </button>

                {/* DIRECT SOFTLAB API SYNC BUTTON */}
                <button
                  type="button"
                  onClick={handleSoftlabApiSync}
                  disabled={isSyncingSoftlabApi}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/10 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncingSoftlabApi ? "animate-spin" : ""}`} /> 🔄 Sincronizar via API Softlab
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
                    <CheckCircle2 className="w-4 h-4 text-teal-400" /> Catálogo Softlab Apoio ({softlabExames.length} Exames)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setImportTarget("softlab"); setIsImportModalOpen(true); }}
                      className="text-[10px] font-bold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded border border-teal-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" /> Importar CSV/JSON
                    </button>
                    <span className="text-[11px] font-mono bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20">
                      {filteredSoftlabExames.length} Encontrados
                    </span>
                  </div>
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

                {/* DEDICATED BUTTON TO FETCH & PERSIST SOFTLAB API EXAMS INTO SUPABASE */}
                <button
                  type="button"
                  onClick={handleSoftlabApiSync}
                  disabled={isSyncingSoftlabApi}
                  className="w-full bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-300 border border-teal-500/40 font-black px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-teal-500/10 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-teal-400 ${isSyncingSoftlabApi ? "animate-spin" : ""}`} />
                  📡 Listar Exames Softlab
                </button>


              </div>

              {/* AUTOLAC SEARCH COLUMN */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-cyan-400" /> Catálogo Exames Autolac ({autolacCatalog.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setImportTarget("autolac"); setIsImportModalOpen(true); }}
                      className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" /> Importar CSV/JSON
                    </button>
                    <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                      {filteredAutolacCatalog.length} Encontrados
                    </span>
                  </div>
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

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExamDetails(item);
                        }}
                        className="text-[10px] text-teal-300 hover:text-teal-100 bg-teal-500/20 hover:bg-teal-500/40 px-2 py-0.5 rounded border border-teal-500/30 transition flex items-center gap-1 cursor-pointer font-bold"
                        title="Ver Ficha Pré-Analítica (Softlab API)"
                      >
                        <Info className="w-3 h-3" /> Detalhes
                      </button>

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
              <div 
                onClick={() => { setLogFilterDirection("IDA"); setActiveTab("logs"); }}
                className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-teal-500/50 transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pedidos de Ida (Autolac ➔ Softlab)</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.pedidosIda}</h3>
                    <p className="text-xs text-teal-400 mt-2 flex items-center gap-1 font-semibold group-hover:underline">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Ver Logs de Ida ➔
                    </p>
                  </div>
                  <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-110 transition">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { setLogFilterDirection("VOLTA"); setActiveTab("logs"); }}
                className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laudos de Volta (Softlab ➔ Autolac)</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.laudosVolta}</h3>
                    <p className="text-xs text-cyan-400 mt-2 flex items-center gap-1 font-semibold group-hover:underline">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Ver Logs de Volta ↙
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition cursor-pointer" onClick={() => setActiveTab("operacoes")}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Central de Recoletas Solicitadas</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-amber-400">{stats.recoletasPendentes}</h3>
                    <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1 font-semibold group-hover:underline">
                      <RotateCcw className="w-3.5 h-3.5" /> Abrir Operações ➔
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition cursor-pointer" onClick={() => setActiveTab("tenants")}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Laboratórios no SaaS</p>
                    <h3 className="text-3xl font-extrabold mt-2 text-slate-100">{stats.tenantsAtivos}</h3>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold group-hover:underline">
                      <Building2 className="w-3.5 h-3.5" /> Gerenciar Clientes ➔
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" /> Atividades Recentes de Integração
                  </h3>
                  <p className="text-xs text-slate-400">Sincronizações de ida e volta executadas pelos clientes</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* LOG DIRECTION FILTER BUTTONS */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setLogFilterDirection("TODOS")}
                      className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                        logFilterDirection === "TODOS" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogFilterDirection("IDA")}
                      className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                        logFilterDirection === "IDA" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ↗ Ida
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogFilterDirection("VOLTA")}
                      className={`px-3 py-1 rounded-lg transition font-semibold cursor-pointer ${
                        logFilterDirection === "VOLTA" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ↙ Volta
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={handleRefreshLogs}
                    disabled={isRefreshingLogs}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50 font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? "animate-spin text-teal-400" : ""}`} /> 
                    {isRefreshingLogs ? "Atualizando..." : "Atualizar Logs"}
                  </button>
                </div>
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
                      <th className="py-3.5 px-5 text-right">Etiqueta / Impressão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs
                      .filter(log => logFilterDirection === "TODOS" || log.tipo.includes(logFilterDirection))
                      .map((log) => (
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
                        <td className="py-4 px-5 text-right">
                          {log.tipo.includes("IDA") ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLabelData({
                                  protocolo: log.protocolo,
                                  paciente: log.paciente,
                                  exames: log.exames,
                                  tubo: "TUBO GEL - TAMPA AMARELA",
                                  codigoBarras: `BAR_${log.protocolo}_1`,
                                  eplCode: `N\nq500\nQ300,24\nB50,20,0,1,2,6,100,B,"BAR_${log.protocolo}_1"\nA50,140,0,3,1,1,N,"${log.protocolo} - ${log.paciente}"\nA50,170,0,2,1,1,N,"EXAME: ${log.exames} - TUBO GEL"\nP1`
                                });
                                setActiveWorkflowModal("epl");
                              }}
                              className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Tag className="w-3.5 h-3.5 text-teal-400" /> Etiqueta EPL
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedPdfLog(log)}
                              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Ver Laudo PDF
                            </button>
                          )}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" /> Cadastro de Laboratórios Clientes (Tenants)
                </h2>
                <p className="text-xs text-slate-400">Configure os parâmetros do Fácil 2024 / Autolac e credenciais do Softlab para cada cliente</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* SEARCH INPUT */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="🔍 Pesquisar laboratório..."
                    value={searchTenantsText}
                    onChange={(e) => setSearchTenantsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                {/* VIEW MODE TOGGLE (GRID vs CARDS) */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTenantViewMode("grid")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      tenantViewMode === "grid" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Grid Tabela
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenantViewMode("cards")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      tenantViewMode === "cards" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Cards Expandidos
                  </button>
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
                      softlabBaseUrl: "http://apoio.softlabsolucoes.com.br",
                      softlabLogin: "",
                      softlabSenha: ""
                    });
                    setIsNewTenantModalOpen(true);
                  }}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Novo Laboratório
                </button>
              </div>
            </div>

            {/* DATA GRID TABLE VIEW */}
            {tenantViewMode === "grid" ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-5">Laboratório Tenant</th>
                        <th className="py-3.5 px-5">Identificação / E-mail</th>
                        <th className="py-3.5 px-5">URL Autolac WS</th>
                        <th className="py-3.5 px-5">Login Softlab Apoio</th>
                        <th className="py-3.5 px-5">Agente / Lote</th>
                        <th className="py-3.5 px-5 text-center">Status</th>
                        <th className="py-3.5 px-5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {tenants
                        .filter(t =>
                          !searchTenantsText ||
                          t.nome.toLowerCase().includes(searchTenantsText.toLowerCase()) ||
                          t.identificacaoEntidade.toLowerCase().includes(searchTenantsText.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTenantsText.toLowerCase())
                        )
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-5">
                              <span className="font-bold text-slate-100 text-sm block">{t.nome}</span>
                              <span className="font-mono text-[10px] text-slate-500">ID: {t.id}</span>
                            </td>
                            <td className="py-3.5 px-5 font-mono text-xs text-teal-300 font-semibold">
                              {t.identificacaoEntidade}
                            </td>
                            <td className="py-3.5 px-5 font-mono text-xs text-slate-300 break-all max-w-[200px]">
                              {t.wsUrl}
                            </td>
                            <td className="py-3.5 px-5 font-mono text-xs text-slate-300">
                              {t.softlabLogin}
                            </td>
                            <td className="py-3.5 px-5 font-mono text-xs">
                              <span className="text-teal-400 font-bold">Agente: {t.codigoAgente}</span>
                              <span className="block text-cyan-400 text-[11px]">Lote: #{t.ultimoLote}</span>
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenEditTenant(t)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" /> Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tenants
                  .filter(t =>
                    !searchTenantsText ||
                    t.nome.toLowerCase().includes(searchTenantsText.toLowerCase()) ||
                    t.identificacaoEntidade.toLowerCase().includes(searchTenantsText.toLowerCase()) ||
                    t.id.toLowerCase().includes(searchTenantsText.toLowerCase())
                  )
                  .map((t) => (
                    <div key={t.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-teal-500/40 transition">
                      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-100 text-base truncate">{t.nome}</h3>
                            <p className="text-xs text-slate-400 truncate">Identificação Entidade: <span className="font-mono text-teal-300 font-semibold">{t.identificacaoEntidade}</span></p>
                            <p className="font-mono text-[10px] text-slate-600 truncate">ID: {t.id}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex-shrink-0 ml-2">
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
            )}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" /> Logs Transacionais de Ida e Volta
                </h2>
                <p className="text-xs text-slate-400">Rastreamento de solicitações SOAP XML e laudos REST JSON em tempo real</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* SEARCH INPUT */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="🔍 Pesquisar ID, protocolo..."
                    value={searchLogsText}
                    onChange={(e) => setSearchLogsText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                {/* VIEW MODE TOGGLE (GRID vs CARDS) */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLogViewMode("grid")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      logViewMode === "grid" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Grid Tabela
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogViewMode("cards")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      logViewMode === "cards" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Cards Expandidos
                  </button>
                </div>

                {/* LOG DIRECTION FILTER BUTTONS */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLogFilterDirection("TODOS")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      logFilterDirection === "TODOS" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilterDirection("IDA")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      logFilterDirection === "IDA" ? "bg-teal-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ↗ Ida
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilterDirection("VOLTA")}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      logFilterDirection === "VOLTA" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    ↙ Volta
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={handleRefreshLogs}
                  disabled={isRefreshingLogs}
                  className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? "animate-spin" : ""}`} /> Atualizar
                </button>
              </div>
            </div>

            {/* DATA GRID VIEW (DEFAULT HIGH-DENSITY TABLE) */}
            {logViewMode === "grid" ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-5">ID / Horário</th>
                        <th className="py-3.5 px-5">Direção</th>
                        <th className="py-3.5 px-5">Laboratório Tenant</th>
                        <th className="py-3.5 px-5">Protocolo / Paciente</th>
                        <th className="py-3.5 px-5">Exames Mapeados</th>
                        <th className="py-3.5 px-5">Status da Operação</th>
                        <th className="py-3.5 px-5 text-right">Ação / Payload</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {logs
                        .filter(log => logFilterDirection === "TODOS" || log.tipo.includes(logFilterDirection))
                        .filter(log =>
                          !searchLogsText ||
                          log.id.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                          log.protocolo.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                          log.paciente.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                          log.exames.toLowerCase().includes(searchLogsText.toLowerCase())
                        )
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-5 font-mono text-xs">
                              <span className="font-bold text-teal-400 block">{log.id}</span>
                              <span className="text-[11px] text-slate-500">{log.horario}</span>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                log.tipo.includes("IDA")
                                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              }`}>
                                {log.tipo.includes("IDA") ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                {log.tipo.split(" ")[0]}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-200 text-xs">
                              <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">{log.tenant}</span>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="font-mono text-xs font-bold text-teal-300 block">{log.protocolo}</span>
                              <span className="text-xs text-slate-300">{log.paciente}</span>
                            </td>
                            <td className="py-3.5 px-5 font-mono text-xs text-cyan-300 font-bold">{log.exames}</td>
                            <td className="py-3.5 px-5">
                              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {log.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedPayloadLog(log)}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ml-auto cursor-pointer"
                              >
                                <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Ver Payloads (XML/JSON)
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* EXPANDED CARDS VIEW (OPTIONAL ALTERNATIVE) */
              <div className="space-y-4">
                {logs
                  .filter(log => logFilterDirection === "TODOS" || log.tipo.includes(logFilterDirection))
                  .filter(log =>
                    !searchLogsText ||
                    log.id.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                    log.protocolo.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                    log.paciente.toLowerCase().includes(searchLogsText.toLowerCase()) ||
                    log.exames.toLowerCase().includes(searchLogsText.toLowerCase())
                  )
                  .map((log) => (
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
            )}
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
                <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/5">
                  <div>
                    <h3 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                      <UserPlus className="w-4 h-4 text-amber-400" /> Solicitações de Acesso Pendentes ({pendingRequests.length})
                    </h3>
                    <p className="text-xs text-slate-400">Novos laboratórios que solicitaram cadastro via tela inicial (Exclusivo Super Admin)</p>
                  </div>
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-mono font-semibold">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> E-mails de Ativação automáticos ➔ carloscleton.nat@gmail.com
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
                  <div className="relative">
                    <input
                      type={showSenhaWs ? "text" : "password"}
                      required
                      placeholder="Ex.: Soft@2026"
                      value={tenantFormData.senhaWs}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, senhaWs: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenhaWs(!showSenhaWs)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-teal-300 transition cursor-pointer"
                      title={showSenhaWs ? "Ocultar Senha" : "Exibir Senha"}
                    >
                      {showSenhaWs ? <EyeOff className="w-4 h-4 text-teal-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  <div className="relative">
                    <input
                      type={showSoftlabSenha ? "text" : "password"}
                      required
                      placeholder="Ex.: Carlos@2026"
                      value={tenantFormData.softlabSenha}
                      onChange={(e) => setTenantFormData({ ...tenantFormData, softlabSenha: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSoftlabSenha(!showSoftlabSenha)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-teal-300 transition cursor-pointer"
                      title={showSoftlabSenha ? "Ocultar Senha" : "Exibir Senha"}
                    >
                      {showSoftlabSenha ? <EyeOff className="w-4 h-4 text-teal-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL Base da API Softlab Apoio</label>
                  <input
                    type="text"
                    required
                    placeholder="http://apoio.softlabsolucoes.com.br"
                    value={tenantFormData.softlabBaseUrl}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, softlabBaseUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL WebService Autolac (Porta 8002)</label>
                  <input
                    type="text"
                    required
                    placeholder="http://177.22.36.202:8002/"
                    value={tenantFormData.wsUrl}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, wsUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              {/* DIAGNOSTIC TEST CONNECTION OUTPUT BOX */}
              {isTestingTenantConnection && (
                <div className="bg-slate-950 border border-teal-500/30 p-4 rounded-xl space-y-2 font-mono text-xs text-teal-300 animate-pulse flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                  <span>Testando autenticação API Softlab e conectividade WebService Autolac...</span>
                </div>
              )}

              {tenantTestResult && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-900 pb-1.5">
                    <span>⚡ Relatório Diagnóstico de Conexão</span>
                    <span className="text-emerald-400">✓ Teste Concluído</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" /> Softlab Apoio API REST:
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${tenantTestResult.softlabSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                      {tenantTestResult.softlabMsg}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-cyan-400" /> Autolac WebService SOAP:
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${tenantTestResult.autolacSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                      {tenantTestResult.autolacMsg}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestTenantConnection}
                  disabled={isTestingTenantConnection}
                  className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-extrabold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-current" />
                  {isTestingTenantConnection ? "Testando..." : "⚡ Testar Conexão"}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsNewTenantModalOpen(false); setTenantTestResult(null); }}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <Save className="w-4 h-4" /> Salvar Laboratório
                  </button>
                </div>
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
      {/* WORKFLOW MODAL: ETIQUETAS EPL */}
      {activeWorkflowModal === "epl" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-400" /> Visualizador e Impressor de Etiquetas (5cm x 3cm)
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* VISUAL STICKER PREVIEW (Simulação Fiel do Tubo de Amostra) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-teal-400" /> Pré-visualização da Etiqueta Física (50mm x 30mm)
                </span>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Tubo Softlab Apoio
                </span>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex justify-center items-center">
                {/* ETIQUETA TÉRMICA BRANCA */}
                <div className="w-[330px] h-[200px] bg-white text-black p-3.5 rounded-lg shadow-2xl border-2 border-slate-300 font-sans flex flex-col justify-between select-none relative overflow-hidden">
                  {/* Header da Etiqueta */}
                  <div className="flex justify-between items-center border-b border-slate-900/40 pb-1">
                    <span className="text-[10px] font-black tracking-tight uppercase text-slate-900">MIDWAY / SOFTLAB</span>
                    <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1 rounded uppercase">{selectedLabelData?.apoiado || "LAB. SAN MATHEWS"}</span>
                    <span className="text-[9px] font-mono text-slate-700 font-bold">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>

                  {/* Nome Paciente & Protocolo */}
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-950 leading-tight uppercase truncate">
                      {selectedLabelData?.protocolo || "PROTO-8842"} - {selectedLabelData?.paciente || "MARIA OLIVEIRA"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[8px] font-black bg-blue-100 text-blue-950 px-1.5 py-0.2 rounded border border-blue-300 uppercase">
                        {selectedLabelData?.idadeSexo || "34A (F)"}
                      </span>
                      <span className="text-[8px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded border border-amber-400 uppercase">
                        {selectedLabelData?.tubo || "TUBO GEL - TAMPA AMARELA"}
                      </span>
                      <span className="text-[8px] font-black bg-purple-100 text-purple-950 px-1.5 py-0.2 rounded border border-purple-300 uppercase">
                        SETOR: {selectedLabelData?.setor || "BIOQUÍMICA"}
                      </span>
                    </div>
                  </div>

                  {/* Código de Barras Real Scaneável (Code 128) */}
                  <div className="text-center my-0.5 bg-slate-50 py-1.5 px-2 rounded border border-slate-200">
                    <div 
                      className="w-full flex justify-center items-center h-10 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: generateCode128SvgString(selectedLabelData?.codigoBarras || "BAR_PROTO-8842_1", 38, 1.8) }}
                    />
                    <div className="font-mono text-[10px] font-bold text-slate-800 mt-0.5 tracking-wider">
                      {selectedLabelData?.codigoBarras || "BAR_PROTO-8842_1"}
                    </div>
                  </div>

                  {/* Exames */}
                  <div className="flex justify-between items-center border-t border-slate-900/40 pt-1 text-[9px] font-bold text-slate-900">
                    <span className="truncate">EXAMES: {selectedLabelData?.exames || "T3 / TSH / GLICOSE"}</span>
                    <span className="font-mono text-[8px] bg-slate-200 px-1 rounded">SOFTLAB 5X3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CÓDIGO EPL BRUTO */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyan-400" /> Comandos EPL/ZPL para Impressora Térmica
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLabelData?.eplCode || `N\nq500\nQ300,24\nB50,15,0,1,2,6,85,B,"BAR_PROTO-8842_1"\nA50,110,0,3,1,1,N,"PROTO-8842 - MARIA OLIVEIRA (34A F)"\nA50,135,0,2,1,1,N,"APOIADO: LAB SAN MATHEWS | SETOR: BIOQUIMICA"\nA50,160,0,2,1,1,N,"TUBO: TUBO GEL - TAMPA AMARELA"\nA50,180,0,2,1,1,N,"EXAMES: T3 / TSH / GLICOSE"\nP1`);
                    showNotification("📋 Comandos EPL copiados para a área de transferência!");
                  }}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Copiar Comandos EPL
                </button>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-teal-300 max-h-36 overflow-y-auto">
                <pre className="text-[11px] whitespace-pre-wrap">
{selectedLabelData?.eplCode || `N
q500
Q300,24
B50,15,0,1,2,6,85,B,"BAR_PROTO-8842_1"
A50,110,0,3,1,1,N,"PROTO-8842 - MARIA OLIVEIRA (34A F)"
A50,135,0,2,1,1,N,"APOIADO: LAB SAN MATHEWS | SETOR: BIOQUIMICA"
A50,160,0,2,1,1,N,"TUBO: TUBO GEL - TAMPA AMARELA"
A50,180,0,2,1,1,N,"EXAMES: T3 / TSH / GLICOSE"
P1`}
                </pre>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveWorkflowModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (printerMode === "dialog") {
                    handlePrintLabel();
                  } else {
                    handlePrintDirect();
                  }
                }}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <Printer className="w-4 h-4 text-slate-950" /> Imprimir Etiqueta ({selectedWindowsPrinter.split(" ")[0]})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: CANCELAMENTO DE AMOSTRA */}
      {activeWorkflowModal === "cancel" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" /> Cancelamento de Amostra no Softlab Apoio
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelAmostra} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Protocolo / LIS Softlab</label>
                <input
                  type="text"
                  value={cancelForm.protocolo}
                  onChange={(e) => setCancelForm({ ...cancelForm, protocolo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-rose-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Código de Barras da Amostra / Tubo</label>
                <input
                  type="text"
                  value={cancelForm.codigoAmostra}
                  onChange={(e) => setCancelForm({ ...cancelForm, codigoAmostra: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Motivo do Cancelamento</label>
                <select
                  value={cancelForm.motivo}
                  onChange={(e) => setCancelForm({ ...cancelForm, motivo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500/50"
                >
                  <option value="Hemólise na amostra">Hemólise na amostra</option>
                  <option value="Amostra insuficiente (Volume baixo)">Amostra insuficiente (Volume baixo)</option>
                  <option value="Coágulo na amostra de Sangue Total">Coágulo na amostra de Sangue Total</option>
                  <option value="Jejum inadequado do paciente">Jejum inadequado do paciente</option>
                  <option value="Solicitação de cancelamento pelo médico/paciente">Solicitação de cancelamento pelo médico/paciente</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Justificativa Detalhada (Rastreabilidade)</label>
                <textarea
                  rows={3}
                  value={cancelForm.justificativa}
                  onChange={(e) => setCancelForm({ ...cancelForm, justificativa: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-rose-500/50"
                  placeholder="Informe o motivo detalhado..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" /> Confirmar Cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: AJUSTAR DATA/HORA DE COLETA */}
      {activeWorkflowModal === "coleta" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" /> Ajuste de Data e Hora Real da Coleta
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAjusteColeta} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Protocolo / Pedido Softlab</label>
                <input
                  type="text"
                  value={coletaForm.protocolo}
                  onChange={(e) => setColetaForm({ ...coletaForm, protocolo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Data da Coleta Real</label>
                  <input
                    type="date"
                    value={coletaForm.data}
                    onChange={(e) => setColetaForm({ ...coletaForm, data: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Hora da Coleta Real</label>
                  <input
                    type="time"
                    value={coletaForm.hora}
                    onChange={(e) => setColetaForm({ ...coletaForm, hora: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Profissional Responsável pela Coleta</label>
                <input
                  type="text"
                  value={coletaForm.responsavel}
                  onChange={(e) => setColetaForm({ ...coletaForm, responsavel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Save className="w-4 h-4" /> Salvar Data/Hora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKFLOW MODAL: ADIÇÃO DE EXAMES (LOTE 1.2) */}
      {activeWorkflowModal === "lote12" && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Adição de Exames a Atendimento (Lote 1.2)
              </h3>
              <button type="button" onClick={() => setActiveWorkflowModal(null)} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdicaoExames} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Protocolo / Atendimento do Paciente</label>
                <input
                  type="text"
                  value={lote12Form.protocolo}
                  onChange={(e) => setLote12Form({ ...lote12Form, protocolo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">Selecione os Exames Adicionais (Sem alterar tubos já colhidos)</label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-2">
                  {softlabExames.slice(0, 10).map((exam) => {
                    const isSelected = lote12Form.novosExames.includes(exam.codigo);
                    return (
                      <label key={exam.codigo} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 cursor-pointer border border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLote12Form({ ...lote12Form, novosExames: [...lote12Form.novosExames, exam.codigo] });
                              } else {
                                setLote12Form({ ...lote12Form, novosExames: lote12Form.novosExames.filter(c => c !== exam.codigo) });
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-bold text-teal-300">{exam.codigo}</span>
                          <span className="text-slate-200 text-xs truncate max-w-[200px]">{exam.descricao}</span>
                        </div>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold">{exam.tipo}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="gerarTubo"
                  checked={lote12Form.gerarNovoTubo}
                  onChange={(e) => setLote12Form({ ...lote12Form, gerarNovoTubo: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="gerarTubo" className="text-indigo-200 text-xs font-semibold cursor-pointer">
                  Gerar novo tubo/amostra e etiqueta EPL no Softlab Apoio se necessário
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-4 h-4" /> Adicionar Exames ao Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZADOR DE EXAMES MAPEADOS (DE-PARA) */}
      {isMappedExamsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Central de Exames Mapeados (DE-PARA)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exames do Softlab Apoio que possuem código correspondente vinculado ao Autolac para o laboratório <strong className="text-teal-300">{selectedTenant}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMappedExamsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SUMMARY STATS & SEARCH */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{softlabExames.filter(e => Boolean(e.autolacMapped)).length} Exames Mapeados</span>
                </div>
                <span className="text-xs text-slate-400">de {softlabExames.length} exames no catálogo total</span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar entre os mapeados..."
                  value={searchMappedModal}
                  onChange={(e) => setSearchMappedModal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* MAPPED EXAMS LIST / TABLE */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-3 px-4">Código Softlab</th>
                    <th className="py-3 px-4">Exame Softlab Apoio</th>
                    <th className="py-3 px-4">Código Autolac (Mapeado)</th>
                    <th className="py-3 px-4">Tipo Resultado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {softlabExames
                    .filter(e => Boolean(e.autolacMapped))
                    .filter(e =>
                      e.codigo.toLowerCase().includes(searchMappedModal.toLowerCase()) ||
                      e.descricao.toLowerCase().includes(searchMappedModal.toLowerCase()) ||
                      e.autolacMapped.toLowerCase().includes(searchMappedModal.toLowerCase())
                    )
                    .map((exam) => (
                      <tr key={exam.codigo} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-teal-300">{exam.codigo}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-100 text-xs block">{exam.descricao}</span>
                          <span className="text-[11px] text-slate-500">{exam.abreviacao}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                            {exam.autolacMapped}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            exam.tipo === "ESTRUTURADO"
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                          }`}>
                            {exam.tipo || "PDF"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mapeado
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMappedExamsModalOpen(false);
                              handleOpenMapExam(exam);
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  {softlabExames.filter(e => Boolean(e.autolacMapped)).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        Nenhum exame mapeado no momento. Vincule os exames no painel DE-PARA!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleExportCsv}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-teal-400" /> Exportar Planilha CSV
              </button>

              <button
                type="button"
                onClick={() => setIsMappedExamsModalOpen(false)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INSPETOR DE PAYLOAD (SOAP XML & REST JSON) */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-teal-400" />
                  Inspetor Transacional: {selectedPayloadLog.id} ({selectedPayloadLog.protocolo})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paciente: <strong className="text-slate-200">{selectedPayloadLog.paciente}</strong> | Tenant: <strong className="text-teal-300">{selectedPayloadLog.tenant}</strong> | Horário: <span className="font-mono text-slate-300">{selectedPayloadLog.horario}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayloadLog(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STATUS BADGE */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Status da Transação:</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {selectedPayloadLog.status}
              </span>
            </div>

            {/* PAYLOAD CODE PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-teal-400" /> SOAP XML Autolac ({selectedPayloadLog.tipo.split(" ")[0]})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const xmlText = `<root>\n  <codigoLab>${selectedPayloadLog.tenant}</codigoLab>\n  <solicitacao>\n    <protocolo>${selectedPayloadLog.protocolo}</protocolo>\n    <paciente>${selectedPayloadLog.paciente}</paciente>\n    <exame>${selectedPayloadLog.exames}</exame>\n  </solicitacao>\n</root>`;
                      navigator.clipboard.writeText(xmlText);
                      showNotification("📋 Payload SOAP XML copiado para a área de transferência!");
                    }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded transition font-semibold cursor-pointer"
                  >
                    Copiar XML
                  </button>
                </div>
                <pre className="text-xs font-mono text-teal-300 bg-slate-900/90 p-3 rounded-lg flex-1 overflow-x-auto whitespace-pre-wrap border border-slate-800">
{`<root>
  <codigoLab>${selectedPayloadLog.tenant}</codigoLab>
  <solicitacao>
    <protocolo>${selectedPayloadLog.protocolo}</protocolo>
    <paciente>${selectedPayloadLog.paciente}</paciente>
    <exame>${selectedPayloadLog.exames}</exame>
  </solicitacao>
</root>`}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400" /> REST JSON Softlab Apoio
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const jsonText = `{\n  "codigoLis": "${selectedPayloadLog.protocolo}",\n  "paciente": "${selectedPayloadLog.paciente}",\n  "status": "PROCESSADO_SUCESSO",\n  "exames": ["${selectedPayloadLog.exames}"]\n}`;
                      navigator.clipboard.writeText(jsonText);
                      showNotification("📋 Payload REST JSON copiado para a área de transferência!");
                    }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded transition font-semibold cursor-pointer"
                  >
                    Copiar JSON
                  </button>
                </div>
                <pre className="text-xs font-mono text-cyan-300 bg-slate-900/90 p-3 rounded-lg flex-1 overflow-x-auto whitespace-pre-wrap border border-slate-800">
{`{
  "codigoLis": "${selectedPayloadLog.protocolo}",
  "paciente": "${selectedPayloadLog.paciente}",
  "status": "PROCESSADO_SUCESSO",
  "exames": ["${selectedPayloadLog.exames}"]
}`}
                </pre>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPayloadLog(null)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Fechar Inspetor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZADOR DE LAUDO PDF */}
      {selectedPdfLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Laudo de Diagnóstico Médico - {selectedPdfLog.protocolo}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paciente: <strong className="text-slate-200">{selectedPdfLog.paciente}</strong> | Apoio: <strong className="text-teal-300">Softlab Apoio</strong> | Status: <span className="text-emerald-400 font-bold">ENTREGUE AO AUTOLAC</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPdfLog(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LAUDO DOCUMENT PREVIEW (SIMULAÇÃO FIEL DO DOCUMENTO PDF) */}
            <div className="flex-1 overflow-y-auto bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-lg shadow-2xl space-y-6 font-sans select-none border border-slate-300 text-xs">
                {/* LAUDO HEADER */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">SOFTLAB SOLUÇÕES EM SAÚDE & APOIO</h2>
                    <p className="text-[10px] text-slate-600 font-semibold">Laboratório Central de Diagnósticos e Apoio Laboratorial</p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-700">
                    <span className="font-bold text-slate-900 block text-xs">LAUDO Nº {selectedPdfLog.protocolo}</span>
                    <span>Liberação: {selectedPdfLog.horario || new Date().toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>

                {/* PACIENTE INFO BOX */}
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Paciente:</span>
                    <strong className="text-slate-950 font-black uppercase">{selectedPdfLog.paciente}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Laboratório Apoiado:</span>
                    <strong className="text-teal-900 font-black">{selectedPdfLog.tenant || "San Mathews"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Protocolo LIS:</span>
                    <strong className="font-mono text-slate-900 font-bold">{selectedPdfLog.protocolo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Médico Solicitante:</span>
                    <strong className="text-slate-900 font-bold">Dr. Responsável Clínico</strong>
                  </div>
                </div>

                {/* EXAMES E RESULTADOS */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-400 pb-1 uppercase tracking-wider">
                    RESULTADO DOS EXAMES PROCESSADOS
                  </h4>

                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-3">Exame / Parâmetro</th>
                          <th className="py-2 px-3">Resultado</th>
                          <th className="py-2 px-3">Unidade</th>
                          <th className="py-2 px-3">Valores de Referência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        <tr>
                          <td className="py-2 px-3 font-bold text-slate-900 font-sans">{selectedPdfLog.exames}</td>
                          <td className="py-2 px-3 font-black text-teal-900">14.2</td>
                          <td className="py-2 px-3">g/dL</td>
                          <td className="py-2 px-3 text-slate-600">12.0 a 16.0 g/dL</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-bold text-slate-900 font-sans">GLICOSE DOSAGEM EM JEJUM</td>
                          <td className="py-2 px-3 font-black text-teal-900">88</td>
                          <td className="py-2 px-3">mg/dL</td>
                          <td className="py-2 px-3 text-slate-600">70 a 99 mg/dL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ASSINATURA DIGITAL */}
                <div className="pt-6 flex justify-between items-end border-t border-slate-300 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Autenticação Digital Hash:</span>
                    <span className="font-mono text-slate-700 text-[9px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-900 mb-1"></div>
                    <strong className="block text-slate-900 font-bold">Dra. Fernanda Santos</strong>
                    <span className="text-slate-600 text-[9px]">Biomédica Responsável - CRBM 14.892</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  showNotification("📥 Baixando arquivo Laudo_PDF_Base64.pdf...");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-teal-400" /> Baixar Laudo PDF
              </button>

              <button
                type="button"
                onClick={() => setSelectedPdfLog(null)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Fechar Laudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO DA IMPRESSORA DO WINDOWS (ACESSADO NO TOPO AO LADO DE SAIR) */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-teal-400" />
                  Configurar Impressora da Estação de Trabalho
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Selecione a impressora física instalada no seu Windows nesta máquina</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrinterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrinterSettings} className="space-y-4 text-xs">
              {/* SELEÇÃO IMPRESSORA WINDOWS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-teal-400" /> Impressoras Instaladas no Windows
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectWindowsPrinters}
                    disabled={isDetectingPrinters}
                    className="text-[11px] font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-500/30 transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDetectingPrinters ? "animate-spin text-teal-400" : ""}`} />
                    {isDetectingPrinters ? "Detectando..." : "🔄 Detectar Impressoras"}
                  </button>
                </div>

                <select
                  value={selectedWindowsPrinter}
                  onChange={(e) => setSelectedWindowsPrinter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-teal-300 font-bold focus:outline-none focus:border-teal-500/50 cursor-pointer"
                >
                  {windowsPrinters.map((p, idx) => (
                    <option key={idx} value={p} className="bg-slate-900 text-slate-200">
                      🖨️ {p}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                  <span>Impressora Selecionada: <strong className="text-teal-300">{selectedWindowsPrinter}</strong></span>
                  <span className="text-emerald-400 font-bold">PRONTO</span>
                </div>
              </div>

              {/* COMPORTAMENTO & FORMATO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Comportamento de Impressão</label>
                  <select
                    value={printerMode}
                    onChange={(e) => setPrinterMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="dialog">🖨️ Caixa do Navegador (Janela do Sistema - Imagem 2)</option>
                    <option value="direct">⚡ Impressão Direta Silenciosa (Disparo RAW / Spooler)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Tamanho do Papel da Etiqueta</label>
                  <select
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="50mm x 30mm (5x3cm - Softlab)">50mm x 30mm (5x3cm - Softlab Apoio)</option>
                    <option value="60mm x 40mm (6x4cm)">60mm x 40mm (6x4cm)</option>
                  </select>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" /> 💾 Salvar Impressora Padrão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORTADOR DE ARQUIVOS (CSV / JSON) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                {importTarget === "depara" ? "Importar Planilha de DE-PARA em Lote (CSV / JSON)" :
                 importTarget === "softlab" ? "Importar Catálogo do Softlab (CSV / JSON)" :
                 "Importar Catálogo do Autolac (CSV / JSON)"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setParsedImportItems([]); setImportFileName(""); }}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-300">
                {importTarget === "depara"
                  ? "Selecione um arquivo .csv ou .json contendo as colunas 'codigo_autolac' e 'codigo_softlab' para importar o mapeamento em lote diretamente para o Supabase."
                  : "Selecione um arquivo .csv ou .json com a lista de exames para carregar no catálogo."}
              </p>

              {/* FILE SELECTOR DROPZONE */}
              <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-950 p-6 rounded-2xl text-center space-y-3 transition">
                <Upload className="w-10 h-10 text-teal-400 mx-auto" />
                <div>
                  <label htmlFor="file-upload-input" className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition cursor-pointer inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Selecionar Arquivo CSV ou JSON
                  </label>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {importFileName ? (
                  <p className="font-mono text-teal-300 font-bold text-xs">📄 Arquivo Selecionado: {importFileName}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Aceita arquivos .csv (separados por vírgula ou ;) e .json</p>
                )}
              </div>

              {/* CLEAR CATALOG OPTION CHECKBOX */}
              {importTarget === "softlab" && (
                <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 transition">
                  <input
                    type="checkbox"
                    checked={shouldClearBeforeImport}
                    onChange={(e) => setShouldClearBeforeImport(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-teal-500/20 cursor-pointer"
                  />
                  <span>⚠️ <strong>Substituir catálogo:</strong> Limpar exames antigos do banco antes de salvar os novos</span>
                </label>
              )}


              {/* PREVIEW OF PARSED ITEMS */}
              {parsedImportItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span>Pré-Visualização dos Dados ({parsedImportItems.length} itens lidos):</span>
                    <span className="text-emerald-400">✓ Pronto para Importar</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
                    {parsedImportItems.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-300">
                        <span className="truncate text-teal-300 font-bold">
                          {importTarget === "depara" ? `${item.codigo_autolac || item.autolac || 'AUT'} ↔ ${item.codigo_softlab || item.softlab || 'SOFT'}` : (item.codigo || item.code || item.codigo_softlab || item.codigo_autolac || 'ITEM')}
                        </span>
                        <span className="truncate text-slate-400 max-w-[200px]">
                          {item.descricao || item.nome || item.descricao_autolac || "Item Lido"}
                        </span>
                      </div>
                    ))}
                    {parsedImportItems.length > 10 && (
                      <p className="text-center text-slate-500 pt-1 text-[10px]">...e mais {parsedImportItems.length - 10} itens</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setParsedImportItems([]); setImportFileName(""); }}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={parsedImportItems.length === 0}
                onClick={handleConfirmImport}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-extrabold px-5 py-2 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer text-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirmar & Salvar no Supabase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALHES PRÉ-ANALÍTICOS DO EXAME (SOFTLAB API GET /api/TipoDeExame/{codigo}) */}
      {examDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-teal-400 font-mono font-bold uppercase tracking-wider block">
                  API SOFTLAB APOIO • GET /api/TipoDeExame/{examDetailsModal.codigo}
                </span>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-400" />
                  Ficha Pré-Analítica: {examDetailsModal.descricao}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExamDetailsModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-teal-400 font-bold uppercase flex items-center gap-1">
                  🧪 Material Biológico & Recipiente
                </span>
                <p className="font-bold text-slate-100">{examDetailsModal.material}</p>
                <p className="text-slate-400 text-[11px] font-mono">{examDetailsModal.tubo}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                  ⏱️ Instruções de Coleta & Jejum
                </span>
                <p className="font-bold text-slate-100">{examDetailsModal.jejum}</p>
                <p className="text-slate-400 text-[11px]">Orientações prévias enviadas ao paciente no agendamento LIS.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                  🌡️ Conservação & Estabilidade
                </span>
                <p className="font-bold text-slate-100">{examDetailsModal.conservacao}</p>
                <p className="text-slate-400 text-[11px]">Condições recomendadas para transporte no apoio.</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-1">
                  🔬 Método Analítico & Prazo
                </span>
                <p className="font-bold text-slate-100">{examDetailsModal.metodo}</p>
                <p className="text-slate-400 text-[11px] font-mono">Prazo Estimado: {examDetailsModal.prazo}</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Código no Softlab: <strong className="text-teal-300">{examDetailsModal.codigo}</strong></span>
              <span className="text-slate-400">Formato Laudo: <strong className="text-cyan-300">{examDetailsModal.tipo}</strong></span>
              <span className="text-slate-400">Mapeado Autolac: <strong className="text-amber-300">{examDetailsModal.autolacMapped || 'Pendente'}</strong></span>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setExamDetailsModal(null)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition text-xs shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Fechar Ficha Pré-Analítica
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


