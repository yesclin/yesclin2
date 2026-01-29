import { ShoppingCart, RotateCcw, TrendingUp, Percent, Ban, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  SalesReportSummary, 
  SalesByPeriod, 
  SalesByPaymentMethod,
  SaleReportItem 
} from '@/types/relatorios';

interface SalesReportsProps {
  summary: SalesReportSummary;
  salesByPeriod: SalesByPeriod[];
  salesByPaymentMethod: SalesByPaymentMethod[];
  salesList: SaleReportItem[];
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const chartConfig = {
  vendas: { label: 'Vendas', color: 'hsl(var(--primary))' },
  estornos: { label: 'Estornos', color: '#ef4444' },
  liquido: { label: 'Líquido', color: '#10b981' },
};

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro',
  convenio: 'Convênio',
  boleto: 'Boleto',
  transferencia: 'Transferência',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatPaymentMethod(method: string | null): string {
  if (!method) return '-';
  return paymentLabels[method] || method;
}

export function SalesReports({
  summary,
  salesByPeriod,
  salesByPaymentMethod,
  salesList,
  isLoading,
}: SalesReportsProps) {
  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { 
            title: 'Total em Vendas', 
            value: summary.totalVendas, 
            format: 'currency', 
            icon: <ShoppingCart className="h-5 w-5" /> 
          },
          { 
            title: 'Total Estornado', 
            value: summary.totalEstornos, 
            format: 'currency', 
            icon: <RotateCcw className="h-5 w-5" /> 
          },
          { 
            title: 'Ticket Médio', 
            value: summary.ticketMedio, 
            format: 'currency', 
            icon: <TrendingUp className="h-5 w-5" /> 
          },
          { 
            title: 'Descontos Concedidos', 
            value: summary.descontosConcedidos, 
            format: 'currency', 
            icon: <Percent className="h-5 w-5" /> 
          },
        ]}
      />

      {/* Cards de contagem */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Realizadas</p>
                  <p className="text-2xl font-bold">{summary.quantidadeVendas}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Canceladas</p>
                  <p className="text-2xl font-bold">{summary.quantidadeEstornos}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listagem" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="listagem">Listagem Principal</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="pagamento">Por Pagamento</TabsTrigger>
        </TabsList>

        {/* Listagem Principal Unificada */}
        <TabsContent value="listagem">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatório de Vendas e Estornos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data da Venda</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Forma de Pagamento</TableHead>
                    <TableHead>Usuário Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesList.length > 0 ? (
                    salesList.map((sale) => (
                      <TableRow 
                        key={sale.id} 
                        className={sale.status === 'canceled' 
                          ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30' 
                          : ''
                        }
                      >
                        <TableCell className="text-sm">{formatDate(sale.saleDate)}</TableCell>
                        <TableCell className="text-center">
                          {sale.status === 'canceled' ? (
                            <Badge variant="destructive" className="font-semibold">
                              <Ban className="h-3 w-3 mr-1" />
                              Cancelada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-semibold">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.patientName || <span className="text-muted-foreground italic">Sem paciente</span>}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${sale.status === 'canceled' ? 'text-red-600 dark:text-red-400 line-through' : ''}`}>
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                        <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                        <TableCell>
                          {sale.createdByName || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma venda encontrada no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolução das Vendas */}
        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas e Estornos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Vendas" />
                  <Bar dataKey="estornos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Estornos" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Forma de Pagamento */}
        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px] flex items-center justify-center">
                  {salesByPaymentMethod.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByPaymentMethod}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="totalAmount"
                          nameKey="label"
                          label={({ label, percentage }) => `${label}: ${percentage}%`}
                          labelLine={false}
                        >
                          {salesByPaymentMethod.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma venda no período</p>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forma de Pagamento</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByPaymentMethod.length > 0 ? (
                      salesByPaymentMethod.map((method, index) => (
                        <TableRow key={method.method}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                              />
                              {method.label}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{method.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(method.totalAmount)}</TableCell>
                          <TableCell className="text-right">{method.percentage}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhuma venda no período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
