import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "./useClinicData";

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
}

/**
 * Hook to fetch active specialties for the current clinic
 */
export function useSpecialties() {
  const { clinic } = useClinicData();
  
  return useQuery({
    queryKey: ["specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, color, is_active")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
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
