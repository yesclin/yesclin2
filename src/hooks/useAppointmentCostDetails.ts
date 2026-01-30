import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConsumedProduct {
  id: string;
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  consumed_at: string;
  source: string;
}

export interface AppointmentCostDetails {
  appointment_id: string;
  procedure_cost: number | null;
  procedure_name: string | null;
  consumed_materials: ConsumedProduct[];
  total_materials_cost: number;
}

/**
 * Hook para buscar detalhes de custo de um atendimento finalizado.
 * Inclui o custo histórico do procedimento e materiais consumidos.
 */
export function useAppointmentCostDetails(appointmentId: string | null) {
  return useQuery({
    queryKey: ['appointment-cost-details', appointmentId],
    queryFn: async (): Promise<AppointmentCostDetails | null> => {
      if (!appointmentId) return null;

      // Get appointment with procedure cost
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          procedure_cost,
          procedures:procedure_id (name)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) throw appointmentError;

      // Get consumed materials for this appointment
      const { data: consumedMaterials, error: materialsError } = await supabase
        .from('material_consumption')
        .select(`
          id,
          material_id,
          quantity,
          unit,
          unit_cost,
          total_cost,
          consumed_at,
          source,
          materials:material_id (name)
        `)
        .eq('appointment_id', appointmentId)
        .order('consumed_at');

      if (materialsError) {
        console.error('Error fetching consumed materials:', materialsError);
      }

      const materials: ConsumedProduct[] = (consumedMaterials || []).map((cm: any) => ({
        id: cm.id,
        material_id: cm.material_id,
        material_name: cm.materials?.name || 'Material desconhecido',
        quantity: Number(cm.quantity) || 0,
        unit: cm.unit || 'unidade',
        unit_cost: Number(cm.unit_cost) || 0,
        total_cost: Number(cm.total_cost) || 0,
        consumed_at: cm.consumed_at,
        source: cm.source || 'procedure',
      }));

      const totalMaterialsCost = materials.reduce((sum, m) => sum + m.total_cost, 0);

      return {
        appointment_id: appointmentId,
        procedure_cost: (appointment as any)?.procedure_cost || null,
        procedure_name: (appointment as any)?.procedures?.name || null,
        consumed_materials: materials,
        total_materials_cost: totalMaterialsCost,
      };
    },
    enabled: !!appointmentId,
  });
}
