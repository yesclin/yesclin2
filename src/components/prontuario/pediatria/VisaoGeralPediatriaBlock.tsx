import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Baby,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  Stethoscope,
  Clock,
  UserCircle,
  Heart
} from 'lucide-react';
import { format, differenceInMonths, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== TYPES =====
export interface PediatricPatientInfo {
  id: string;
  full_name: string;
  birth_date: string;
  gender?: 'M' | 'F' | 'O';
  photo_url?: string;
}

export interface PediatricGuardian {
  id: string;
  full_name: string;
  relationship: string;
  phone?: string;
  is_primary: boolean;
}

export interface PediatricAlert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  is_active: boolean;
}

export interface PediatricDiagnosis {
  id: string;
  description: string;
  cid_code?: string;
  is_active: boolean;
  diagnosed_at: string;
}

export interface LastAppointmentInfo {
  id: string;
  date: string;
  professional_name: string;
  type?: string;
}

// ===== UTILITIES =====
function formatAge(birthDate: string): { text: string; months: number } {
  const birth = parseISO(birthDate);
  const now = new Date();
  const totalMonths = differenceInMonths(now, birth);
  const years = differenceInYears(now, birth);
  
  if (totalMonths < 1) {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `${days} dias`, months: 0 };
  }
  
  if (totalMonths < 24) {
    return { text: `${totalMonths} meses`, months: totalMonths };
  }
  
  const remainingMonths = totalMonths % 12;
  if (remainingMonths === 0) {
    return { text: `${years} anos`, months: totalMonths };
  }
  
  return { text: `${years} anos e ${remainingMonths} meses`, months: totalMonths };
}

function getGenderLabel(gender?: string): string {
  switch (gender) {
    case 'M': return 'Masculino';
    case 'F': return 'Feminino';
    case 'O': return 'Outro';
    default: return 'Não informado';
  }
}

function getRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Há ${Math.floor(diffDays / 30)} meses`;
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

// ===== PROPS =====
interface VisaoGeralPediatriaBlockProps {
  patient: PediatricPatientInfo;
  guardian?: PediatricGuardian;
  alerts?: PediatricAlert[];
  activeDiagnosis?: PediatricDiagnosis[];
  lastAppointment?: LastAppointmentInfo;
  onNavigateToModule?: (moduleKey: string) => void;
  className?: string;
}

// ===== COMPONENT =====
export function VisaoGeralPediatriaBlock({
  patient,
  guardian,
  alerts = [],
  activeDiagnosis = [],
  lastAppointment,
  onNavigateToModule,
  className,
}: VisaoGeralPediatriaBlockProps) {
  const age = useMemo(() => formatAge(patient.birth_date), [patient.birth_date]);
  
  const activeAlerts = useMemo(() => alerts.filter(a => a.is_active), [alerts]);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Baby className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Visão Geral</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Identity */}
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {patient.photo_url ? (
              <img 
                src={patient.photo_url} 
                alt={patient.full_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <Baby className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{patient.full_name}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="secondary" className="font-normal">
                <Calendar className="h-3 w-3 mr-1" />
                {age.text}
              </Badge>
              <Badge variant="outline" className="font-normal">
                <User className="h-3 w-3 mr-1" />
                {getGenderLabel(patient.gender)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nascimento: {format(parseISO(patient.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <Separator />

        {/* Guardian Info */}
        {guardian && (
          <div 
            className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => onNavigateToModule?.('responsavel')}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <UserCircle className="h-4 w-4" />
              <span>Responsável Legal</span>
              {guardian.is_primary && (
                <Badge variant="outline" className="text-xs">Principal</Badge>
              )}
            </div>
            <div className="font-medium">{guardian.full_name}</div>
            <div className="text-sm text-muted-foreground">{guardian.relationship}</div>
            {guardian.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Phone className="h-3 w-3" />
                {guardian.phone}
              </div>
            )}
          </div>
        )}

        {!guardian && (
          <div className="p-3 rounded-lg border border-dashed border-muted-foreground/30 text-center">
            <UserCircle className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1" />
            <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado</p>
          </div>
        )}

        {/* Last Appointment */}
        {lastAppointment && (
          <div 
            className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => onNavigateToModule?.('timeline')}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span>Última Consulta</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{getRelativeDate(lastAppointment.date)}</div>
                <div className="text-sm text-muted-foreground">
                  {lastAppointment.professional_name}
                  {lastAppointment.type && ` • ${lastAppointment.type}`}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {format(parseISO(lastAppointment.date), 'dd/MM/yy', { locale: ptBR })}
              </Badge>
            </div>
          </div>
        )}

        {/* Active Diagnosis */}
        {activeDiagnosis.length > 0 && (
          <div 
            className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => onNavigateToModule?.('diagnostico')}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Stethoscope className="h-4 w-4" />
              <span>Diagnósticos Ativos</span>
              <Badge variant="secondary" className="text-xs">{activeDiagnosis.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {activeDiagnosis.slice(0, 3).map((diagnosis) => (
                <div key={diagnosis.id} className="flex items-center gap-2">
                  <Heart className="h-3 w-3 text-primary" />
                  <span className="text-sm font-medium">{diagnosis.description}</span>
                  {diagnosis.cid_code && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {diagnosis.cid_code}
                    </Badge>
                  )}
                </div>
              ))}
              {activeDiagnosis.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{activeDiagnosis.length - 3} outros diagnósticos
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pediatric Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Alertas Pediátricos</span>
            </div>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="p-2 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-destructive">{alert.title}</span>
                </div>
              ))}
              {warningAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="p-2 rounded-lg border border-warning/30 bg-warning/10 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm font-medium">{alert.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAlerts.length === 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <p className="text-sm text-primary">Nenhum alerta ativo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default VisaoGeralPediatriaBlock;
