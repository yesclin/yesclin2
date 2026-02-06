/**
 * NUTRIÇÃO - Evolução Corporal
 * 
 * Bloco de visualização (read-only) que exibe a evolução
 * das medidas corporais do paciente ao longo do tempo.
 * 
 * Consome dados de:
 * - Avaliação Antropométrica (body_measurements)
 * - Evoluções Nutricionais (clinical_evolutions com peso_atual_kg)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Scale,
  Activity,
  Target,
  Calendar,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { AvaliacaoNutricional, EvolucaoNutricao } from '@/hooks/prontuario/nutricao';

interface EvolucaoCorporalBlockProps {
  /** Avaliações antropométricas (body_measurements) */
  avaliacoes: AvaliacaoNutricional[];
  /** Evoluções nutricionais (clinical_evolutions) - opcional */
  evolucoes?: EvolucaoNutricao[];
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; value: number; unit: string };
  icon: React.ReactNode;
  invertTrendColors?: boolean;
}

function StatCard({ title, value, subtitle, trend, icon, invertTrendColors = false }: StatCardProps) {
  const getTrendColor = () => {
    if (!trend || trend.direction === 'stable') return 'text-muted-foreground';
    const isPositive = invertTrendColors 
      ? trend.direction === 'down' 
      : trend.direction === 'up';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
      ? TrendingDown 
      : Minus;

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-background rounded-lg">
              {icon}
            </div>
            {trend && trend.direction !== 'stable' && (
              <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {trend.direction === 'up' ? '+' : '-'}
                  {trend.value.toFixed(1)} {trend.unit}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mescla dados de avaliações antropométricas com pesos das evoluções
 * para criar uma visão unificada da evolução corporal
 */
function mergeDataSources(
  avaliacoes: AvaliacaoNutricional[],
  evolucoes: EvolucaoNutricao[]
): AvaliacaoNutricional[] {
  // Criar um mapa de datas para evitar duplicatas
  const dateMap = new Map<string, AvaliacaoNutricional>();

  // Adicionar avaliações antropométricas (fonte primária - dados completos)
  avaliacoes.forEach(av => {
    const dateKey = av.measurement_date.split('T')[0]; // normalizar para YYYY-MM-DD
    dateMap.set(dateKey, av);
  });

  // Adicionar pesos das evoluções (se não houver avaliação na mesma data)
  evolucoes.forEach(ev => {
    if (ev.peso_atual_kg) {
      const dateKey = ev.created_at.split('T')[0];
      
      // Se já existe uma avaliação completa nesta data, pular
      if (dateMap.has(dateKey)) return;
      
      // Criar entrada sintética apenas com peso
      const syntheticEntry: AvaliacaoNutricional = {
        id: `ev-${ev.id}`,
        patient_id: ev.patient_id,
        clinic_id: ev.clinic_id,
        measurement_date: ev.created_at,
        recorded_by: ev.professional_id,
        appointment_id: ev.appointment_id,
        weight_kg: ev.peso_atual_kg,
        height_cm: null,
        bmi: null,
        waist_cm: null,
        hip_cm: null,
        chest_cm: null,
        arm_left_cm: null,
        arm_right_cm: null,
        thigh_left_cm: null,
        thigh_right_cm: null,
        calf_left_cm: null,
        calf_right_cm: null,
        body_fat_percent: null,
        muscle_mass_kg: null,
        custom_measurements: null,
        notes: ev.observacoes_peso,
        created_at: ev.created_at,
      };
      
      dateMap.set(dateKey, syntheticEntry);
    }
  });

  // Converter para array e ordenar por data decrescente
  return Array.from(dateMap.values()).sort((a, b) => 
    new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
  );
}

export function EvolucaoCorporalBlock({ avaliacoes, evolucoes = [], loading }: EvolucaoCorporalBlockProps) {
  // Mesclar dados de ambas as fontes
  const mergedData = useMemo(() => 
    mergeDataSources(avaliacoes, evolucoes),
    [avaliacoes, evolucoes]
  );

  // Calcular estatísticas resumidas
  const stats = useMemo(() => {
    if (mergedData.length === 0) return null;

    // Ordenar por data (mais recente primeiro)
    const sorted = [...mergedData];
    const current = sorted[0];
    const first = sorted[sorted.length - 1];
    
    // Diferença de peso
    const weightDiff = current.weight_kg && first.weight_kg 
      ? current.weight_kg - first.weight_kg 
      : null;
    
    // Diferença de % gordura (apenas de avaliações completas)
    const fatDiff = current.body_fat_percent && first.body_fat_percent
      ? current.body_fat_percent - first.body_fat_percent
      : null;

    // Diferença de massa muscular
    const muscleDiff = current.muscle_mass_kg && first.muscle_mass_kg
      ? current.muscle_mass_kg - first.muscle_mass_kg
      : null;

    // Diferença de cintura
    const waistDiff = current.waist_cm && first.waist_cm
      ? current.waist_cm - first.waist_cm
      : null;

    // Período de acompanhamento
    const daysDiff = differenceInDays(
      parseISO(current.measurement_date),
      parseISO(first.measurement_date)
    );

    // Contar fontes de dados
    const fromAvaliacoes = avaliacoes.length;
    const fromEvolucoes = evolucoes.filter(e => e.peso_atual_kg).length;

    return {
      current,
      first,
      totalRegistros: mergedData.length,
      fromAvaliacoes,
      fromEvolucoes,
      daysDiff,
      weightDiff,
      fatDiff,
      muscleDiff,
      waistDiff,
    };
  }, [mergedData, avaliacoes.length, evolucoes]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!stats || mergedData.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Nenhum dado de evolução corporal disponível
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Registre avaliações antropométricas ou inclua peso nas evoluções
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTrend = (diff: number | null, unit: string): { direction: 'up' | 'down' | 'stable'; value: number; unit: string } | undefined => {
    if (diff === null || Math.abs(diff) < 0.1) return undefined;
    return {
      direction: diff > 0 ? 'up' : 'down',
      value: Math.abs(diff),
      unit,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evolução Corporal</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            <Calendar className="h-3 w-3 mr-1" />
            {stats.daysDiff > 0 ? `${stats.daysDiff} dias` : 'Hoje'}
          </Badge>
          <Badge variant="outline">
            {stats.totalRegistros} {stats.totalRegistros === 1 ? 'registro' : 'registros'}
          </Badge>
          {stats.fromAvaliacoes > 0 && stats.fromEvolucoes > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.fromAvaliacoes} aval. + {stats.fromEvolucoes} evol.
            </Badge>
          )}
        </div>
      </div>

      {/* Resumo em Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Peso Atual"
          value={stats.current.weight_kg ? `${stats.current.weight_kg} kg` : '--'}
          subtitle={stats.current.bmi ? `IMC: ${stats.current.bmi}` : undefined}
          trend={formatTrend(stats.weightDiff, 'kg')}
          icon={<Scale className="h-4 w-4 text-primary" />}
          invertTrendColors
        />
        
        <StatCard
          title="% Gordura"
          value={stats.current.body_fat_percent ? `${stats.current.body_fat_percent}%` : '--'}
          trend={formatTrend(stats.fatDiff, '%')}
          icon={<Activity className="h-4 w-4 text-destructive" />}
          invertTrendColors
        />
        
        <StatCard
          title="Massa Muscular"
          value={stats.current.muscle_mass_kg ? `${stats.current.muscle_mass_kg} kg` : '--'}
          trend={formatTrend(stats.muscleDiff, 'kg')}
          icon={<Target className="h-4 w-4 text-primary" />}
        />
        
        <StatCard
          title="Cintura"
          value={stats.current.waist_cm ? `${stats.current.waist_cm} cm` : '--'}
          trend={formatTrend(stats.waistDiff, 'cm')}
          icon={<Activity className="h-4 w-4 text-accent-foreground" />}
          invertTrendColors
        />
      </div>

      {/* Período de acompanhamento */}
      {stats.daysDiff > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Primeiro registro: </span>
              <span className="font-medium">
                {format(parseISO(stats.first.measurement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Último registro: </span>
              <span className="font-medium">
                {format(parseISO(stats.current.measurement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {stats.first.weight_kg && stats.current.weight_kg && (
              <div>
                <span className="text-muted-foreground">Variação de peso: </span>
                <span className={`font-medium ${stats.weightDiff && stats.weightDiff < 0 ? 'text-green-600' : stats.weightDiff && stats.weightDiff > 0 ? 'text-red-600' : ''}`}>
                  {stats.first.weight_kg} kg → {stats.current.weight_kg} kg
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráfico de Evolução do Peso - exibe apenas se houver mais de 1 registro */}
      {mergedData.length > 1 && <WeightEvolutionChart data={mergedData} />}
    </div>
  );
}

/**
 * Gráfico de linha para evolução do peso
 */
interface WeightChartData {
  date: string;
  dateFormatted: string;
  weight_kg: number | null;
}

function WeightEvolutionChart({ data }: { data: AvaliacaoNutricional[] }) {
  // Preparar dados para o gráfico (ordem cronológica)
  const chartData: WeightChartData[] = useMemo(() => {
    return [...data]
      .filter(d => d.weight_kg !== null)
      .reverse() // ordem cronológica ascendente
      .map(d => ({
        date: d.measurement_date,
        dateFormatted: format(parseISO(d.measurement_date), "dd/MM/yy", { locale: ptBR }),
        weight_kg: d.weight_kg,
      }));
  }, [data]);

  // Não renderizar se menos de 2 pontos
  if (chartData.length < 2) return null;

  // Calcular média para linha de referência
  const validWeights = chartData.filter(d => d.weight_kg !== null).map(d => d.weight_kg as number);
  const avgWeight = validWeights.reduce((a, b) => a + b, 0) / validWeights.length;

  // Calcular domínio do eixo Y com margem
  const minWeight = Math.min(...validWeights);
  const maxWeight = Math.max(...validWeights);
  const yDomainMin = Math.floor(minWeight - 2);
  const yDomainMax = Math.ceil(maxWeight + 2);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      const entry = payload[0] as { value: number };
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-primary">
            {entry.value?.toFixed(1)} kg
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Evolução do Peso
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {chartData.length} registros
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateFormatted" 
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[yDomainMin, yDomainMax]}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={avgWeight} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="weight_kg"
                name="Peso (kg)"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ 
                  r: 5, 
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))"
                }}
                activeDot={{ 
                  r: 7, 
                  fill: "hsl(var(--primary))",
                  strokeWidth: 3,
                  stroke: "hsl(var(--background))"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span>Peso registrado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />
            <span>Média: {avgWeight.toFixed(1)} kg</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
