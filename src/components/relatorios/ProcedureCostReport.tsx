import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Hash, BarChart3, Lock } from 'lucide-react';
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
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { ProcedureCostData, ProcedureCostSummary } from '@/hooks/useProcedureCostReport';
import { useFinancialAccessControl } from '@/hooks/useFinancialAccessControl';

interface ProcedureCostReportProps {
  data: ProcedureCostData[];
  summary: ProcedureCostSummary | null;
  isLoading: boolean;
}

const chartConfig = {
  cost: { label: 'Custo', color: 'hsl(var(--primary))' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getCostIntensity(cost: number, maxCost: number): string {
  const ratio = maxCost > 0 ? cost / maxCost : 0;
  if (ratio >= 0.7) return 'hsl(0, 84%, 60%)'; // red - high cost
  if (ratio >= 0.4) return 'hsl(45, 93%, 47%)'; // yellow - medium cost
  return 'hsl(142, 76%, 36%)'; // green - low cost
}

export function ProcedureCostReport({
  data,
  summary,
  isLoading,
}: ProcedureCostReportProps) {
  const { canViewCost, isLoading: accessLoading } = useFinancialAccessControl();

  // Verificar permissão de acesso a custos
  if (!accessLoading && !canViewCost) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para visualizar custos de procedimentos.
          Entre em contato com o administrador da clínica.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  // Preparar dados para o gráfico (top 10 por custo total)
  const chartData = data.slice(0, 10).map(proc => ({
    name: proc.procedureName.length > 25 
      ? proc.procedureName.substring(0, 25) + '...' 
      : proc.procedureName,
    fullName: proc.procedureName,
    totalCost: proc.totalCost,
    averageCost: proc.averageCost,
    quantity: proc.quantity,
  }));

  const maxCost = Math.max(...data.map(p => p.averageCost));

  // KPIs
  const kpiCards = [
    { 
      title: 'Custo Total', 
      value: summary.totalCost, 
      format: 'currency' as const, 
      icon: <DollarSign className="h-5 w-5" /> 
    },
    { 
      title: 'Execuções', 
      value: summary.totalExecutions, 
      format: 'number' as const, 
      icon: <Hash className="h-5 w-5" /> 
    },
    { 
      title: 'Custo Médio/Execução', 
      value: summary.averageCostPerExecution, 
      format: 'currency' as const, 
      icon: <BarChart3 className="h-5 w-5" /> 
    },
    { 
      title: 'Mais Custoso', 
      value: summary.mostExpensive?.name || 'N/A', 
      icon: <TrendingUp className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards columns={4} cards={kpiCards} />

      {/* Alerta de procedimentos sem custo */}
      {summary.proceduresWithoutCost > 0 && (
        <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">Atenção</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {summary.proceduresWithoutCost} procedimento(s) não têm custo registrado nos atendimentos. 
            Verifique se os materiais estão cadastrados corretamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráfico de Custo por Procedimento */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Custo Total por Procedimento</CardTitle>
              <CardDescription>Top 10 procedimentos por custo acumulado no período</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tickFormatter={(v) => formatCurrency(v)} 
                className="text-xs"
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={180} 
                className="text-xs" 
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{d.fullName}</p>
                      <div className="space-y-1 text-sm">
                        <p>Quantidade: {d.quantity} execuções</p>
                        <p>Custo Médio: {formatCurrency(d.averageCost)}</p>
                        <p className="font-medium">Custo Total: {formatCurrency(d.totalCost)}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="totalCost" radius={[0, 4, 4, 0]} name="Custo Total">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCostIntensity(entry.averageCost, maxCost)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          
          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }} />
              <span>Custo Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }} />
              <span>Custo Médio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
              <span>Custo Baixo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Procedimento</CardTitle>
          <CardDescription>Custos históricos registrados no momento de cada execução</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-right">Custo Mínimo</TableHead>
                <TableHead className="text-right">Custo Médio</TableHead>
                <TableHead className="text-right">Custo Máximo</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((proc) => (
                <TableRow key={proc.procedureId}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{proc.procedureName}</span>
                      {!proc.hasCostData && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Sem custo registrado
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{proc.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {proc.hasCostData ? formatCurrency(proc.minCost) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {proc.hasCostData ? formatCurrency(proc.averageCost) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {proc.hasCostData ? formatCurrency(proc.maxCost) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {proc.hasCostData ? formatCurrency(proc.totalCost) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{summary.totalExecutions}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">{formatCurrency(summary.averageCostPerExecution)}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right text-primary">{formatCurrency(summary.totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
