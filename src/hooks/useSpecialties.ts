import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  area: string | null;
  is_active: boolean;
}

/**
 * Hook to fetch ONLY active/enabled specialties for the current clinic.
 * 
 * IMPORTANT: This hook ONLY returns specialties that are:
 * 1. Active (is_active = true)
 * 2. Belonging to the current clinic
 * 
 * Use this hook for:
 * - Procedure selection
 * - Professional assignment
 * - Appointment scheduling
 * - Medical record templates
 * - Any feature that requires specialty selection
 * 
 * DO NOT use this for specialty management screens - use useAllSpecialties instead.
 */
export function useSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true) // CRITICAL: Only return enabled specialties
        .order("name");
      
      if (error) {
        console.error("Error fetching specialties:", error);
        throw error;
      }
      
      return data as Specialty[];
    },
    enabled: !!clinic?.id,
  });
}

/**
 * Hook to invalidate specialties cache - useful after creating/updating a specialty
 */
export function useInvalidateSpecialties() {
  const queryClient = useQueryClient();
  const { clinic } = useClinicData();
  
  return () => {
    if (clinic?.id) {
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic.id] });
      queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic.id] });
      queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic.id] });
    }
  };
}
