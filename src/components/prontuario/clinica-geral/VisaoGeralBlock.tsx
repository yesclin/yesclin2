import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Activity,
  FileText,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  Paperclip,
  History
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
  total_evolutions?: number;
  last_evolution_date?: string | null;
  pending_prescriptions?: number;
  total_exams?: number;
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
  onNavigateToModule?: (moduleKey: string) => void;
}

/**
 * Cartão de módulo clicável - navega para a aba correspondente
 */
function ModuleCard({
  title,
  icon: Icon,
  moduleKey,
  onNavigate,
  hasData = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  moduleKey: string;
  onNavigate?: (key: string) => void;
  hasData?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${!hasData ? 'opacity-60' : ''}`}
      onClick={() => onNavigate?.(moduleKey)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
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
 * - Links rápidos para os demais módulos
 * 
 * Este bloco é SOMENTE LEITURA e não substitui evoluções clínicas.
 */
export function VisaoGeralBlock({ 
  patient, 
  clinicalData, 
  alerts,
  lastAppointment,
  loading = false,
  onNavigateToModule
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
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
        <span>Visão geral do paciente — clique nos cartões para acessar os módulos.</span>
      </div>

      {/* Alertas Críticos - Destaque */}
      {criticalAlerts.length > 0 && (
        <Card 
          className="border-destructive/50 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => onNavigateToModule?.('alertas')}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive mb-2">
                  Alertas Críticos ({criticalAlerts.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {criticalAlerts.slice(0, 3).map(alert => (
                    <Badge 
                      key={alert.id} 
                      variant="destructive"
                      className="text-xs"
                    >
                      {alert.title}
                    </Badge>
                  ))}
                  {criticalAlerts.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{criticalAlerts.length - 3} mais
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cabeçalho do Paciente */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {patient.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {calculateAge(patient.birth_date)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formatGender(patient.gender)}
                  </Badge>
                  {clinicalData.blood_type && (
                    <Badge variant="secondary" className="text-xs">
                      {clinicalData.blood_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {lastAppointment && (
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Última consulta</p>
                <p className="font-medium">
                  {format(parseISO(lastAppointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Módulos Conectados - Primários */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Módulos Principais</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Evoluções */}
          <ModuleCard
            title="Evoluções"
            icon={FileText}
            moduleKey="evolucao"
            onNavigate={onNavigateToModule}
            hasData={(clinicalData.total_evolutions ?? 0) > 0}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {clinicalData.total_evolutions ?? 0}
              </span>
              <span className="text-muted-foreground text-sm">registros</span>
            </div>
            {clinicalData.last_evolution_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Última em {format(parseISO(clinicalData.last_evolution_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
            {!clinicalData.total_evolutions && (
              <p className="text-xs text-muted-foreground">Nenhuma evolução registrada</p>
            )}
          </ModuleCard>

          {/* Anamnese */}
          <ModuleCard
            title="Anamnese"
            icon={ClipboardList}
            moduleKey="anamnese"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Histórico médico e queixa principal
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-primary mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToModule?.('anamnese');
              }}
            >
              Acessar anamnese →
            </Button>
          </ModuleCard>

          {/* Plano / Conduta */}
          <ModuleCard
            title="Plano / Conduta"
            icon={Activity}
            moduleKey="conduta"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Orientações e condutas terapêuticas
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-primary mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToModule?.('conduta');
              }}
            >
              Acessar plano →
            </Button>
          </ModuleCard>

          {/* Exame Físico */}
          <ModuleCard
            title="Exame Físico"
            icon={Stethoscope}
            moduleKey="exame_fisico"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Sinais vitais e medidas antropométricas
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-primary mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToModule?.('exame_fisico');
              }}
            >
              Acessar exame físico →
            </Button>
          </ModuleCard>

          {/* Prescrições */}
          <ModuleCard
            title="Prescrições"
            icon={Pill}
            moduleKey="prescricoes"
            onNavigate={onNavigateToModule}
            hasData={(clinicalData.pending_prescriptions ?? 0) > 0 || true}
          >
            {(clinicalData.pending_prescriptions ?? 0) > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{clinicalData.pending_prescriptions} pendentes</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Receitas e medicamentos
              </p>
            )}
          </ModuleCard>

          {/* Diagnóstico */}
          <ModuleCard
            title="Diagnóstico"
            icon={Stethoscope}
            moduleKey="diagnostico"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Hipóteses diagnósticas e CID
            </p>
          </ModuleCard>
        </div>
      </div>

      {/* Grid de Módulos Conectados - Secundários */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Outros Módulos</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Exames / Documentos */}
          <ModuleCard
            title="Exames / Documentos"
            icon={Paperclip}
            moduleKey="exames"
            onNavigate={onNavigateToModule}
            hasData={(clinicalData.total_exams ?? 0) > 0}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {clinicalData.total_exams ?? 0}
              </span>
              <span className="text-muted-foreground text-sm">arquivos</span>
            </div>
          </ModuleCard>

          {/* Linha do Tempo */}
          <ModuleCard
            title="Linha do Tempo"
            icon={History}
            moduleKey="timeline"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Histórico cronológico
            </p>
          </ModuleCard>

          {/* Alertas */}
          <ModuleCard
            title="Alertas"
            icon={AlertTriangle}
            moduleKey="alertas"
            onNavigate={onNavigateToModule}
            hasData={activeAlerts.length > 0}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {activeAlerts.length}
              </span>
              <span className="text-muted-foreground text-sm">ativos</span>
            </div>
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                {criticalAlerts.length} críticos
              </Badge>
            )}
          </ModuleCard>

          {/* Histórico */}
          <ModuleCard
            title="Histórico"
            icon={Clock}
            moduleKey="historico"
            onNavigate={onNavigateToModule}
            hasData={true}
          >
            <p className="text-sm text-muted-foreground">
              Auditoria e registros
            </p>
          </ModuleCard>
        </div>
      </div>

      {/* Card: Informações Clínicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Informações Clínicas Resumidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alergias */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Alergias</span>
              </div>
              {clinicalData.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.allergies.slice(0, 3).map((allergy, idx) => (
                    <Badge 
                      key={idx} 
                      variant="destructive" 
                      className="text-xs"
                    >
                      {allergy}
                    </Badge>
                  ))}
                  {clinicalData.allergies.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{clinicalData.allergies.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma registrada
                </p>
              )}
            </div>

            {/* Doenças Crônicas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Doenças Crônicas</span>
              </div>
              {clinicalData.chronic_diseases.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.chronic_diseases.slice(0, 3).map((disease, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="text-xs"
                    >
                      {disease}
                    </Badge>
                  ))}
                  {clinicalData.chronic_diseases.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{clinicalData.chronic_diseases.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma registrada
                </p>
              )}
            </div>

            {/* Medicamentos de Uso Contínuo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Medicamentos Contínuos</span>
              </div>
              {clinicalData.current_medications.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {clinicalData.current_medications.slice(0, 3).map((med, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="text-xs"
                    >
                      {med}
                    </Badge>
                  ))}
                  {clinicalData.current_medications.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{clinicalData.current_medications.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum registrado
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Clínicos Ativos */}
      {(warningAlerts.length > 0 || infoAlerts.length > 0) && (
        <Card 
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => onNavigateToModule?.('alertas')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Outros Alertas Ativos ({warningAlerts.length + infoAlerts.length})
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...warningAlerts, ...infoAlerts].slice(0, 5).map(alert => (
                <Badge 
                  key={alert.id}
                  variant={alert.severity === 'warning' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {alert.title}
                </Badge>
              ))}
              {warningAlerts.length + infoAlerts.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{warningAlerts.length + infoAlerts.length - 5} mais
                </Badge>
              )}
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
