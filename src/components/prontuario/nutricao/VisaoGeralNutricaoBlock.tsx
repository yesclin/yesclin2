/**
 * NUTRIÇÃO - Visão Geral
 * 
 * Bloco de visão geral do paciente para a especialidade Nutrição.
 * Exibe dados básicos, objetivo nutricional, status do acompanhamento e alertas ativos.
 * Inclui atalhos rápidos para ações comuns.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Apple, 
  Scale, 
  Target, 
  Calendar,
  Activity,
  User,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  Ruler,
  UtensilsCrossed,
  Plus
} from 'lucide-react';
import { format, differenceInYears, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  OBJETIVO_NUTRICIONAL_LABELS, 
  STATUS_ACOMPANHAMENTO_LABELS,
  type NutricaoPatientData, 
  type NutricaoSummaryData, 
  type NutricaoAlert 
} from '@/hooks/prontuario/nutricao';
import type { TipoEvolucaoNutricao } from '@/hooks/prontuario/nutricao/evolucaoTemplates';

interface VisaoGeralNutricaoBlockProps {
  patient: NutricaoPatientData | null;
  summary: NutricaoSummaryData;
  alerts: NutricaoAlert[];
  loading: boolean;
  canEdit?: boolean;
  onQuickAction?: (action: 'avaliacao_antropometrica' | 'plano_alimentar' | 'nova_evolucao', templateId?: TipoEvolucaoNutricao) => void;
}

/**
 * Retorna a cor do badge de IMC baseado na classificação
 */
function getIMCBadgeVariant(classificacao: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!classificacao) return 'outline';
  
  if (classificacao === 'Peso normal') return 'default';
  if (classificacao === 'Abaixo do peso') return 'secondary';
  if (classificacao.includes('Sobrepeso')) return 'secondary';
  return 'destructive';
}

/**
 * Retorna o ícone e estilo do alerta baseado na severidade
 */
function getAlertIcon(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

/**
 * Retorna a cor do badge de status do acompanhamento
 */
function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ativo':
      return 'default';
    case 'pausado':
      return 'secondary';
    case 'finalizado':
      return 'outline';
    default:
      return 'outline';
  }
}

export function VisaoGeralNutricaoBlock({
  patient,
  summary,
  alerts,
  loading,
  canEdit = false,
  onQuickAction,
}: VisaoGeralNutricaoBlockProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar os dados nutricionais.</p>
        </CardContent>
      </Card>
    );
  }

  const idade = patient.birth_date 
    ? differenceInYears(new Date(), new Date(patient.birth_date))
    : null;

  const diasDesdeUltimaConsulta = summary.ultima_consulta
    ? differenceInDays(new Date(), new Date(summary.ultima_consulta))
    : null;

  return (
    <div className="space-y-4">
      {/* Alertas Nutricionais Ativos */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`border-l-4 ${
                alert.severity === 'critical' 
                  ? 'border-l-red-500 bg-red-50/30' 
                  : alert.severity === 'warning'
                    ? 'border-l-amber-500 bg-amber-50/30'
                    : 'border-l-blue-500 bg-blue-50/30'
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    {alert.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    )}
                  </div>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.alert_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cabeçalho do Paciente */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full shrink-0">
                <Apple className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {idade ? `${idade} anos` : 'Idade não informada'}
                  </Badge>
                  {patient.gender && (
                    <Badge variant="outline" className="text-xs">
                      {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : patient.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(summary.status_acompanhamento)}>
                {STATUS_ACOMPANHAMENTO_LABELS[summary.status_acompanhamento]}
              </Badge>
              {summary.plano_ativo && (
                <Badge variant="default" className="bg-green-600">
                  Plano Ativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Atalhos Rápidos */}
      {canEdit && onQuickAction && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onQuickAction('avaliacao_antropometrica', 'avaliacao_antropometrica')}
                className="flex items-center gap-2"
              >
                <Ruler className="h-4 w-4" />
                Nova Avaliação Antropométrica
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onQuickAction('plano_alimentar', 'plano_alimentar')}
                className="flex items-center gap-2"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Novo Plano Alimentar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onQuickAction('nova_evolucao')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Evolução Nutricional
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Informações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Objetivo Nutricional */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objetivo Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.objetivo ? (
              <>
                <p className="text-lg font-semibold">
                  {OBJETIVO_NUTRICIONAL_LABELS[summary.objetivo]}
                </p>
                {summary.objetivo_descricao && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {summary.objetivo_descricao}
                  </p>
                )}
                {summary.peso_meta_kg && (
                  <Badge variant="outline" className="mt-2">
                    Meta: {summary.peso_meta_kg} kg
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Objetivo não definido
              </p>
            )}
          </CardContent>
        </Card>

        {/* Última Consulta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Última Consulta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.ultima_consulta ? (
              <>
                <p className="text-lg font-semibold">
                  {format(new Date(summary.ultima_consulta), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                {diasDesdeUltimaConsulta !== null && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {diasDesdeUltimaConsulta === 0 
                      ? 'Hoje'
                      : diasDesdeUltimaConsulta === 1 
                        ? 'Ontem' 
                        : `Há ${diasDesdeUltimaConsulta} dias`
                    }
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhuma consulta realizada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Total de Consultas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Acompanhamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.total_consultas}</span>
              <span className="text-muted-foreground">
                {summary.total_consultas === 1 ? 'consulta' : 'consultas'}
              </span>
            </div>
            {summary.data_inicio_plano && (
              <p className="text-sm text-muted-foreground mt-1">
                Início: {format(new Date(summary.data_inicio_plano), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Peso Atual e IMC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Peso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {summary.peso_atual_kg ? `${summary.peso_atual_kg}` : '--'}
              </span>
              <span className="text-muted-foreground">kg</span>
            </div>
            {summary.variacao_peso_kg !== null && summary.variacao_peso_kg !== 0 && (
              <p className={`text-sm mt-1 ${summary.variacao_peso_kg > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {summary.variacao_peso_kg > 0 ? '+' : ''}{summary.variacao_peso_kg} kg desde o início
              </p>
            )}
          </CardContent>
        </Card>

        {/* IMC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              IMC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {summary.imc ? summary.imc.toFixed(1) : '--'}
              </span>
              <span className="text-muted-foreground">kg/m²</span>
            </div>
            {summary.classificacao_imc && (
              <Badge variant={getIMCBadgeVariant(summary.classificacao_imc)} className="mt-2">
                {summary.classificacao_imc}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Altura */}
        {summary.altura_cm && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Altura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {(summary.altura_cm / 100).toFixed(2)}
                </span>
                <span className="text-muted-foreground">m</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.altura_cm} cm
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
