import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";

export type SpecialtyType = 'padrao' | 'personalizada';

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  area: string | null;
  is_active: boolean;
  specialty_type: SpecialtyType;
  clinic_id: string | null;
}

/**
 * Hook to fetch ONLY active/enabled specialties available to the current clinic.
 * 
 * IMPORTANT: This hook returns:
 * 1. Global standard specialties (specialty_type = 'padrao', clinic_id = null)
 * 2. Custom specialties created by this clinic (specialty_type = 'personalizada')
 * 
 * All returned specialties are active (is_active = true).
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
      // Fetch both global standard and clinic custom specialties
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, area, is_active, specialty_type, clinic_id")
        .eq("is_active", true) // CRITICAL: Only return enabled specialties
        .or(`clinic_id.is.null,clinic_id.eq.${clinic?.id}`)
        .order("area")
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
      queryClient.invalidateQueries({ queryKey: ["standard-specialties"] });
      queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic.id] });
    }
  };
}
