import { useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3, DollarSign, Calendar, Users, Building2, User, Package, MessageSquare, Briefcase, ShoppingCart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRelatoriosMockData } from '@/hooks/useRelatoriosMockData';
import { useSalesReport } from '@/hooks/useSalesReport';
import { useSalesReportOptions } from '@/hooks/useSalesReportOptions';
import { ReportFiltersBar } from '@/components/relatorios/ReportFiltersBar';
import { SalesReportFilters } from '@/components/relatorios/SalesReportFilters';
import { FinancialReports } from '@/components/relatorios/FinancialReports';
import { AppointmentReports } from '@/components/relatorios/AppointmentReports';
import { PatientReports } from '@/components/relatorios/PatientReports';
import { InsuranceReports } from '@/components/relatorios/InsuranceReports';
import { ProfessionalReports } from '@/components/relatorios/ProfessionalReports';
import { StockReports } from '@/components/relatorios/StockReports';
import { CommunicationReports } from '@/components/relatorios/CommunicationReports';
import { ExecutiveReport } from '@/components/relatorios/ExecutiveReport';
import { SalesReports } from '@/components/relatorios/SalesReports';
import { toast } from 'sonner';
import type { ReportFilters } from '@/types/relatorios';
import type { SalesReportFilters as SalesFiltersType } from '@/types/salesReport';

const reportTabs = [
  { value: 'gerencial', label: 'Gerencial', icon: Briefcase },
  { value: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { value: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { value: 'agenda', label: 'Agenda', icon: Calendar },
  { value: 'pacientes', label: 'Pacientes', icon: Users },
  { value: 'convenios', label: 'Convênios', icon: Building2 },
  { value: 'profissionais', label: 'Profissionais', icon: User },
  { value: 'estoque', label: 'Estoque', icon: Package },
  { value: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
];

export default function Relatorios() {
  const today = new Date();
  
  // Filtros gerais para outros relatórios
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  });

  // Filtros específicos para vendas
  const [salesFilters, setSalesFilters] = useState<SalesFiltersType>({
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
    status: 'all',
  });

  const [activeTab, setActiveTab] = useState('gerencial');

  const data = useRelatoriosMockData(filters);
  const salesReport = useSalesReport(salesFilters);
  const salesOptions = useSalesReportOptions();

  const handleExportPDF = () => {
    toast.success('Exportando relatório em PDF...');
  };

  const handleExportExcel = () => {
    toast.success('Exportando relatório em Excel...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">
              Visualize relatórios de atendimento, financeiro e indicadores da clínica
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Filtros - condicional baseado na tab */}
        {activeTab === 'vendas' ? (
          <SalesReportFilters
            filters={salesFilters}
            onFiltersChange={setSalesFilters}
            products={salesOptions.products}
            patients={salesOptions.patients}
            users={salesOptions.users}
          />
        ) : (
          <ReportFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            professionals={data.professionals}
            insurances={data.insurances}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
        )}

        <TabsContent value="gerencial">
          <ExecutiveReport summary={data.executiveSummary} financialTrend={data.financialData} />
        </TabsContent>

        <TabsContent value="financeiro">
          <FinancialReports
            financialData={data.financialData}
            revenueByProfessional={data.revenueByProfessional}
            revenueByProcedure={data.revenueByProcedure}
            revenueByPaymentMethod={data.revenueByPaymentMethod}
            packagesReport={data.packagesReport}
            totals={data.totals}
            filters={filters}
          />
        </TabsContent>

        <TabsContent value="vendas">
          <SalesReports
            summary={salesReport.summary}
            salesByPeriod={salesReport.salesByPeriod}
            salesByPaymentMethod={salesReport.salesByPaymentMethod}
            salesList={salesReport.salesList}
            isLoading={salesReport.isLoading}
          />
        </TabsContent>

        <TabsContent value="agenda">
          <AppointmentReports
            appointmentData={data.appointmentData}
            attendanceByProfessional={data.attendanceByProfessional}
            attendanceBySpecialty={data.attendanceBySpecialty}
            totals={data.totals}
          />
        </TabsContent>

        <TabsContent value="pacientes">
          <PatientReports
            patientData={data.patientData}
            patientRetention={data.patientRetention}
            patientsByInsurance={data.patientsByInsurance}
          />
        </TabsContent>

        <TabsContent value="convenios">
          <InsuranceReports insuranceReport={data.insuranceReport} />
        </TabsContent>

        <TabsContent value="profissionais">
          <ProfessionalReports professionalPerformance={data.professionalPerformance} />
        </TabsContent>

        <TabsContent value="estoque">
          <StockReports stockConsumption={data.stockConsumption} />
        </TabsContent>

        <TabsContent value="comunicacao">
          <CommunicationReports communicationData={data.communicationData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
