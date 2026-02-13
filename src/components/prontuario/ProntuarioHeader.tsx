import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Settings, 
  FileText, 
  Lock, 
  Shield, 
  ShieldX, 
  Activity,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInYears, parseISO } from "date-fns";
import { SpecialtySelector } from "./SpecialtySelector";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SpecialtyOption, SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";
import { YESCLIN_SPECIALTY_LABELS } from "@/hooks/prontuario/yesclinSpecialties";

interface PatientInfo {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
}

interface ActiveAppointmentInfo {
  id: string;
  status: string;
}

interface ProntuarioHeaderProps {
  patient: PatientInfo | null;
  patientLoading?: boolean;
  activeSpecialty: SpecialtyOption | null;
  activeSpecialtyKey: SpecialtyKey;
  isSpecialtyFromAppointment: boolean;
  specialtyLoading?: boolean;
  criticalAlertsCount: number;
  isLgpdPending: boolean;
  hasActiveAppointment: boolean;
  activeAppointment: ActiveAppointmentInfo | null;
  appointmentLoading?: boolean;
  appointmentReason?: string;
  isAdmin?: boolean;
  canPrint?: boolean;
  canExport?: boolean;
  onPrint?: () => void;
  onExport?: () => void;
  exporting?: boolean;
  className?: string;
}

/**
 * Cabeçalho unificado do prontuário
 * 
 * Mobile: Layout compacto com menu de ações em dropdown
 * Desktop: Layout completo com todos os elementos visíveis
 */
export function ProntuarioHeader({
  patient,
  patientLoading = false,
  activeSpecialty,
  activeSpecialtyKey,
  isSpecialtyFromAppointment,
  specialtyLoading = false,
  criticalAlertsCount,
  isLgpdPending,
  hasActiveAppointment,
  activeAppointment,
  appointmentLoading = false,
  appointmentReason,
  isAdmin = false,
  canPrint = true,
  canExport = true,
  onPrint,
  onExport,
  exporting = false,
  className,
}: ProntuarioHeaderProps) {
  const isMobile = useIsMobile();

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    try {
      return differenceInYears(new Date(), parseISO(birthDate));
    } catch {
      return null;
    }
  };

  const formatGender = (gender: string | null): string | null => {
    if (!gender) return null;
    const genderMap: Record<string, string> = {
      'M': 'M',
      'F': 'F',
      'male': 'M',
      'female': 'F',
      'masculino': 'M',
      'feminino': 'F',
    };
    return genderMap[gender.toLowerCase()] || gender.charAt(0).toUpperCase();
  };

  if (patientLoading) {
    return (
      <div className={cn("flex flex-col gap-2 p-3 border-b bg-background/95 backdrop-blur sticky top-0 z-20", className)}>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const age = patient ? calculateAge(patient.birth_date) : null;
  const gender = patient ? formatGender(patient.gender) : null;

  // Status badge único para mobile (prioriza o mais importante)
  const getPrimaryStatusBadge = () => {
    if (criticalAlertsCount > 0) {
      return (
        <Badge variant="destructive" className="animate-pulse gap-0.5 h-5 text-[10px] px-1.5">
          <AlertTriangle className="h-3 w-3" />
          {criticalAlertsCount}
        </Badge>
      );
    }
    if (hasActiveAppointment && activeAppointment) {
      return (
        <Badge className="gap-0.5 bg-emerald-600 text-white h-5 text-[10px] px-1.5">
          <Activity className="h-3 w-3" />
          Ativo
        </Badge>
      );
    }
    if (isAdmin) {
      return (
        <Badge className="gap-0.5 bg-amber-600 text-white h-5 text-[10px] px-1.5">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return null;
  };

  // Mobile Layout - Super compacto
  if (isMobile) {
    return (
      <div className={cn(
        "flex flex-col gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur sticky top-0 z-20",
        className
      )}>
        {/* Linha 1: Voltar + Título com Especialidade + Menu */}
        <div className="flex items-center gap-2">
          <Link to="/app/pacientes">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <h1 className="text-sm font-semibold truncate">
                Prontuário <span className="text-muted-foreground font-normal">—</span>{" "}
                <span className="text-primary">{activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral'}</span>
              </h1>
            </div>
          </div>

          {/* Status Badge (único) */}
          {getPrimaryStatusBadge()}

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled={!canPrint} onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canExport || exporting} onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/config/prontuario" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Linha 2: Nome do paciente + Seletor de Especialidade */}
        <div className="flex items-center gap-2 flex-wrap">
          {patient && (
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{patient.full_name}</span>
              {age !== null && <span> ({age}a)</span>}
            </span>
          )}
          
          <SpecialtySelector
            activeSpecialty={activeSpecialty}
            activeSpecialtyKey={activeSpecialtyKey}
            isFromAppointment={isSpecialtyFromAppointment}
            loading={specialtyLoading}
          />
          
          {isLgpdPending && (
            <Badge variant="outline" className="gap-0.5 text-destructive border-destructive h-5 text-[10px] px-1.5">
              <Lock className="h-3 w-3" />
              LGPD
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Desktop/Tablet Layout - Completo
  const displaySpecialtyName = activeSpecialty?.name || YESCLIN_SPECIALTY_LABELS[activeSpecialtyKey] || 'Clínica Geral';

  return (
    <div className={cn(
      "flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20",
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Lado esquerdo: Voltar + Título com Especialidade */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/app/pacientes">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            
            {/* Título: Prontuário — Especialidade */}
            <h1 className="text-lg font-semibold text-foreground">
              Prontuário <span className="text-muted-foreground font-normal">—</span>{" "}
              <span className="text-primary">{displaySpecialtyName}</span>
            </h1>
          </div>

          {/* Seletor de Especialidade (sempre visível) */}
          <SpecialtySelector
            activeSpecialty={activeSpecialty}
            activeSpecialtyKey={activeSpecialtyKey}
            isFromAppointment={isSpecialtyFromAppointment}
            loading={specialtyLoading}
          />

          {/* Info do Paciente */}
          {patient && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground border-l pl-3 ml-1">
              <span className="font-medium text-foreground">{patient.full_name}</span>
              {(age !== null || gender) && (
                <span>
                  ({[age !== null ? `${age}a` : null, gender].filter(Boolean).join(', ')})
                </span>
              )}
            </div>
          )}

          {/* Badges de Status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Alertas Críticos */}
            {criticalAlertsCount > 0 && (
              <Badge variant="destructive" className="animate-pulse gap-1 h-6">
                <AlertTriangle className="h-3 w-3" />
                {criticalAlertsCount}
              </Badge>
            )}

            {/* LGPD Pendente */}
            {isLgpdPending && (
              <Badge variant="outline" className="gap-1 text-destructive border-destructive h-6">
                <Lock className="h-3 w-3" />
                LGPD
              </Badge>
            )}

            {/* Status de Atendimento */}
            {hasActiveAppointment && activeAppointment && (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white h-6">
                <Activity className="h-3 w-3" />
                Ativo
              </Badge>
            )}

            {/* Modo Admin */}
            {!hasActiveAppointment && !appointmentLoading && isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="gap-1 bg-amber-600 hover:bg-amber-700 text-white h-6">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Edição permitida para administradores</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Somente Leitura */}
            {!hasActiveAppointment && !appointmentLoading && !isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 text-muted-foreground h-6">
                      <ShieldX className="h-3 w-3" />
                      Leitura
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{appointmentReason || 'Sem atendimento ativo'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Lado direito: Botões de ação */}
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5"
                  disabled={!canPrint}
                  onClick={onPrint}
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Imprimir</span>
                </Button>
              </TooltipTrigger>
              {!canPrint && (
                <TooltipContent>Sem permissão para imprimir</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2.5"
                  disabled={!canExport || exporting}
                  onClick={onExport}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">{exporting ? 'Exportando...' : 'Exportar PDF'}</span>
                </Button>
              </TooltipTrigger>
              {!canExport && (
                <TooltipContent>Sem permissão para exportar</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Link to="/app/config/prontuario">
            <Button variant="outline" size="sm" className="h-8 px-2.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Config</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
