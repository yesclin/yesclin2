import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// HELPER: Get clinic_id from current user
// =============================================
async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

export interface ProcedureProductCost {
  procedure_id: string;
  product_count: number;
  total_cost: number;
}

/**
 * Hook para calcular o custo total de produtos por procedimento.
 * Usa cost_price dos produtos para calcular o custo real.
 * Atualiza automaticamente quando produtos são adicionados/removidos/alterados.
 */
export function useProcedureProductCosts() {
  return useQuery({
    queryKey: ['procedure-product-costs'],
    queryFn: async (): Promise<Record<string, ProcedureProductCost>> => {
      const clinicId = await getClinicId();
      
      // Buscar todos os vínculos procedimento-produto com custo
      const { data: procedureProducts, error } = await supabase
        .from('procedure_products')
        .select(`
          procedure_id,
          quantity,
          products:product_id (cost_price)
        `)
        .eq('clinic_id', clinicId);
        
      if (error) throw error;
      
      // Agregar custos por procedimento
      const costMap: Record<string, ProcedureProductCost> = {};
      
      (procedureProducts || []).forEach((pp: any) => {
        const procedureId = pp.procedure_id;
        const costPrice = pp.products?.cost_price || 0;
        const itemCost = pp.quantity * costPrice;
        
        if (!costMap[procedureId]) {
          costMap[procedureId] = {
            procedure_id: procedureId,
            product_count: 0,
            total_cost: 0,
          };
        }
        
        costMap[procedureId].product_count++;
        costMap[procedureId].total_cost += itemCost;
      });
      
      return costMap;
    },
  });
}

/**
 * Hook para obter o custo de produtos de um procedimento específico.
 */
export function useProcedureProductCost(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-product-cost', procedureId],
    queryFn: async (): Promise<ProcedureProductCost | null> => {
      if (!procedureId) return null;
      
      const { data: procedureProducts, error } = await supabase
        .from('procedure_products')
        .select(`
          quantity,
          products:product_id (cost_price)
        `)
        .eq('procedure_id', procedureId);
        
      if (error) throw error;
      
      let totalCost = 0;
      let productCount = 0;
      
      (procedureProducts || []).forEach((pp: any) => {
        const costPrice = pp.products?.cost_price || 0;
        totalCost += pp.quantity * costPrice;
        productCount++;
      });
      
      return {
        procedure_id: procedureId,
        product_count: productCount,
        total_cost: totalCost,
      };
    },
    enabled: !!procedureId,
  });
}
