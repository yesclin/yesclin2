import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useLgpdEnforcement } from "@/hooks/lgpd";
import { PatientHeader } from "@/components/prontuario/PatientHeader";
import { ProntuarioSearchBar, type SearchResult } from "@/components/prontuario/ProntuarioSearchBar";
import { LgpdBlockingOverlay } from "@/components/prontuario/LgpdBlockingOverlay";
import { ConsentCollectionDialog } from "@/components/prontuario/ConsentCollectionDialog";
import { SignatureDialog } from "@/components/prontuario/SignatureDialog";
import { SignedRecordBadge } from "@/components/prontuario/SignedRecordBadge";
import { PatientSelector } from "@/components/prontuario/PatientSelector";
import { ClinicalTimeline } from "@/components/prontuario/ClinicalTimeline";
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
  const canEditCurrentTab = canEditTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && hasActiveAppointment;
  const canExportCurrentTab = canExportTab(getStandardTabKey(activeTab)) && !shouldBlockEditing;
  const canSignCurrentTab = canSignTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && isDigitalSignatureEnabled && hasActiveAppointment;

  // Build nav items from configuration or use defaults, filtered by permissions
  const allNavItems = getActiveTabs().length > 0
    ? getActiveTabs().map((tab: TabConfig) => ({
        id: tab.key,
        label: tab.name,
        icon: ICON_MAP[tab.icon || 'FileText'] || FileText,
      }))
    : DEFAULT_NAV_ITEMS;

  // Filter nav items based on permissions
  const navItems = allNavItems.filter(item => {
    const standardKey = getStandardTabKey(item.id);
    return canViewTab(standardKey);
  });

  // Set first tab as active when config loads
  useEffect(() => {
    if (navItems.length > 0 && !navItems.find(n => n.id === activeTab)) {
      setActiveTab(navItems[0].id);
    }
  }, [navItems, activeTab]);

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

  // Render tab content dynamically
  const renderTabContent = () => {
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
        return (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{entries.length}</p>
                      <p className="text-xs text-muted-foreground">Evoluções</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Paperclip className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{files.length}</p>
                      <p className="text-xs text-muted-foreground">Arquivos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", criticalAlerts.length > 0 ? "bg-red-100" : "bg-yellow-100")}>
                      <AlertTriangle className={cn("h-5 w-5", criticalAlerts.length > 0 ? "text-red-600" : "text-yellow-600")} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeAlerts.length}</p>
                      <p className="text-xs text-muted-foreground">Alertas Ativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{config.templates.length}</p>
                      <p className="text-xs text-muted-foreground">Modelos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent entries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimas Evoluções</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma evolução registrada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {entries.slice(0, 5).map((entry) => {
                      const sig = getSignatureForRecord(entry.id);
                      return (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center gap-2">
                              {sig ? (
                                <SignedRecordBadge signature={sig} compact />
                              ) : (
                                <Badge variant={entry.status === 'signed' ? 'default' : 'secondary'}>
                                  {entry.status === 'signed' ? 'Assinado' : 'Rascunho'}
                                </Badge>
                              )}
                              <span className="font-medium capitalize">{entry.entry_type}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!sig && entry.status !== 'signed' && canSignCurrentTab && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenSignature(entry)}
                                      disabled={!canPerformAction('sign_record')}
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Assinar
                                    </Button>
                                  </TooltipTrigger>
                                  {!canPerformAction('sign_record') && (
                                    <TooltipContent>Você não tem permissão para assinar registros</TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button variant="ghost" size="sm">Ver</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts summary */}
            {activeAlerts.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Alertas Clínicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className={cn(
                        "p-3 rounded-lg border",
                        alert.severity === 'critical' ? "bg-red-100 border-red-300" :
                        alert.severity === 'warning' ? "bg-yellow-100 border-yellow-300" :
                        "bg-blue-100 border-blue-300"
                      )}>
                        <p className="font-medium">{alert.title}</p>
                        {alert.description && (
                          <p className="text-sm mt-1">{alert.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'evolucao':
      case 'anamnese':
      case 'diagnostico':
      case 'prescricoes':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
              {canEditCurrentTab ? (
                <Button disabled={!canPerformAction('create_entry')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Entrada
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
                        : 'Você não tem permissão para editar esta aba'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {tabEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum registro encontrado.</p>
                  {canEditCurrentTab && (
                    <Button className="mt-4" disabled={!canPerformAction('create_entry')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Registro
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tabEntries.map((entry) => {
                  const sig = getSignatureForRecord(entry.id);
                  const isSigned = !!sig;
                  
                  return (
                    <Card 
                      key={entry.id} 
                      className={cn(
                        "transition-all duration-500",
                        highlightedId === entry.id && "ring-2 ring-primary bg-primary/5 animate-pulse",
                        isSigned && "border-green-200"
                      )}
                    >
                      <CardContent className="p-4">
                        {/* Show signature info if signed */}
                        {sig && (
                          <div className="mb-4">
                            <SignedRecordBadge signature={sig} />
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {sig ? (
                                <SignedRecordBadge signature={sig} compact />
                              ) : (
                                <Badge variant={entry.status === 'signed' ? 'default' : 'secondary'}>
                                  {entry.status === 'signed' ? 'Assinado' : 'Rascunho'}
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm">{entry.notes}</p>
                            )}
                            {Object.keys(entry.content).length > 0 && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                {Object.entries(entry.content).slice(0, 2).map(([key, value]) => (
                                  <p key={key}><strong>{key}:</strong> {String(value).substring(0, 100)}...</p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!isSigned && entry.status !== 'signed' && canSignCurrentTab && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleOpenSignature(entry)}
                                      disabled={!canPerformAction('sign_record')}
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Assinar
                                    </Button>
                                  </TooltipTrigger>
                                  {!canPerformAction('sign_record') && (
                                    <TooltipContent>Você não tem permissão para assinar registros</TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {!isSigned && canEditCurrentTab && (
                              <Button variant="ghost" size="sm" disabled={!canPerformAction('edit_entry')}>
                                Editar
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">Ver</Button>
                            {isSigned && canExportCurrentTab && (
                              <Button variant="outline" size="sm" disabled={!canPerformAction('export_pdf')}>
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-teal-600" />
                Odontograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Odontograma interativo será exibido aqui durante o atendimento.
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {!hasActiveAppointment && "Inicie um atendimento para editar o odontograma."}
              </p>
            </CardContent>
          </Card>
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
          <div className="flex items-center gap-3">
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
            {!hasActiveAppointment && !appointmentLoading && (
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
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
