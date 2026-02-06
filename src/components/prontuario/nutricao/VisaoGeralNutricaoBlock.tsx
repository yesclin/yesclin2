/**
 * NUTRIÇÃO - Visão Geral
 * 
 * Bloco de visão geral do paciente para a especialidade Nutrição.
 * Exibe peso atual, IMC, objetivo nutricional e resumo do acompanhamento.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Apple, 
  Scale, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Activity,
  User,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NutricaoPatientData, NutricaoSummaryData, LastMeasurement } from '@/hooks/prontuario/nutricao';

interface VisaoGeralNutricaoBlockProps {
  patient: NutricaoPatientData | null;
  summary: NutricaoSummaryData;
  lastMeasurement: LastMeasurement | null;
  loading: boolean;
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
 * Retorna o ícone de tendência de peso
 */
function getWeightTrendIcon(variacao: number | null) {
  if (variacao === null || variacao === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (variacao > 0) return <ArrowUp className="h-4 w-4 text-red-500" />;
  return <ArrowDown className="h-4 w-4 text-green-500" />;
}

export function VisaoGeralNutricaoBlock({
  patient,
  summary,
  lastMeasurement,
  loading,
}: VisaoGeralNutricaoBlockProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
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

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Paciente */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Apple className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {idade ? `${idade} anos` : 'Idade não informada'}
                  {patient.gender && ` • ${patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Feminino' : patient.gender}`}
                </p>
              </div>
            </div>
            {summary.plano_ativo && (
              <Badge variant="default" className="bg-green-600">
                Plano Ativo
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Peso Atual */}
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
            {summary.variacao_peso_kg !== null && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                {getWeightTrendIcon(summary.variacao_peso_kg)}
                <span className={summary.variacao_peso_kg > 0 ? 'text-red-500' : summary.variacao_peso_kg < 0 ? 'text-green-500' : 'text-muted-foreground'}>
                  {summary.variacao_peso_kg > 0 ? '+' : ''}{summary.variacao_peso_kg} kg desde o início
                </span>
              </div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Altura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {summary.altura_cm ? (summary.altura_cm / 100).toFixed(2) : '--'}
              </span>
              <span className="text-muted-foreground">m</span>
            </div>
            {summary.altura_cm && (
              <p className="text-sm text-muted-foreground mt-2">
                {summary.altura_cm} cm
              </p>
            )}
          </CardContent>
        </Card>

        {/* Consultas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{summary.total_consultas}</span>
              <span className="text-muted-foreground">realizadas</span>
            </div>
            {summary.ultima_consulta && (
              <p className="text-sm text-muted-foreground mt-2">
                Última: {format(new Date(summary.ultima_consulta), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Meta de Peso (se houver) */}
        {summary.peso_meta_kg && summary.peso_atual_kg && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progresso para a Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">
                  {summary.peso_atual_kg} kg
                </span>
                <span className="text-sm font-medium text-green-600">
                  Meta: {summary.peso_meta_kg} kg
                </span>
              </div>
              <Progress 
                value={Math.min(100, Math.abs((summary.peso_atual_kg - summary.peso_meta_kg) / summary.peso_meta_kg) * 100)} 
                className="h-2"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Última Avaliação */}
      {lastMeasurement && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dados da Última Avaliação</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(new Date(lastMeasurement.measurement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {lastMeasurement.body_fat_percent && (
                <div>
                  <p className="text-muted-foreground">Gordura Corporal</p>
                  <p className="font-medium">{lastMeasurement.body_fat_percent}%</p>
                </div>
              )}
              {lastMeasurement.waist_cm && (
                <div>
                  <p className="text-muted-foreground">Cintura</p>
                  <p className="font-medium">{lastMeasurement.waist_cm} cm</p>
                </div>
              )}
              {lastMeasurement.hip_cm && (
                <div>
                  <p className="text-muted-foreground">Quadril</p>
                  <p className="font-medium">{lastMeasurement.hip_cm} cm</p>
                </div>
              )}
              {lastMeasurement.waist_cm && lastMeasurement.hip_cm && (
                <div>
                  <p className="text-muted-foreground">RCQ</p>
                  <p className="font-medium">
                    {(lastMeasurement.waist_cm / lastMeasurement.hip_cm).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
