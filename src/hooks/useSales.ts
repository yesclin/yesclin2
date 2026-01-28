import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Sale, SaleFormData, SaleItem, PaymentStatus } from "@/types/inventory";

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

// Fetch sales with filters
export function useSales(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  paymentStatus?: PaymentStatus;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = filters?.startDate || today;
  const endDate = filters?.endDate || today;
  
  return useQuery({
    queryKey: ["sales", startDate, endDate, filters?.patientId, filters?.paymentStatus],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .gte("sale_date", `${startDate}T00:00:00`)
        .lte("sale_date", `${endDate}T23:59:59`)
        .order("sale_date", { ascending: false });
      
      if (filters?.patientId) {
        query = query.eq("patient_id", filters.patientId);
      }
      
      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Sale[];
    },
  });
}

// Fetch single sale with items
export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Sale;
    },
    enabled: !!id,
  });
}

// Create sale with items and update stock
export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SaleFormData) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);
      
      const discountAmount = data.discount_amount || 
        (data.discount_percent ? subtotal * (data.discount_percent / 100) : 0);
      
      const totalAmount = subtotal - discountAmount;
      
      // Generate sale number
      const saleNumber = `V${Date.now().toString(36).toUpperCase()}`;
      
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          clinic_id: clinicId,
          sale_number: saleNumber,
          patient_id: data.patient_id || null,
          professional_id: data.professional_id || null,
          sale_date: data.sale_date || new Date().toISOString(),
          subtotal,
          discount_amount: discountAmount,
          discount_percent: data.discount_percent || 0,
          total_amount: totalAmount,
          payment_method: data.payment_method || null,
          payment_status: data.payment_status || 'pendente',
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Create sale items
      const saleItems = data.items.map(item => ({
        clinic_id: clinicId,
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        total_price: (item.quantity * item.unit_price) - (item.discount_amount || 0),
        notes: item.notes || null,
      }));
      
      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Create stock movements for each item (reduce stock)
      for (const item of data.items) {
        // Get current stock
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity, cost_price")
          .eq("id", item.product_id)
          .single();
        
        if (product) {
          const previousQty = Number(product.stock_quantity) || 0;
          const newQty = previousQty - item.quantity;
          
          // Create movement
          await supabase
            .from("stock_movements")
            .insert({
              clinic_id: clinicId,
              product_id: item.product_id,
              movement_type: 'venda',
              quantity: item.quantity,
              previous_quantity: previousQty,
              new_quantity: newQty,
              unit_cost: product.cost_price || 0,
              total_cost: (product.cost_price || 0) * item.quantity,
              reason: 'Venda para cliente',
              reference_type: 'sale',
              reference_id: sale.id,
              created_by: user?.id || null,
            });
          
          // Update product stock
          await supabase
            .from("products")
            .update({ 
              stock_quantity: newQty,
              updated_at: new Date().toISOString() 
            })
            .eq("id", item.product_id);
        }
      }
      
      // Create finance transaction if payment is made
      if (data.payment_status === 'pago' && totalAmount > 0) {
        const { data: transaction } = await supabase
          .from("finance_transactions")
          .insert({
            clinic_id: clinicId,
            type: 'entrada',
            description: `Venda ${saleNumber}`,
            amount: totalAmount,
            transaction_date: format(new Date(), 'yyyy-MM-dd'),
            payment_method: data.payment_method || null,
            patient_id: data.patient_id || null,
            professional_id: data.professional_id || null,
            origin: 'venda',
            created_by: user?.id || null,
          })
          .select()
          .single();
        
        // Link transaction to sale
        if (transaction) {
          await supabase
            .from("sales")
            .update({ transaction_id: transaction.id })
            .eq("id", sale.id);
        }
      }
      
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating sale:", error);
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });
}

// Update sale payment status
export function useUpdateSaleStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      paymentStatus, 
      paymentMethod 
    }: { 
      id: string; 
      paymentStatus: PaymentStatus;
      paymentMethod?: string;
    }) => {
      const { error } = await supabase
        .from("sales")
        .update({ 
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Status da venda atualizado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar venda: " + error.message);
    },
  });
}

// Cancel sale and restore stock
export function useCancelSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get sale with items
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select(`*, sale_items(*)`)
        .eq("id", id)
        .single();
      
      if (saleError) throw saleError;
      
      // Restore stock for each item
      for (const item of (sale.sale_items || []) as SaleItem[]) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();
        
        if (product) {
          const previousQty = Number(product.stock_quantity) || 0;
          const newQty = previousQty + item.quantity;
          
          // Create return movement
          await supabase
            .from("stock_movements")
            .insert({
              clinic_id: clinicId,
              product_id: item.product_id,
              movement_type: 'devolucao',
              quantity: item.quantity,
              previous_quantity: previousQty,
              new_quantity: newQty,
              reason: 'Cancelamento de venda',
              reference_type: 'sale',
              reference_id: id,
              created_by: user?.id || null,
            });
          
          // Update product stock
          await supabase
            .from("products")
            .update({ 
              stock_quantity: newQty,
              updated_at: new Date().toISOString() 
            })
            .eq("id", item.product_id);
        }
      }
      
      // Update sale status
      const { error: updateError } = await supabase
        .from("sales")
        .update({ 
          payment_status: 'cancelado',
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (updateError) throw updateError;
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      toast.success("Venda cancelada e estoque restaurado!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cancelar venda: " + error.message);
    },
  });
}

// Get sales stats
export function useSalesStats(startDate?: string, endDate?: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const start = startDate || today;
  const end = endDate || today;
  
  return useQuery({
    queryKey: ["sales-stats", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("total_amount, payment_status, discount_amount")
        .gte("sale_date", `${start}T00:00:00`)
        .lte("sale_date", `${end}T23:59:59`);
      
      if (error) throw error;
      
      const stats = {
        totalVendas: 0,
        vendasPagas: 0,
        vendasPendentes: 0,
        descontosConcedidos: 0,
        quantidadeVendas: data.length,
        vendasCanceladas: 0,
      };
      
      data.forEach((s) => {
        const amount = Number(s.total_amount) || 0;
        const discount = Number(s.discount_amount) || 0;
        
        if (s.payment_status === 'cancelado') {
          stats.vendasCanceladas++;
        } else {
          stats.totalVendas += amount;
          stats.descontosConcedidos += discount;
          
          if (s.payment_status === 'pago') {
            stats.vendasPagas += amount;
          } else if (s.payment_status === 'pendente' || s.payment_status === 'parcial') {
            stats.vendasPendentes += amount;
          }
        }
      });
      
      return stats;
    },
  });
}
