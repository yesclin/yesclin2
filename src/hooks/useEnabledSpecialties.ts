import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";
import { toast } from "sonner";

export interface EnabledSpecialty {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  area: string | null;
  is_active: boolean;
}

/**
 * Hook to fetch ONLY enabled (active) specialties for the current clinic.
 * This should be used throughout the system to ensure only enabled specialties
 * can be selected for procedures, appointments, professionals, etc.
 * 
 * Rules enforced:
 * - Only specialties with is_active = true are returned
 * - Only specialties belonging to the current clinic are returned
 * - Disabled specialties cannot be used anywhere in the system
 */
export function useEnabledSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["enabled-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .order("name");
      
      if (error) {
        console.error("Error fetching enabled specialties:", error);
        throw error;
      }
      
      return data as EnabledSpecialty[];
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to fetch ALL specialties (including inactive) for management purposes.
 * Only admins/owners should use this for configuration screens.
 */
export function useAllSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["all-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, created_at")
        .eq("clinic_id", clinic.id)
        .order("is_active", { ascending: false })
        .order("name");
      
      if (error) {
        console.error("Error fetching all specialties:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to enable/disable a specialty.
 * Only owner/admin should have access to this.
 */
export function useToggleSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ specialtyId, isActive }: { specialtyId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("specialties")
        .update({ is_active: isActive })
        .eq("id", specialtyId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      
      toast.success(
        variables.isActive 
          ? "Especialidade habilitada com sucesso" 
          : "Especialidade desabilitada com sucesso"
      );
    },
    onError: (error: Error) => {
      console.error("Error toggling specialty:", error);
      toast.error("Erro ao alterar status da especialidade");
    },
  });
}

/**
 * Hook to create a new specialty.
 * Only owner/admin should have access to this.
 */
export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      area?: string;
      description?: string;
      color?: string;
      is_active?: boolean;
    }) => {
      if (!clinic?.id) throw new Error("Clínica não encontrada");
      
      const { data: specialty, error } = await supabase
        .from("specialties")
        .insert({
          clinic_id: clinic.id,
          name: data.name.trim(),
          area: data.area?.trim() || null,
          description: data.description?.trim() || null,
          color: data.color || null,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return specialty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      
      toast.success("Especialidade criada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error creating specialty:", error);
      toast.error("Erro ao criar especialidade");
    },
  });
}

/**
 * Hook to update a specialty.
 * Only owner/admin should have access to this.
 */
export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: {
        name?: string;
        area?: string;
        description?: string;
        color?: string;
        is_active?: boolean;
      };
    }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.area !== undefined) updateData.area = data.area.trim() || null;
      if (data.description !== undefined) updateData.description = data.description.trim() || null;
      if (data.color !== undefined) updateData.color = data.color || null;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      const { error } = await supabase
        .from("specialties")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic?.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic?.id] });
      
      toast.success("Especialidade atualizada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating specialty:", error);
      toast.error("Erro ao atualizar especialidade");
    },
  });
}

/**
 * Hook to validate if a specialty is enabled for use.
 * Returns false if specialty is not found or inactive.
 */
export function useValidateSpecialty() {
  const { data: enabledSpecialties = [] } = useEnabledSpecialties();
  
  return (specialtyId: string | null | undefined): boolean => {
    if (!specialtyId) return false;
    return enabledSpecialties.some(s => s.id === specialtyId);
  };
}

/**
 * Hook to get the list of enabled specialty IDs for validation.
 */
export function useEnabledSpecialtyIds() {
  const { data: enabledSpecialties = [] } = useEnabledSpecialties();
  return enabledSpecialties.map(s => s.id);
}
