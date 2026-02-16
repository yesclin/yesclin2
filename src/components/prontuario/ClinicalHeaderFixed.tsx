import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  History,
  Lock,
  MoreVertical,
  Phone,
  Printer,
  Save,
  Shield,
  ShieldX,
  Stethoscope,
  User,
  Maximize2,
  Minimize2,
  ScrollText,
  FileCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInYears, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SpecialtyOption, SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";
import { YESCLIN_SPECIALTY_LABELS } from "@/hooks/prontuario/yesclinSpecialties";

interface PatientInfo {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
}

interface ActiveAppointmentInfo {
  id: string;
  status: string;
  procedure_name?: string | null;
  professional_name?: string | null;
  scheduled_date?: string | null;
  start_time?: string | null;
}

interface ClinicalHeaderFixedProps {
  patient: PatientInfo | null;
  patientLoading?: boolean;
  activeSpecialty: SpecialtyOption | null;
  activeSpecialtyKey: SpecialtyKey;
  hasActiveAppointment: boolean;
  activeAppointment: ActiveAppointmentInfo | null;
  appointmentLoading?: boolean;
  appointmentReason?: string;
  isAdmin?: boolean;
  criticalAlertsCount: number;
  isLgpdPending: boolean;
  // Template info
  templateName?: string | null;
  templateVersion?: number | null;
  // Auto-save
  lastSavedAt?: Date | null;
  isSaving?: boolean;
  // Focus mode
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  // Actions
  canPrint?: boolean;
  canExport?: boolean;
  onPrint?: () => void;
  onExport?: () => void;
  onSave?: () => void;
  onFinish?: () => void;
  exporting?: boolean;
  className?: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  try { return differenceInYears(new Date(), parseISO(birthDate)); } catch { return null; }
};

const formatGender = (gender: string | null): string | null => {
  if (!gender) return null;
  const m: Record<string, string> = { m: "Masc", f: "Fem", male: "Masc", female: "Fem", masculino: "Masc", feminino: "Fem" };
  return m[gender.toLowerCase()] || gender;
};

type StatusKey = "aguardando" | "em_atendimento" | "finalizado" | "cancelado" | string;

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  aguardando: { label: "Aguardando", className: "bg-amber-100 text-amber-800 border-amber-300" },
  em_atendimento: { label: "Em Atendimento", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  finalizado: { label: "Finalizado", className: "bg-muted text-muted-foreground border-border" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-300" },
  confirmado: { label: "Confirmado", className: "bg-blue-100 text-blue-800 border-blue-300" },
  chegou: { label: "Chegou", className: "bg-sky-100 text-sky-800 border-sky-300" },
};

export function ClinicalHeaderFixed({
  patient,
  patientLoading = false,
  activeSpecialty,
  activeSpecialtyKey,
  hasActiveAppointment,
  activeAppointment,
  appointmentLoading = false,
  appointmentReason,
  isAdmin = false,
  criticalAlertsCount,
  isLgpdPending,
  templateName,
  templateVersion,
  lastSavedAt,
  isSaving = false,
  isFocusMode = false,
  onToggleFocusMode,
  canPrint = true,
  canExport = true,
  onPrint,
  onExport,
  onSave,
  onFinish,
  exporting = false,
  className,
}: ClinicalHeaderFixedProps) {
  const isMobile = useIsMobile();
  const age = patient ? calculateAge(patient.birth_date) : null;
  const gender = patient ? formatGender(patient.gender) : null;
  const specialtyName = activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || "Clínica Geral";

  const appointmentStatus = activeAppointment?.status as StatusKey;
  const statusConfig = appointmentStatus ? STATUS_CONFIG[appointmentStatus] || null : null;

  if (patientLoading) {
    return (
      <header className={cn("sticky top-0 z-30 bg-background border-b shadow-sm", className)}>
        <div className="p-3 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </header>
    );
  }

  // ─── MOBILE ──────────────────────────────────────
  if (isMobile) {
    return (
      <header className={cn("sticky top-0 z-30 bg-background border-b shadow-sm", className)}>
        <div className="px-3 py-2 space-y-2">
          {/* Row 1: back + patient name + actions */}
          <div className="flex items-center gap-2">
            <Link to="/app/pacientes">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {patient ? getInitials(patient.full_name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{patient?.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {[age !== null ? `${age}a` : null, gender].filter(Boolean).join(" · ")}
                    {patient?.phone && ` · ${patient.phone}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Status + critical */}
            {statusConfig && (
              <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 border", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            )}
            {criticalAlertsCount > 0 && (
              <Badge variant="destructive" className="animate-pulse h-5 text-[10px] px-1.5">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {criticalAlertsCount}
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onSave}>
                  <Save className="h-4 w-4 mr-2" /> Salvar
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canPrint} onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canExport || exporting} onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" /> Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleFocusMode}>
                  {isFocusMode ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                  {isFocusMode ? "Sair Modo Foco" : "Modo Foco"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onFinish} className="text-primary font-medium">
                  <FileCheck className="h-4 w-4 mr-2" /> Finalizar Atendimento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: specialty + template + auto-save */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground overflow-x-auto">
            <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 flex-shrink-0">
              <Stethoscope className="h-3 w-3" />
              {specialtyName}
            </Badge>
            {templateName && (
              <span className="flex-shrink-0">
                {templateName}
                {templateVersion && <span className="font-mono ml-0.5">v{templateVersion}</span>}
              </span>
            )}
            {lastSavedAt && (
              <span className="ml-auto flex-shrink-0 text-muted-foreground/70">
                {isSaving ? "Salvando..." : `Salvo ${format(lastSavedAt, "HH:mm")}`}
              </span>
            )}
          </div>
        </div>
      </header>
    );
  }

  // ─── DESKTOP / TABLET ─────────────────────────────
  return (
    <header className={cn("sticky top-0 z-30 bg-background border-b shadow-sm", className)}>
      <div className="px-4 py-3">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          {/* Left: Patient + Appointment blocks */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Back */}
            <Link to="/app/pacientes" className="mt-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            {/* Patient block */}
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="h-11 w-11 flex-shrink-0">
                <AvatarFallback className="text-sm bg-primary text-primary-foreground font-semibold">
                  {patient ? getInitials(patient.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold truncate">{patient?.full_name}</h1>
                  {criticalAlertsCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse gap-0.5 h-5 text-[10px]">
                      <AlertTriangle className="h-3 w-3" />
                      {criticalAlertsCount} alerta(s)
                    </Badge>
                  )}
                  {isLgpdPending && (
                    <Badge variant="outline" className="text-destructive border-destructive h-5 text-[10px] gap-0.5">
                      <Lock className="h-3 w-3" /> LGPD
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  {age !== null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {age} anos
                    </span>
                  )}
                  {gender && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {gender}
                    </span>
                  )}
                  {patient?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {patient.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-10 bg-border self-center mx-1" />

            {/* Appointment block */}
            <div className="hidden lg:flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[11px] h-5 gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {specialtyName}
                </Badge>
                {statusConfig && (
                  <Badge variant="outline" className={cn("text-[11px] h-5 border", statusConfig.className)}>
                    {statusConfig.label}
                  </Badge>
                )}
                {!hasActiveAppointment && !appointmentLoading && isAdmin && (
                  <Badge className="bg-amber-600 text-white h-5 text-[10px] gap-0.5">
                    <Shield className="h-3 w-3" /> Admin
                  </Badge>
                )}
                {!hasActiveAppointment && !appointmentLoading && !isAdmin && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-muted-foreground h-5 text-[10px] gap-0.5">
                          <ShieldX className="h-3 w-3" /> Leitura
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{appointmentReason || "Sem atendimento ativo"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {activeAppointment?.professional_name && (
                  <span>{activeAppointment.professional_name}</span>
                )}
                {activeAppointment?.scheduled_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(activeAppointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                    {activeAppointment.start_time && ` ${activeAppointment.start_time.slice(0, 5)}`}
                  </span>
                )}
                {templateName && (
                  <span className="flex items-center gap-1 text-primary/70">
                    <FileText className="h-3 w-3" />
                    {templateName}
                    {templateVersion && <span className="font-mono text-[10px]">v{templateVersion}</span>}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1.5">
            {/* Auto-save indicator */}
            {lastSavedAt && (
              <span className="text-[10px] text-muted-foreground/70 mr-2 hidden xl:inline">
                {isSaving ? "Salvando..." : `Salvo às ${format(lastSavedAt, "HH:mm")}`}
              </span>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={onSave}>
                    <Save className="h-4 w-4" />
                    <span className="hidden xl:inline ml-1.5">Salvar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Salvar manualmente</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={!canPrint} onClick={onPrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5" disabled={!canExport || exporting} onClick={onExport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{exporting ? "Exportando..." : "Exportar PDF"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2.5">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem>
                  <ScrollText className="h-4 w-4 mr-2" /> Receituário
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" /> Atestado
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <History className="h-4 w-4 mr-2" /> Histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleFocusMode}>
                  {isFocusMode ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
                  {isFocusMode ? "Sair Modo Foco" : "Modo Foco"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" className="h-8 ml-1" onClick={onFinish}>
              <FileCheck className="h-4 w-4" />
              <span className="hidden xl:inline ml-1.5">Finalizar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
