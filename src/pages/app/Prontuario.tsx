import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClinicalAccessGuard } from "@/components/permissions/ClinicalAccessGuard";
import {
  FileText, 
  ArrowLeft,
  Printer,
  Download,
  Settings,
  LayoutDashboard,
  Stethoscope,
  Clock,
  Calendar,
  Paperclip,
  Image,
  AlertTriangle,
  History,
  Plus,
  Lock,
  Shield,
  ShieldX,
  GitBranch,
  Heart,
  ClipboardList,
  Target,
  Activity,
  Pill,
  Smile,
  Crosshair,
  Camera,
  // Psychology icons
  NotebookPen,
  MapPin,
  Goal,
  Route,
  // Psychiatry icons
  BrainCircuit,
  PillIcon,
  TrendingUp,
  ClipboardCheck,
  // Nutrition icons
  Apple,
  Scale,
  Utensils,
  LineChart,
  // Aesthetics icons
  Sparkles,
  Syringe,
  Package,
  ImageIcon,
  FileCheck,
  // Physiotherapy icons
  PersonStanding,
  MessageSquare,
  Gauge,
  Move,
  Dumbbell,
  BarChart3,
  // Pediatrics icons
  Baby,
  Ruler,
  TrendingUp as GrowthChart,
  BrainCircuit as BrainDevelopment,
  ShieldCheck,
  // Gynecology icons
  CircleUser,
  CalendarDays,
  HeartPulse,
  Search,
  // Ophthalmology icons
  Eye,
  Focus,
  Microscope,
  type LucideIcon
} from "lucide-react";
import { 
  useProntuarioData, 
  useMedicalRecordSignatures, 
  useCurrentUserMedicalRecordPermissions,
  useCanEditMedicalRecord,
  type TabConfig, 
  type MedicalRecordEntry,
  type TabKey,
  type ActionKey,
} from "@/hooks/prontuario";
import { useActiveSpecialty } from "@/hooks/prontuario/useActiveSpecialty";
import { isTabVisibleForSpecialty } from "@/hooks/prontuario/specialtyTabsConfig";
import { useLgpdEnforcement } from "@/hooks/lgpd";
import { PatientHeader } from "@/components/prontuario/PatientHeader";
import { ProntuarioSearchBar, type SearchResult } from "@/components/prontuario/ProntuarioSearchBar";
import { LgpdBlockingOverlay } from "@/components/prontuario/LgpdBlockingOverlay";
import { ConsentCollectionDialog } from "@/components/prontuario/ConsentCollectionDialog";
import { SignatureDialog } from "@/components/prontuario/SignatureDialog";
import { SignedRecordBadge } from "@/components/prontuario/SignedRecordBadge";
import { PatientSelector } from "@/components/prontuario/PatientSelector";
import { ClinicalTimeline } from "@/components/prontuario/ClinicalTimeline";
import { SpecialtySelector } from "@/components/prontuario/SpecialtySelector";
import { OdontogramModule } from "@/components/prontuario/odontogram/OdontogramModule";
import { FacialMapModule, BeforeAfterModule, ConsentModule } from "@/components/prontuario/aesthetics";
import { VisaoGeralBlock, AnamneseBlock, EvolucoesBlock, ExameFisicoBlock, CondutaBlock, DocumentosBlock, AlertasBlock, AlertasBanner, LinhaTempoBlock, DiagnosticosBlock, PrescricoesBlock } from "@/components/prontuario/clinica-geral";
import { VisaoGeralPsicologiaBlock } from "@/components/prontuario/psicologia";
import { useVisaoGeralData, useAnamneseData, useEvolucoesData, useExameFisicoData, useCondutaData, useDocumentosData, useAlertasData, useLinhaTempoData, useDiagnosticosData, usePrescricoesData } from "@/hooks/prontuario/clinica-geral";
import { useVisaoGeralPsicologiaData } from "@/hooks/prontuario/psicologia";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Icon mapping for dynamic tabs
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Stethoscope,
  Clock,
  Calendar,
  Paperclip,
  Image,
  AlertTriangle,
  History,
  Activity,
  Pill,
  FolderOpen: Paperclip,
  Shield: AlertTriangle,
  GitBranch,
  Heart,
  ClipboardList,
  Target,
  Smile,
  Crosshair,
  Camera,
  // Psychology icons
  NotebookPen,
  Goal,
  Route,
  // Psychiatry icons
  BrainCircuit,
  PillIcon,
  TrendingUp,
  ClipboardCheck,
  // Nutrition icons
  Apple,
  Scale,
  Utensils,
  LineChart,
  // Aesthetics icons
  Sparkles,
  Syringe,
  Package,
  ImageIcon,
  FileCheck,
  // Physiotherapy icons
  PersonStanding,
  MessageSquare,
  Gauge,
  Move,
  Dumbbell,
  BarChart3,
  // Pediatrics icons
  Baby,
  Ruler,
  GrowthChart,
  BrainDevelopment,
  ShieldCheck,
  // Gynecology icons
  CircleUser,
  CalendarDays,
  HeartPulse,
  Search,
  // Ophthalmology icons
  Eye,
  Focus,
  Microscope,
};

// Tab key mapping to standard keys
const TAB_KEY_MAP: Record<string, TabKey> = {
  resumo: 'resumo',
  anamnese: 'anamnese',
  sinais_vitais: 'anamnese', // Map vital signs to anamnese for permissions
  odontograma: 'anamnese', // Map odontogram to anamnese for permissions
  tooth_procedures: 'procedimentos', // Map tooth procedures to procedimentos
  fotos_intraorais: 'documentos', // Map intraoral photos to documentos
  evolucao: 'evolucao',
  diagnostico: 'diagnostico',
  exames_solicitacao: 'exames', // Map exam requests to exames
  conduta: 'evolucao', // Map conduct to evolucao for permissions
  procedimentos: 'procedimentos',
  prescricoes: 'prescricoes',
  exames: 'exames',
  documentos: 'documentos',
  consentimentos: 'consentimentos',
  auditoria: 'auditoria',
  alertas: 'resumo', // Map alertas to resumo for permission check
  historico: 'auditoria', // Map historico to auditoria
  imagens: 'documentos', // Map imagens to documentos
  timeline: 'auditoria', // Map timeline to auditoria for permission check
  // Psychology tabs - map to evolucao for permissions
  session_record: 'evolucao',
  therapeutic_goals: 'evolucao',
  therapeutic_plan: 'evolucao',
  // Psychiatry tabs - map to appropriate permissions
  diagnosis_dsm: 'diagnostico',
  psychiatric_prescription: 'prescricoes',
  symptom_evolution: 'evolucao',
  medication_history: 'prescricoes',
  // Nutrition tabs - map to appropriate permissions
  nutritional_assessment: 'anamnese',
  body_measurements: 'anamnese',
  meal_plan: 'evolucao',
  nutritional_evolution: 'evolucao',
  // Aesthetics tabs - map to appropriate permissions
  aesthetic_assessment: 'anamnese',
  aesthetic_procedure: 'procedimentos',
  products_used: 'procedimentos',
  before_after_photos: 'documentos',
  consent_form: 'consentimentos',
  facial_map: 'procedimentos', // Map facial map to procedimentos
  aesthetic_consent: 'consentimentos', // Map aesthetic consent to consentimentos
  // Physiotherapy tabs - map to appropriate permissions
  functional_assessment: 'anamnese',
  chief_complaint: 'anamnese',
  pain_scale: 'anamnese',
  range_of_motion: 'anamnese',
  physio_therapeutic_plan: 'evolucao',
  applied_exercises: 'procedimentos',
  session_evolution: 'evolucao',
  // Pediatrics tabs - map to appropriate permissions
  pediatric_anamnesis: 'anamnese',
  gestational_history: 'anamnese',
  growth_data: 'anamnese',
  growth_curve: 'anamnese',
  neuropsychomotor_development: 'anamnese',
  vaccines: 'anamnese',
  pediatric_diagnosis: 'diagnostico',
  pediatric_conduct: 'evolucao',
  pediatric_evolution: 'evolucao',
  // Gynecology tabs - map to appropriate permissions
  gyneco_anamnesis: 'anamnese',
  gyneco_data: 'anamnese',
  obstetric_history: 'anamnese',
  gyneco_exam: 'anamnese',
  gyneco_exams_results: 'exames',
  gyneco_diagnosis: 'diagnostico',
  gyneco_conduct: 'evolucao',
  gyneco_evolution: 'evolucao',
  // Ophthalmology tabs - map to appropriate permissions
  ophthalmo_anamnesis: 'anamnese',
  visual_acuity: 'anamnese',
  ophthalmo_exam: 'anamnese',
  intraocular_pressure: 'anamnese',
  ophthalmo_diagnosis: 'diagnostico',
  ophthalmo_complementary_exams: 'exames',
  ophthalmo_conduct: 'evolucao',
  ophthalmo_evolution: 'evolucao',
};

// Fallback nav items when no config exists
const DEFAULT_NAV_ITEMS = [
  { id: 'resumo', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'sinais_vitais', label: 'Sinais Vitais', icon: Heart },
  { id: 'odontograma', label: 'Odontograma', icon: Smile },
  { id: 'tooth_procedures', label: 'Procedimentos por Dente', icon: Crosshair },
  { id: 'evolucao', label: 'Evoluções', icon: Activity },
  { id: 'diagnostico', label: 'Diagnóstico (CID)', icon: Stethoscope },
  { id: 'exames_solicitacao', label: 'Solicitar Exames', icon: ClipboardList },
  { id: 'conduta', label: 'Plano/Conduta', icon: Target },
  { id: 'fotos_intraorais', label: 'Fotos Intraorais', icon: Camera },
  { id: 'exames', label: 'Exames / Documentos', icon: Paperclip },
  { id: 'timeline', label: 'Linha do Tempo', icon: GitBranch },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
  { id: 'historico', label: 'Histórico', icon: History },
  // Psychology tabs
  { id: 'session_record', label: 'Registro de Sessão', icon: NotebookPen },
  { id: 'therapeutic_goals', label: 'Objetivos Terapêuticos', icon: Goal },
  { id: 'therapeutic_plan', label: 'Plano Terapêutico', icon: Route },
  // Psychiatry tabs
  { id: 'diagnosis_dsm', label: 'Diagnóstico (CID/DSM)', icon: BrainCircuit },
  { id: 'psychiatric_prescription', label: 'Prescrição Medicamentosa', icon: PillIcon },
  { id: 'symptom_evolution', label: 'Evolução de Sintomas', icon: TrendingUp },
  { id: 'medication_history', label: 'Histórico de Medicamentos', icon: ClipboardCheck },
  // Nutrition tabs
  { id: 'nutritional_assessment', label: 'Avaliação Nutricional', icon: Apple },
  { id: 'body_measurements', label: 'Medidas Corporais', icon: Scale },
  { id: 'meal_plan', label: 'Plano Alimentar', icon: Utensils },
  { id: 'nutritional_evolution', label: 'Evolução Nutricional', icon: LineChart },
  // Aesthetics tabs
  { id: 'aesthetic_assessment', label: 'Avaliação Estética', icon: Sparkles },
  { id: 'aesthetic_procedure', label: 'Procedimento Realizado', icon: Syringe },
  { id: 'products_used', label: 'Produtos Utilizados', icon: Package },
  { id: 'before_after_photos', label: 'Fotos Antes/Depois', icon: ImageIcon },
  { id: 'consent_form', label: 'Termo de Consentimento', icon: FileCheck },
  { id: 'facial_map', label: 'Mapa Facial', icon: MapPin },
  { id: 'aesthetic_consent', label: 'Termos Estéticos', icon: FileCheck },
  // Physiotherapy tabs
  { id: 'functional_assessment', label: 'Avaliação Funcional', icon: PersonStanding },
  { id: 'chief_complaint', label: 'Queixa Principal', icon: MessageSquare },
  { id: 'pain_scale', label: 'Escala de Dor', icon: Gauge },
  { id: 'range_of_motion', label: 'Amplitude de Movimento', icon: Move },
  { id: 'physio_therapeutic_plan', label: 'Plano Terapêutico', icon: ClipboardList },
  { id: 'applied_exercises', label: 'Exercícios Aplicados', icon: Dumbbell },
  { id: 'session_evolution', label: 'Evolução por Sessão', icon: BarChart3 },
  // Pediatrics tabs
  { id: 'pediatric_anamnesis', label: 'Anamnese Pediátrica', icon: Baby },
  { id: 'gestational_history', label: 'Histórico Gestacional', icon: Heart },
  { id: 'growth_data', label: 'Dados de Crescimento', icon: Ruler },
  { id: 'growth_curve', label: 'Curva de Crescimento', icon: GrowthChart },
  { id: 'neuropsychomotor_development', label: 'Desenvolvimento DNPM', icon: BrainDevelopment },
  { id: 'vaccines', label: 'Vacinas', icon: ShieldCheck },
  { id: 'pediatric_diagnosis', label: 'Diagnóstico', icon: Stethoscope },
  { id: 'pediatric_conduct', label: 'Conduta/Orientações', icon: Target },
  { id: 'pediatric_evolution', label: 'Evolução Clínica', icon: Activity },
  // Gynecology tabs
  { id: 'gyneco_anamnesis', label: 'Anamnese Ginecológica', icon: CircleUser },
  { id: 'gyneco_data', label: 'Dados Ginecológicos', icon: CalendarDays },
  { id: 'obstetric_history', label: 'Histórico Obstétrico (G/P/A)', icon: HeartPulse },
  { id: 'gyneco_exam', label: 'Exame Ginecológico', icon: Search },
  { id: 'gyneco_exams_results', label: 'Exames/Resultados', icon: ClipboardList },
  { id: 'gyneco_diagnosis', label: 'Diagnóstico', icon: Stethoscope },
  { id: 'gyneco_conduct', label: 'Conduta/Prescrição', icon: Target },
  { id: 'gyneco_evolution', label: 'Evolução Clínica', icon: Activity },
  // Ophthalmology tabs
  { id: 'ophthalmo_anamnesis', label: 'Anamnese Oftalmológica', icon: Eye },
  { id: 'visual_acuity', label: 'Acuidade Visual (OD/OE)', icon: Focus },
  { id: 'ophthalmo_exam', label: 'Exame Oftalmológico', icon: Microscope },
  { id: 'intraocular_pressure', label: 'Pressão Intraocular (OD/OE)', icon: Gauge },
  { id: 'ophthalmo_diagnosis', label: 'Diagnóstico (OD/OE)', icon: Stethoscope },
  { id: 'ophthalmo_complementary_exams', label: 'Exames Complementares', icon: ClipboardList },
  { id: 'ophthalmo_conduct', label: 'Conduta/Prescrição', icon: Target },
  { id: 'ophthalmo_evolution', label: 'Evolução Clínica', icon: Activity },
];

export default function Prontuario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientId = searchParams.get('paciente');
  
  const {
    patient,
    patientLoading,
    config,
    getActiveTabs,
    entries,
    entriesLoading,
    files,
    filesLoading,
    activeAlerts,
    criticalAlerts,
    loading,
    getEntriesForTab,
    getFilesForTab,
  } = useProntuarioData(patientId);

  // LGPD Enforcement and Feature Flags
  const {
    hasValidConsent,
    isEnforcementEnabled,
    shouldBlockEditing,
    shouldHideContent,
    isDigitalSignatureEnabled,
    isAuditLogsEnabled,
    isTabPermissionsEnabled,
    activeTermId,
    activeTermVersion,
    activeTermTitle,
    activeTermContent,
    loading: lgpdLoading,
    granting: lgpdGranting,
    grantConsent,
  } = useLgpdEnforcement(patientId);

  // Digital Signatures
  const {
    signatures,
    fetchSignaturesForPatient,
    getSignatureForRecord,
    isRecordSigned,
    signRecord,
    signing,
  } = useMedicalRecordSignatures();

  // Granular Permissions (only used if tab permissions are enabled)
  const {
    loading: permLoading,
    canViewTab: rawCanViewTab,
    canEditTab: rawCanEditTab,
    canExportTab: rawCanExportTab,
    canSignTab: rawCanSignTab,
    canPerformAction: rawCanPerformAction,
    getVisibleTabs,
    logDeniedAction,
    isAdmin,
  } = useCurrentUserMedicalRecordPermissions();

  // Active appointment check for edit control
  const {
    canEdit: hasActiveAppointment,
    activeAppointment,
    reason: appointmentReason,
    isLoading: appointmentLoading,
  } = useCanEditMedicalRecord(patientId);

  // Active Specialty - determines which tabs are visible
  const {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyKey,
    specialties,
    isFromAppointment: isSpecialtyFromAppointment,
    setActiveSpecialty,
    loading: specialtyLoading,
  } = useActiveSpecialty(patientId);

  // Visão Geral Data - specific for Clínica Geral specialty
  const {
    patient: visaoGeralPatient,
    clinicalData: visaoGeralClinicalData,
    alerts: visaoGeralAlerts,
    lastAppointment: visaoGeralLastAppointment,
    loading: visaoGeralLoading,
  } = useVisaoGeralData(patientId);

  // Visão Geral Data - specific for Psicologia specialty
  const {
    patient: psicologiaPatient,
    summary: psicologiaSummary,
    loading: psicologiaVisaoGeralLoading,
  } = useVisaoGeralPsicologiaData(patientId);

  // Anamnese Data - specific for Clínica Geral specialty
  const {
    currentAnamnese,
    anamneseHistory,
    loading: anamneseLoading,
    saving: anamneseSaving,
    saveAnamnese,
  } = useAnamneseData(patientId);

  // Evoluções Data - specific for Clínica Geral specialty
  const {
    evolucoes,
    loading: evolucoesLoading,
    saving: evolucoesSaving,
    currentProfessionalId,
    currentProfessionalName,
    saveEvolucao,
    signEvolucao,
  } = useEvolucoesData(patientId);

  // Exame Físico Data - specific for Clínica Geral specialty
  const {
    exames: examesFisicos,
    loading: examesFisicosLoading,
    saving: examesFisicosSaving,
    currentProfessionalId: exameProfId,
    currentProfessionalName: exameProfName,
    saveExame: saveExameFisico,
  } = useExameFisicoData(patientId);

  // Conduta Data - specific for Clínica Geral specialty
  const {
    condutas,
    loading: condutasLoading,
    saving: condutasSaving,
    currentProfessionalId: condutaProfId,
    currentProfessionalName: condutaProfName,
    saveConduta,
  } = useCondutaData(patientId);

  // Documentos Data - specific for Clínica Geral specialty
  const {
    documentos,
    loading: documentosLoading,
    uploading: documentosUploading,
    currentProfessionalId: docProfId,
    currentProfessionalName: docProfName,
    uploadDocumento,
    deleteDocumento,
    downloadDocumento,
  } = useDocumentosData(patientId);

  // Alertas Data - specific for Clínica Geral specialty
  const {
    alertas,
    activeAlertas,
    loading: alertasLoading,
    saving: alertasSaving,
    currentProfessionalId: alertaProfId,
    currentProfessionalName: alertaProfName,
    saveAlerta,
    deactivateAlerta,
    reactivateAlerta,
  } = useAlertasData(patientId);

  // Linha do Tempo Data - specific for Clínica Geral specialty
  const {
    eventos: timelineEventos,
    loading: timelineLoading,
  } = useLinhaTempoData(patientId);

  // Diagnósticos Data - specific for Clínica Geral specialty
  const {
    diagnosticos,
    loading: diagnosticosLoading,
    saving: diagnosticosSaving,
    currentProfessionalId: diagProfId,
    saveDiagnostico,
    updateDiagnostico,
  } = useDiagnosticosData(patientId);

  // Prescrições Data - specific for Clínica Geral specialty
  const {
    prescricoes,
    loading: prescricoesLoading,
    saving: prescricoesSaving,
    savePrescricao,
    signPrescricao,
  } = usePrescricoesData(patientId);

  // Wrap permission checks to respect the enable_tab_permissions setting
  const canViewTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanViewTab(tabKey);
  };
  const canEditTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanEditTab(tabKey);
  };
  const canExportTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanExportTab(tabKey);
  };
  const canSignTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanSignTab(tabKey);
  };
  const canPerformAction = (actionKey: ActionKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanPerformAction(actionKey);
  };

  const [activeTab, setActiveTab] = useState("resumo");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedEntryForSignature, setSelectedEntryForSignature] = useState<MedicalRecordEntry | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load signatures when patient changes
  useEffect(() => {
    if (patientId) {
      fetchSignaturesForPatient(patientId);
    }
  }, [patientId, fetchSignaturesForPatient]);

  // Get standard tab key for permission check
  const getStandardTabKey = (tabId: string): TabKey => {
    return TAB_KEY_MAP[tabId] || 'resumo';
  };

  // Check if current tab allows editing (respects LGPD blocking + permissions + active appointment)
  // ADMIN_OWNER can always edit (even without active appointment) as per security requirements
  const canEditCurrentTab = canEditTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && (hasActiveAppointment || isAdmin);
  const canExportCurrentTab = canExportTab(getStandardTabKey(activeTab)) && !shouldBlockEditing;
  const canSignCurrentTab = canSignTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && isDigitalSignatureEnabled && (hasActiveAppointment || isAdmin);

  // Build nav items from configuration or use defaults, filtered by permissions
  const allNavItems = useMemo(() => {
    return getActiveTabs().length > 0
      ? getActiveTabs().map((tab: TabConfig) => ({
          id: tab.key,
          label: tab.name,
          icon: ICON_MAP[tab.icon || 'FileText'] || FileText,
        }))
      : DEFAULT_NAV_ITEMS;
  }, [getActiveTabs]);

  // Filter nav items based on permissions AND active specialty
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      // Check permission first
      const standardKey = getStandardTabKey(item.id);
      if (!canViewTab(standardKey)) return false;
      
      // Check specialty visibility
      return isTabVisibleForSpecialty(item.id, activeSpecialtyKey);
    });
  }, [allNavItems, activeSpecialtyKey]);

  // Set first tab as active when config loads
  // Reset active tab when specialty changes or when current tab is no longer visible
  useEffect(() => {
    if (navItems.length > 0 && !navItems.find(n => n.id === activeTab)) {
      setActiveTab(navItems[0].id);
    }
  }, [navItems, activeTab, activeSpecialtyKey]);

  // Handle search result click
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    setHighlightedId(result.id);
    
    // Clear highlight after 3 seconds
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedId(null);
    }, 3000);
  }, []);

  // Navigate to tab from search
  const handleNavigateToTab = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
  }, []);

  // Render tab content dynamically (wrapped in clinical access guard)
  const renderTabContent = () => {
    // Clinical access is already guarded at component level
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    const tabEntries = getEntriesForTab(activeTab);
    const tabFiles = getFilesForTab(activeTab);

    switch (activeTab) {
      case 'resumo':
        // Render specialty-specific Visão Geral
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <VisaoGeralPsicologiaBlock
              patient={psicologiaPatient}
              summary={psicologiaSummary}
              loading={psicologiaVisaoGeralLoading}
            />
          );
        }
        // Default: Clínica Geral - Visão Geral
        return (
          <VisaoGeralBlock
            patient={visaoGeralPatient}
            clinicalData={visaoGeralClinicalData}
            alerts={visaoGeralAlerts}
            lastAppointment={visaoGeralLastAppointment}
            loading={visaoGeralLoading}
          />
        );

      case 'anamnese':
        // Clínica Geral - Anamnese com versionamento
        return (
          <AnamneseBlock
            currentAnamnese={currentAnamnese}
            anamneseHistory={anamneseHistory}
            loading={anamneseLoading}
            saving={anamneseSaving}
            canEdit={canEditCurrentTab}
            onSave={saveAnamnese}
          />
        );

      case 'exame_fisico':
        // Clínica Geral - Exame Físico (sinais vitais, medidas)
        return (
          <ExameFisicoBlock
            exames={examesFisicos}
            evolucoes={evolucoes}
            loading={examesFisicosLoading}
            saving={examesFisicosSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={exameProfId || undefined}
            currentProfessionalName={exameProfName || undefined}
            onSave={saveExameFisico}
          />
        );

      case 'evolucao':
        // Clínica Geral - Evoluções Clínicas
        return (
          <EvolucoesBlock
            evolucoes={evolucoes}
            loading={evolucoesLoading}
            saving={evolucoesSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={currentProfessionalId || undefined}
            currentProfessionalName={currentProfessionalName || undefined}
            onSave={saveEvolucao}
            onSign={signEvolucao}
          />
        );

      case 'conduta':
        // Clínica Geral - Plano / Conduta
        return (
          <CondutaBlock
            condutas={condutas}
            evolucoes={evolucoes}
            loading={condutasLoading}
            saving={condutasSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={condutaProfId || undefined}
            currentProfessionalName={condutaProfName || undefined}
            onSave={saveConduta}
          />
        );

      case 'exames':
        // Clínica Geral - Exames / Documentos
        return (
          <DocumentosBlock
            documentos={documentos}
            loading={documentosLoading}
            uploading={documentosUploading}
            canEdit={canEditCurrentTab}
            currentProfessionalId={docProfId || undefined}
            currentProfessionalName={docProfName || undefined}
            onUpload={uploadDocumento}
            onDelete={deleteDocumento}
            onDownload={downloadDocumento}
          />
        );

      case 'alertas':
        // Clínica Geral - Alertas Clínicos
        return (
          <AlertasBlock
            alertas={alertas}
            loading={alertasLoading}
            saving={alertasSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={alertaProfId || undefined}
            currentProfessionalName={alertaProfName || undefined}
            onSave={saveAlerta}
            onDeactivate={deactivateAlerta}
            onReactivate={reactivateAlerta}
          />
        );

      case 'historico':
        // Clínica Geral - Linha do Tempo / Histórico
        return (
          <LinhaTempoBlock
            eventos={timelineEventos}
            loading={timelineLoading}
          />
        );

      case 'diagnostico':
        // Clínica Geral - Hipóteses Diagnósticas (CID-10)
        return (
          <DiagnosticosBlock
            diagnosticos={diagnosticos}
            loading={diagnosticosLoading}
            saving={diagnosticosSaving}
            canEdit={canEditCurrentTab}
            onSave={saveDiagnostico}
            onUpdate={updateDiagnostico}
          />
        );

      case 'prescricoes':
        // Clínica Geral - Prescrições estruturadas
        return (
          <PrescricoesBlock
            prescricoes={prescricoes}
            loading={prescricoesLoading}
            saving={prescricoesSaving}
            canEdit={canEditCurrentTab}
            patientName={patient?.full_name}
            onSave={savePrescricao}
            onSign={signPrescricao}
          />
        );

      case 'exames':
      case 'documentos':
      case 'imagens':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
              {canEditCurrentTab ? (
                <Button disabled={!canPerformAction('upload_files')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled className="opacity-50">
                        <ShieldX className="h-4 w-4 mr-2" />
                        Somente Leitura
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!hasActiveAppointment 
                        ? appointmentReason 
                        : 'Você não tem permissão para adicionar arquivos'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {tabFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum arquivo encontrado.</p>
                  {canEditCurrentTab && (
                    <Button className="mt-4" disabled={!canPerformAction('upload_files')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Anexar Arquivo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tabFiles.map((file) => (
                  <Card 
                    key={file.id} 
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all duration-500",
                      highlightedId === file.id && "ring-2 ring-primary bg-primary/5 animate-pulse"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {file.file_type.startsWith('image/') ? (
                          <Image className="h-8 w-8 text-primary" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'alertas':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Alertas Clínicos</h2>
              {canEditCurrentTab ? (
                <Button disabled={!canPerformAction('create_entry')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Alerta
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" disabled className="opacity-50">
                        <ShieldX className="h-4 w-4 mr-2" />
                        Somente Leitura
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!hasActiveAppointment 
                        ? appointmentReason 
                        : 'Você não tem permissão para criar alertas'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {activeAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum alerta ativo.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <Card 
                    key={alert.id} 
                    className={cn(
                      "border-l-4 transition-all duration-500",
                      alert.severity === 'critical' ? "border-l-destructive" :
                      alert.severity === 'warning' ? "border-l-yellow-500" :
                      "border-l-primary",
                      highlightedId === alert.id && "ring-2 ring-primary bg-primary/5 animate-pulse"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'warning' ? 'default' : 'secondary'
                            }>
                              {alert.severity === 'critical' ? 'Crítico' :
                               alert.severity === 'warning' ? 'Atenção' : 'Info'}
                            </Badge>
                            <Badge variant="outline">{alert.alert_type}</Badge>
                          </div>
                          <p className="font-medium">{alert.title}</p>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          )}
                        </div>
                        {canEditCurrentTab && (
                          <Button variant="ghost" size="sm" disabled={!canPerformAction('edit_entry')}>
                            Dispensar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'historico':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Histórico / Auditoria</h2>
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  O histórico de auditoria registra todas as ações realizadas no prontuário.
                </p>
                {config.security.audit_enabled ? (
                  <Badge className="mt-4" variant="default">Auditoria Habilitada</Badge>
                ) : (
                  <Badge className="mt-4" variant="secondary">Auditoria Desabilitada</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'timeline':
        // Get restricted tabs based on permissions
        const restrictedTabs = allNavItems
          .filter(item => !canViewTab(getStandardTabKey(item.id)))
          .map(item => item.id);
        
        return (
          <ClinicalTimeline
            patientId={patientId}
            onNavigateToTab={(tabKey, entityId) => {
              setActiveTab(tabKey);
              if (entityId) {
                setHighlightedId(entityId);
                if (highlightTimeoutRef.current) {
                  clearTimeout(highlightTimeoutRef.current);
                }
                highlightTimeoutRef.current = setTimeout(() => {
                  setHighlightedId(null);
                }, 3000);
              }
            }}
            restrictedTabs={restrictedTabs}
            className="h-full"
          />
        );

      case 'odontograma':
        return (
          <OdontogramModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            professionalId={activeAppointment?.professional_id || ''}
            readOnly={!canEditCurrentTab}
          />
        );

      case 'tooth_procedures':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-indigo-600" />
                Procedimentos por Dente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Lista de procedimentos associados a cada dente será exibida aqui.
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {!hasActiveAppointment && "Inicie um atendimento para registrar procedimentos."}
              </p>
            </CardContent>
          </Card>
        );

      case 'fotos_intraorais':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-600" />
                  Fotos Intraorais
                </CardTitle>
                {canEditCurrentTab && (
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Foto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tabFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma foto intraoral anexada.</p>
                  {canEditCurrentTab && (
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Anexar Primeira Foto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tabFiles.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ===== AESTHETICS MODULES =====
      case 'facial_map':
        return (
          <FacialMapModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
          />
        );

      case 'before_after_photos':
        return (
          <BeforeAfterModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
          />
        );

      case 'aesthetic_consent':
        return (
          <ConsentModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
          />
        );

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Conteúdo da aba "{activeTab}" será exibido aqui.</p>
            </CardContent>
          </Card>
        );
    }
  };

  // No patient selected - show patient selector
  if (!patientId) {
    const handleSelectPatient = (selectedPatientId: string) => {
      setSearchParams({ paciente: selectedPatientId });
    };

    return <PatientSelector onSelectPatient={handleSelectPatient} />;
  }

  // Handler for consent collection
  const handleCollectConsent = () => {
    setConsentDialogOpen(true);
  };

  const handleConfirmConsent = async (): Promise<boolean> => {
    return await grantConsent();
  };

  // Handler for digital signature
  const handleOpenSignature = (entry: MedicalRecordEntry) => {
    setSelectedEntryForSignature(entry);
    setSignatureDialogOpen(true);
  };

  const handleSignRecord = async (signedName: string, signedDocument?: string): Promise<boolean> => {
    if (!selectedEntryForSignature || !patientId) return false;
    
    const success = await signRecord({
      patient_id: patientId,
      professional_id: selectedEntryForSignature.professional_id,
      medical_record_id: selectedEntryForSignature.id,
      signed_name: signedName,
      signed_document: signedDocument,
      content: selectedEntryForSignature.content,
    });

    if (success) {
      setSelectedEntryForSignature(null);
    }
    return success;
  };

  return (
    <ClinicalAccessGuard>
    <div className="flex flex-col h-full relative">
      {/* LGPD Blocking Overlay - shown when consent is required but not granted */}
      {!lgpdLoading && isEnforcementEnabled && !hasValidConsent && patient && (
        <LgpdBlockingOverlay
          patientName={patient.full_name}
          isFullyLocked={shouldHideContent}
          onCollectConsent={handleCollectConsent}
        />
      )}

      {/* Consent Collection Dialog */}
      {activeTermTitle && activeTermContent && activeTermVersion && patient && (
        <ConsentCollectionDialog
          open={consentDialogOpen}
          onOpenChange={setConsentDialogOpen}
          patientName={patient.full_name}
          termTitle={activeTermTitle}
          termVersion={activeTermVersion}
          termContent={activeTermContent}
          onConfirm={handleConfirmConsent}
          isLoading={lgpdGranting}
        />
      )}

      {/* Digital Signature Dialog */}
      {patient && (
        <SignatureDialog
          open={signatureDialogOpen}
          onOpenChange={setSignatureDialogOpen}
          entry={selectedEntryForSignature}
          professionalName="Profissional"
          patientName={patient.full_name}
          hasValidConsent={hasValidConsent}
          onSign={handleSignRecord}
          signing={signing}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/app/pacientes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Prontuário</h1>
            </div>
            
            {/* Specialty Selector */}
            {patientId && (
              <SpecialtySelector
                activeSpecialty={activeSpecialty}
                activeSpecialtyKey={activeSpecialtyKey}
                specialties={specialties}
                isFromAppointment={isSpecialtyFromAppointment}
                onSelect={setActiveSpecialty}
                loading={specialtyLoading}
              />
            )}

            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalAlerts.length} Alerta(s) Crítico(s)
              </Badge>
            )}
            {/* LGPD Status Badge */}
            {isEnforcementEnabled && !hasValidConsent && (
              <Badge variant="outline" className="gap-1 text-destructive border-destructive">
                <Lock className="h-3 w-3" />
                LGPD Pendente
              </Badge>
            )}
            {/* Active Appointment Status Badge */}
            {hasActiveAppointment && activeAppointment && (
              <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                <Activity className="h-3 w-3" />
                Atendimento Ativo
              </Badge>
            )}
            {/* Admin Override Badge - editing allowed without active appointment */}
            {!hasActiveAppointment && !appointmentLoading && isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="default" className="gap-1 bg-amber-600 hover:bg-amber-700">
                      <Shield className="h-3 w-3" />
                      Modo Administrador
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Edição permitida para administradores mesmo sem atendimento ativo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Read-Only Badge - only show for non-admins without active appointment */}
            {!hasActiveAppointment && !appointmentLoading && !isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 text-muted-foreground border-muted-foreground cursor-help">
                      <ShieldX className="h-3 w-3" />
                      Somente Leitura
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{appointmentReason}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!canPerformAction('print_record')}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                </TooltipTrigger>
                {!canPerformAction('print_record') && (
                  <TooltipContent>Você não tem permissão para imprimir</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!canPerformAction('export_pdf')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </TooltipTrigger>
                {!canPerformAction('export_pdf') && (
                  <TooltipContent>Você não tem permissão para exportar</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Link to="/app/config/prontuario">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Config
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        {patientId && (
          <ProntuarioSearchBar
            entries={entries}
            files={files}
            alerts={activeAlerts}
            onResultClick={handleSearchResultClick}
            onNavigateToTab={handleNavigateToTab}
            className="max-w-2xl"
          />
        )}
      </div>

      {/* Patient Header */}
      <div className="p-4 border-b">
        {patientLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : patient ? (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {patient.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{patient.full_name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {patient.birth_date && (
                  <span>{format(new Date(patient.birth_date), "dd/MM/yyyy")}</span>
                )}
                {patient.gender && <span>{patient.gender}</span>}
                {patient.phone && <span>{patient.phone}</span>}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Paciente não encontrado</p>
        )}
      </div>

      {/* Main Content with Sidebar Navigation */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-muted/30 hidden md:block">
          <ScrollArea className="h-full">
            <nav className="p-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    activeTab === item.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'alertas' && activeAlerts.length > 0 && (
                    <Badge 
                      variant={criticalAlerts.length > 0 ? "destructive" : "secondary"}
                      className="text-[10px] px-1.5"
                    >
                      {activeAlerts.length}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden w-full border-b overflow-x-auto sticky top-0 bg-background z-10">
          <div className="flex p-2 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {/* Alerts Banner - shown at top when there are active alerts */}
            {activeAlertas.length > 0 && activeTab !== 'alertas' && (
              <AlertasBanner alertas={activeAlertas} />
            )}
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
    </ClinicalAccessGuard>
  );
}
