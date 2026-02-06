/**
 * NUTRIÇÃO - Evolução Corporal
 * 
 * Bloco de visualização (read-only) que exibe a evolução
 * das medidas corporais do paciente ao longo do tempo.
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
import { AvaliacaoEvolutionChart } from './AvaliacaoEvolutionChart';
import type { AvaliacaoNutricional } from '@/hooks/prontuario/nutricao';

interface EvolucaoCorporalBlockProps {
  avaliacoes: AvaliacaoNutricional[];
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

export function EvolucaoCorporalBlock({ avaliacoes, loading }: EvolucaoCorporalBlockProps) {
  // Calcular estatísticas resumidas
  const stats = useMemo(() => {
    if (avaliacoes.length === 0) return null;

    // Ordenar por data (mais recente primeiro já vem do hook)
    const sorted = [...avaliacoes];
    const current = sorted[0];
    const first = sorted[sorted.length - 1];
    
    // Diferença de peso
    const weightDiff = current.weight_kg && first.weight_kg 
      ? current.weight_kg - first.weight_kg 
      : null;
    
    // Diferença de % gordura
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

    return {
      current,
      first,
      totalAvaliacoes: avaliacoes.length,
      daysDiff,
      weightDiff,
      fatDiff,
      muscleDiff,
      waistDiff,
    };
  }, [avaliacoes]);

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

  if (!stats || avaliacoes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Nenhuma avaliação nutricional registrada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Registre avaliações no bloco "Avaliação Nutricional" para visualizar a evolução
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Calendar className="h-3 w-3 mr-1" />
            {stats.daysDiff > 0 ? `${stats.daysDiff} dias` : 'Hoje'}
          </Badge>
          <Badge variant="outline">
            {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
          </Badge>
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
              <span className="text-muted-foreground">Primeira avaliação: </span>
              <span className="font-medium">
                {format(parseISO(stats.first.measurement_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Última avaliação: </span>
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

      {/* Gráficos de Evolução */}
      <AvaliacaoEvolutionChart avaliacoes={avaliacoes} />
    </div>
  );
}
