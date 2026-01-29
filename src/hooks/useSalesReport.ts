import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ReportFilters } from "@/types/relatorios";

// =============================================
// TYPES
// =============================================

interface SaleRow {
  id: string;
  sale_date: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  discount_amount: number | null;
  patient_id: string | null;
  professional_id: string | null;
  patients: { id: string; full_name: string } | null;
  professionals: { id: string; full_name: string } | null;
  sale_items: { id: string }[];
}

interface FinanceTransactionRow {
  id: string;
  type: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  origin: string | null;
  patient_id: string | null;
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useSalesReport(filters: ReportFilters) {
  const startDate = format(filters.startDate, "yyyy-MM-dd");
  const endDate = format(filters.endDate, "yyyy-MM-dd");

  // Query vendas ativas
  const salesQuery = useQuery({
    queryKey: ["sales-report", startDate, endDate, "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          payment_status,
          payment_method,
          total_amount,
          discount_amount,
          patient_id,
          professional_id,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(id)
        `)
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)
        .neq("payment_status", "cancelado")
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return (data || []) as SaleRow[];
    },
  });

  // Query vendas canceladas (estornos)
  const canceledSalesQuery = useQuery({
    queryKey: ["sales-report", startDate, endDate, "canceled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          payment_status,
          payment_method,
          total_amount,
          discount_amount,
          patient_id,
          professional_id,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(id)
        `)
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)
        .eq("payment_status", "cancelado")
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return (data || []) as SaleRow[];
    },
  });

  // Query transações financeiras relacionadas a vendas
  const transactionsQuery = useQuery({
    queryKey: ["sales-report-transactions", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("id, type, amount, transaction_date, payment_method, origin, patient_id")
        .gte("transaction_date", `${startDate}T00:00:00`)
        .lte("transaction_date", `${endDate}T23:59:59`)
        .or("origin.eq.sale,origin.eq.sale_reversal");

      if (error) throw error;
      return (data || []) as FinanceTransactionRow[];
    },
  });

  // Processar dados
  const isLoading = salesQuery.isLoading || canceledSalesQuery.isLoading || transactionsQuery.isLoading;
  const isError = salesQuery.isError || canceledSalesQuery.isError || transactionsQuery.isError;

  const activeSales = salesQuery.data || [];
  const canceledSales = canceledSalesQuery.data || [];
  const allSales = [...activeSales, ...canceledSales];

  // Sumário
  const summary = {
    totalVendas: activeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    totalEstornos: canceledSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    vendasAtivas: activeSales.length,
    vendasCanceladas: canceledSales.length,
    quantidadeVendas: activeSales.length,
    quantidadeEstornos: canceledSales.length,
    descontosConcedidos: activeSales.reduce((sum, s) => sum + (Number(s.discount_amount) || 0), 0),
    ticketMedio: activeSales.length > 0
      ? activeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) / activeSales.length
      : 0,
  };

  // Dados por período
  const days = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
  const salesByPeriod = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayActive = activeSales.filter((s) => s.sale_date.startsWith(dateStr));
    const dayCanceled = canceledSales.filter((s) => s.sale_date.startsWith(dateStr));
    
    const vendas = dayActive.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const estornos = dayCanceled.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    return {
      period: format(day, "dd/MM", { locale: ptBR }),
      vendas,
      estornos,
      liquido: vendas - estornos,
    };
  });

  // Por forma de pagamento
  const paymentMethodMap: Record<string, { label: string; total: number; count: number }> = {};
  const paymentLabels: Record<string, string> = {
    pix: "PIX",
    credito: "Cartão de Crédito",
    debito: "Cartão de Débito",
    dinheiro: "Dinheiro",
    convenio: "Convênio",
    boleto: "Boleto",
    transferencia: "Transferência",
  };

  activeSales.forEach((sale) => {
    const method = sale.payment_method || "outros";
    if (!paymentMethodMap[method]) {
      paymentMethodMap[method] = { label: paymentLabels[method] || method, total: 0, count: 0 };
    }
    paymentMethodMap[method].total += Number(sale.total_amount) || 0;
    paymentMethodMap[method].count += 1;
  });

  const totalSalesAmount = summary.totalVendas;
  const salesByPaymentMethod = Object.entries(paymentMethodMap).map(([method, data]) => ({
    method,
    label: data.label,
    totalAmount: data.total,
    count: data.count,
    percentage: totalSalesAmount > 0 ? Math.round((data.total / totalSalesAmount) * 100) : 0,
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // Lista de vendas formatada
  const salesList = allSales.map((sale) => ({
    id: sale.id,
    saleDate: sale.sale_date,
    status: sale.payment_status === "cancelado" ? "canceled" as const : "active" as const,
    patientId: sale.patient_id,
    patientName: sale.patients?.full_name || null,
    totalAmount: Number(sale.total_amount) || 0,
    discountAmount: Number(sale.discount_amount) || 0,
    netAmount: (Number(sale.total_amount) || 0) - (Number(sale.discount_amount) || 0),
    paymentMethod: sale.payment_method,
    paymentStatus: sale.payment_status,
    itemCount: sale.sale_items?.length || 0,
    professionalId: sale.professional_id,
    professionalName: sale.professionals?.full_name || null,
  }));

  return {
    isLoading,
    isError,
    summary,
    salesByPeriod,
    salesByPaymentMethod,
    salesList,
    activeSales: activeSales.length,
    canceledSales: canceledSales.length,
  };
}
