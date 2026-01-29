import { Package, TrendingUp, DollarSign, Percent, ShieldX, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/usePermissions';
import type { ProductMarginItem, ProductMarginSummary } from '@/hooks/useProductMarginReport';

interface ProductMarginReportProps {
  items: ProductMarginItem[];
  summary: ProductMarginSummary;
  isLoading: boolean;
}

function formatCurrency(value: number, canView: boolean): string {
  if (!canView) return '•••••';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number, canView: boolean): string {
  if (!canView) return '•••';
  return `${value.toFixed(1)}%`;
}

function getMarginBadge(margin: number) {
  if (margin >= 30) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Alta</Badge>;
  } else if (margin >= 15) {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Média</Badge>;
  } else if (margin > 0) {
    return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Baixa</Badge>;
  } else {
    return <Badge variant="destructive">Negativa</Badge>;
  }
}

function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Acesso Restrito
      </h2>
      <p className="text-muted-foreground max-w-md">
        Você não tem permissão para acessar o <strong>Relatório de Margem por Produto</strong>.
        Entre em contato com o administrador da clínica.
      </p>
    </div>
  );
}

export function ProductMarginReport({ items, summary, isLoading }: ProductMarginReportProps) {
  const { can, isLoading: permissionsLoading } = usePermissions();
  
  const canAccessReport = can('relatorios', 'view');
  const canViewFinancials = can('financeiro', 'view');

  if (isLoading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canAccessReport) {
    return <AccessDeniedMessage />;
  }

  return (
    <div className="space-y-6">
      {/* Warning for hidden financial values */}
      {!canViewFinancials && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <EyeOff className="h-4 w-4" />
              <span className="text-sm">
                Você não tem permissão para visualizar valores financeiros.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resumo de Margem por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Produtos</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalProducts}
              </p>
              <p className="text-xs text-muted-foreground">{summary.totalQuantitySold} un. vendidas</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">Faturamento</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalRevenue, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">receita total</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                  <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm text-muted-foreground">Custo Total</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalCost, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">custo dos produtos</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Lucro Total</span>
              </div>
              <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                {formatCurrency(summary.totalProfit, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">faturamento - custo</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">Margem Média</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPercent(summary.averageMargin, canViewFinancials)}
              </p>
              <p className="text-xs text-muted-foreground">lucro / faturamento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhamento por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd. Vendida</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">Margem (%)</TableHead>
                <TableHead className="text-center">Nível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantitySold}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      {formatCurrency(item.totalRevenue, canViewFinancials)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-400">
                      {formatCurrency(item.totalCost, canViewFinancials)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${item.totalProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {formatCurrency(item.totalProfit, canViewFinancials)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(item.marginPercent, canViewFinancials)}
                    </TableCell>
                    <TableCell className="text-center">
                      {canViewFinancials ? getMarginBadge(item.marginPercent) : '•••'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum produto vendido no período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
