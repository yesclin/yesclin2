import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User,
  Calendar,
  AlertTriangle,
  Pill,
  Heart,
  Clock,
  ShieldAlert,
  Activity
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Dados do paciente para exibição na Visão Geral
 */
export interface PatientBasicData {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
}

/**
 * Dados clínicos resumidos
 */
export interface ClinicalSummaryData {
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  blood_type?: string | null;
}

/**
 * Alerta clínico ativo
 */
export interface ClinicalAlertItem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  alert_type: string;
  description?: string | null;
  is_active: boolean;
}

/**
 * Última consulta registrada
 */
export interface LastAppointmentData {
  id: string;
  scheduled_date: string;
  professional_name?: string;
  specialty_name?: string;
  procedure_name?: string;
  status: string;
}

interface VisaoGeralBlockProps {
  patient: PatientBasicData | null;
  clinicalData: ClinicalSummaryData;
  alerts: ClinicalAlertItem[];
  lastAppointment: LastAppointmentData | null;
  loading?: boolean;
}

/**
 * VISÃO GERAL - Bloco exclusivo para Clínica Geral
 * 
 * Exibe um resumo rápido e de leitura fácil com:
 * - Dados básicos do paciente (idade, sexo)
 * - Alergias registradas
 * - Doenças crônicas
 * - Medicamentos de uso contínuo
 * - Última consulta
 * - Alertas clínicos ativos
 * 
 * Este bloco é SOMENTE LEITURA e não substitui evoluções clínicas.
 */
export function VisaoGeralBlock({ 
  patient, 
  clinicalData, 
  alerts,
  lastAppointment,
  loading = false
}: VisaoGeralBlockProps) {
  
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = activeAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = activeAlerts.filter(a => a.severity === 'info');

  const calculateAge = (birthDate: string | null): string => {
    if (!birthDate) return 'Não informada';
    try {
      const years = differenceInYears(new Date(), parseISO(birthDate));
      return `${years} anos`;
    } catch {
      return 'Não informada';
    }
  };

  const formatGender = (gender: string | null): string => {
    if (!gender) return 'Não informado';
    const genderMap: Record<string, string> = {
      'M': 'Masculino',
      'F': 'Feminino',
      'male': 'Masculino',
      'female': 'Feminino',
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'outro': 'Outro',
      'other': 'Outro',
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  const formatLastAppointmentDate = (date: string): string => {
    try {
      return format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Selecione um paciente para visualizar o resumo clínico</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com aviso de leitura */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Activity className="h-4 w-4" />
        <span>Visão geral do paciente — somente leitura. Use a aba "Evoluções" para registros clínicos.</span>
      </div>

      {/* Alertas Críticos - Destaque */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                  Alertas Críticos ({criticalAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {criticalAlerts.map(alert => (
                    <Badge 
                      key={alert.id} 
                      variant="destructive"
                      className="text-xs"
                    >
                      {alert.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Dados Básicos do Paciente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Dados do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Idade</p>
                <p className="font-medium">{calculateAge(patient.birth_date)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sexo</p>
                <p className="font-medium">{formatGender(patient.gender)}</p>
              </div>
              {clinicalData.blood_type && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo Sanguíneo</p>
                  <Badge variant="outline" className="font-medium">
                    {clinicalData.blood_type}
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Última Consulta */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Última Consulta</span>
              </div>
              {lastAppointment ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">
                    {formatLastAppointmentDate(lastAppointment.scheduled_date)}
                  </p>
                  {lastAppointment.professional_name && (
                    <p className="text-xs text-muted-foreground">
                      com {lastAppointment.professional_name}
                    </p>
                  )}
                  {lastAppointment.specialty_name && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {lastAppointment.specialty_name}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma consulta registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card: Informações Clínicas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Informações Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alergias */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Alergias</span>
              </div>
              {clinicalData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.allergies.map((allergy, idx) => (
                    <Badge 
                      key={idx} 
                      variant="destructive" 
                      className="text-xs"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma alergia registrada
                </p>
              )}
            </div>

            <Separator />

            {/* Doenças Crônicas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Doenças Crônicas</span>
              </div>
              {clinicalData.chronic_diseases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.chronic_diseases.map((disease, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {disease}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma doença crônica registrada
                </p>
              )}
            </div>

            <Separator />

            {/* Medicamentos de Uso Contínuo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Medicamentos de Uso Contínuo</span>
              </div>
              {clinicalData.current_medications.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.current_medications.map((med, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                    >
                      {med}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum medicamento de uso contínuo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Clínicos Ativos */}
      {(warningAlerts.length > 0 || infoAlerts.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Outros Alertas Ativos ({warningAlerts.length + infoAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Warning Alerts */}
              {warningAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-yellow-800 dark:text-yellow-300">
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                        {alert.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Info Alerts */}
              {infoAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                >
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-blue-800 dark:text-blue-300">
                      {alert.title}
                    </p>
                    {alert.description && (
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                        {alert.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio de alertas */}
      {activeAlerts.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Nenhum alerta clínico ativo</p>
        </div>
      )}
    </div>
  );
}
