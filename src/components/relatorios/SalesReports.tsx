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

      <Tabs defaultValue="evolucao" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="pagamento">Por Pagamento</TabsTrigger>
          <TabsTrigger value="lista">Lista de Vendas</TabsTrigger>
          <TabsTrigger value="estornos">Estornos</TabsTrigger>
        </TabsList>

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

        {/* Lista de Vendas Ativas */}
        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesList.filter(s => s.status === 'active').length > 0 ? (
                    salesList
                      .filter(s => s.status === 'active')
                      .map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-sm">{formatDate(sale.saleDate)}</TableCell>
                          <TableCell className="font-medium">{sale.patientName || '-'}</TableCell>
                          <TableCell>{sale.professionalName || '-'}</TableCell>
                          <TableCell className="text-center">{sale.itemCount}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {sale.discountAmount > 0 ? formatCurrency(sale.discountAmount) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(sale.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {sale.paymentStatus === 'pago' ? 'Pago' : sale.paymentStatus === 'pendente' ? 'Pendente' : sale.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma venda encontrada no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lista de Estornos */}
        <TabsContent value="estornos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendas Canceladas (Estornos)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead className="text-right">Valor Estornado</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesList.filter(s => s.status === 'canceled').length > 0 ? (
                    salesList
                      .filter(s => s.status === 'canceled')
                      .map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="text-sm">{formatDate(sale.saleDate)}</TableCell>
                          <TableCell className="font-medium">{sale.patientName || '-'}</TableCell>
                          <TableCell>{sale.professionalName || '-'}</TableCell>
                          <TableCell className="text-center">{sale.itemCount}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(sale.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">
                              Cancelado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum estorno encontrado no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
