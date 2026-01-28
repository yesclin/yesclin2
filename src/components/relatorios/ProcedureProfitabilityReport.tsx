import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ProcedureProfitabilityData, ProfitabilitySummary } from '@/hooks/useProcedureProfitabilityReport';
import { useMarginAlerts, useMarginAlertConfig } from '@/hooks/useMarginAlerts';
import { useClinicData } from '@/hooks/useClinicData';

interface ProcedureProfitabilityReportProps {
  data: ProcedureProfitabilityData[];
  summary: ProfitabilitySummary | null;
  isLoading: boolean;
}

const chartConfig = {
  margin: { label: 'Margem', color: 'hsl(var(--primary))' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getMarginStatus(marginPercentage: number): { color: string; label: string; bgClass: string } {
  if (marginPercentage >= 40) {
    return { color: 'text-green-600', label: 'Positiva', bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
  } else if (marginPercentage >= 15) {
    return { color: 'text-yellow-600', label: 'Atenção', bgClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
  } else {
    return { color: 'text-red-600', label: 'Negativa', bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
  }
}

function getBarColor(marginPercentage: number): string {
  if (marginPercentage >= 40) return 'hsl(142, 76%, 36%)'; // green
  if (marginPercentage >= 15) return 'hsl(45, 93%, 47%)'; // yellow
  return 'hsl(0, 84%, 60%)'; // red
}

export function ProcedureProfitabilityReport({
  data,
  summary,
  isLoading,
}: ProcedureProfitabilityReportProps) {
  const { clinic } = useClinicData();
  const clinicId = clinic?.id;
  
  const { data: marginAlerts = [] } = useMarginAlerts(clinicId || null);
  const { data: marginConfig } = useMarginAlertConfig(clinicId || null);
  
  // Create a set of procedure IDs that have margin alerts
  const proceduresWithAlerts = new Set(
    marginAlerts.map(a => a.procedureId)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!summary || data.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Sem dados</AlertTitle>
        <AlertDescription>
          Não há atendimentos finalizados com procedimentos no período selecionado.
          Verifique os filtros ou selecione outro período.
        </AlertDescription>
      </Alert>
    );
  }

  // Preparar dados para o gráfico de barras
  const chartData = data.slice(0, 10).map(proc => ({
    name: proc.procedureName.length > 20 
      ? proc.procedureName.substring(0, 20) + '...' 
      : proc.procedureName,
    fullName: proc.procedureName,
    margin: Math.round(proc.marginPercentage),
    marginValue: proc.marginValue,
    revenue: proc.totalRevenue,
    cost: proc.totalCost,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs de Resumo */}
      <ReportKPICards
        columns={5}
        cards={[
          { 
            title: 'Quanto Faturou', 
            value: summary.totalRevenue, 
            format: 'currency', 
            icon: <DollarSign className="h-5 w-5" /> 
          },
          { 
            title: 'Quanto Custou', 
            value: summary.totalCost, 
            format: 'currency', 
            icon: <TrendingDown className="h-5 w-5" /> 
          },
          { 
            title: 'Quanto Sobrou', 
            value: summary.totalMargin, 
            format: 'currency',
            variation: Math.round(summary.marginPercentage),
            icon: <TrendingUp className="h-5 w-5" /> 
          },
          { 
            title: 'Mais Rentável', 
            value: summary.mostProfitable?.name || 'N/A', 
            icon: <Target className="h-5 w-5" /> 
          },
          { 
            title: 'Menor Margem', 
            value: summary.leastProfitable?.name || 'N/A', 
            icon: <AlertTriangle className="h-5 w-5" /> 
          },
        ]}
      />

      {/* Alerta de procedimentos sem custo */}
      {summary.proceduresWithoutCost > 0 && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">Atenção</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {summary.proceduresWithoutCost} procedimento(s) não têm custo cadastrado. 
            Cadastre materiais e kits em <strong>Configurações → Materiais</strong> para cálculos precisos.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico de Margem por Procedimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Margem por Procedimento</CardTitle>
              <CardDescription>Top 10 procedimentos por volume de atendimentos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[-20, 100]} 
                tickFormatter={(v) => `${v}%`} 
                className="text-xs"
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150} 
                className="text-xs" 
                tick={{ fontSize: 11 }}
              />
              <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
              <ReferenceLine x={15} stroke="hsl(45, 93%, 47%)" strokeDasharray="5 5" strokeWidth={1} />
              <ReferenceLine x={40} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" strokeWidth={1} />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{data.fullName}</p>
                      <div className="space-y-1 text-sm">
                        <p>Faturamento: {formatCurrency(data.revenue)}</p>
                        <p>Custo: {formatCurrency(data.cost)}</p>
                        <p className="font-medium">Margem: {formatCurrency(data.marginValue)} ({data.margin}%)</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="margin" radius={[0, 4, 4, 0]} name="Margem %">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.margin)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          
          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
              <span>≥ 40% Positiva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }} />
              <span>15-40% Atenção</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
              <span>&lt; 15% Negativa</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Procedimento</CardTitle>
          <CardDescription>Todos os procedimentos realizados no período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Faturou</TableHead>
                <TableHead className="text-right">Custou</TableHead>
                <TableHead className="text-right">Sobrou</TableHead>
                <TableHead className="text-center">Margem</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((proc) => {
                const status = getMarginStatus(proc.marginPercentage);
                const hasAlert = proceduresWithAlerts.has(proc.procedureId);
                const alertData = marginAlerts.find(a => a.procedureId === proc.procedureId);
                
                return (
                  <TableRow 
                    key={proc.procedureId} 
                    className={cn(hasAlert && alertData?.alertType === 'critical' && 'bg-destructive/5')}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{proc.procedureName}</span>
                          {hasAlert && alertData?.alertType === 'critical' && (
                            <Badge variant="destructive" className="text-xs">
                              Prejuízo
                            </Badge>
                          )}
                          {hasAlert && alertData?.alertType === 'warning' && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Atenção
                            </Badge>
                          )}
                        </div>
                        {!proc.hasCostDefined && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Custo não definido
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{proc.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(proc.totalRevenue)}</TableCell>
                    <TableCell className="text-right">
                      {proc.hasCostDefined ? formatCurrency(proc.totalCost) : '-'}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", status.color)}>
                      {proc.hasCostDefined ? formatCurrency(proc.marginValue) : '-'}
                    </TableCell>
                    <TableCell className={cn("text-center font-medium", status.color)}>
                      {proc.hasCostDefined ? `${Math.round(proc.marginPercentage)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {proc.hasCostDefined ? (
                        <Badge variant="outline" className={status.bgClass}>
                          {proc.marginPercentage >= 40 && <TrendingUp className="h-3 w-3 mr-1" />}
                          {proc.marginPercentage < 15 && <TrendingDown className="h-3 w-3 mr-1" />}
                          {status.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Incompleto
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
