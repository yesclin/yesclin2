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
  AlertTriangle 
} from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInYears, parseISO } from "date-fns";
import { SpecialtySelector } from "./SpecialtySelector";
import { cn } from "@/lib/utils";
import type { SpecialtyOption, SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";

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
  specialties: SpecialtyOption[];
  isSpecialtyFromAppointment: boolean;
  specialtyLoading?: boolean;
  onSelectSpecialty: (specialtyId: string | null) => void;
  criticalAlertsCount: number;
  isLgpdPending: boolean;
  hasActiveAppointment: boolean;
  activeAppointment: ActiveAppointmentInfo | null;
  appointmentLoading?: boolean;
  appointmentReason?: string;
  isAdmin?: boolean;
  canPrint?: boolean;
  canExport?: boolean;
  className?: string;
}

/**
 * Cabeçalho unificado do prontuário
 * 
 * Exibe de forma compacta:
 * - Nome do paciente + idade
 * - Status do atendimento
 * - Especialidade ativa (com seletor)
 * - Botões de ação: Imprimir, Exportar, Config
 */
export function ProntuarioHeader({
  patient,
  patientLoading = false,
  activeSpecialty,
  activeSpecialtyKey,
  specialties,
  isSpecialtyFromAppointment,
  specialtyLoading = false,
  onSelectSpecialty,
  criticalAlertsCount,
  isLgpdPending,
  hasActiveAppointment,
  activeAppointment,
  appointmentLoading = false,
  appointmentReason,
  isAdmin = false,
  canPrint = true,
  canExport = true,
  className,
}: ProntuarioHeaderProps) {

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
      <div className={cn("flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20", className)}>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const age = patient ? calculateAge(patient.birth_date) : null;
  const gender = patient ? formatGender(patient.gender) : null;

  return (
    <div className={cn(
      "flex flex-col gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-20",
      className
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Lado esquerdo: Voltar + Info do paciente */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/app/pacientes">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            
            {/* Nome + Idade + Sexo */}
            {patient ? (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">
                  {patient.full_name}
                </h1>
                {(age !== null || gender) && (
                  <span className="text-sm text-muted-foreground">
                    ({[age !== null ? `${age}a` : null, gender].filter(Boolean).join(', ')})
                  </span>
                )}
              </div>
            ) : (
              <h1 className="text-lg font-semibold text-foreground">Prontuário</h1>
            )}
          </div>

          {/* Seletor de Especialidade */}
          {patient && (
            <SpecialtySelector
              activeSpecialty={activeSpecialty}
              activeSpecialtyKey={activeSpecialtyKey}
              specialties={specialties}
              isFromAppointment={isSpecialtyFromAppointment}
              onSelect={onSelectSpecialty}
              loading={specialtyLoading}
            />
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
                  disabled={!canExport}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Exportar</span>
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
