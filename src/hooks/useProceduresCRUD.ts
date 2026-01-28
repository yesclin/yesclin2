import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Procedure {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string | null;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  allows_return: boolean;
  return_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureFormData {
  name: string;
  specialty?: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  allows_return: boolean;
  return_days?: number;
}

// Fetch all procedures (including inactive for admin view)
export function useProceduresList(includeInactive: boolean = true) {
  return useQuery({
    queryKey: ["procedures-list", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("procedures")
        .select("*")
        .order("name");
      
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Procedure[];
    },
  });
}

// Helper to get user's clinic_id
async function getUserClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  // Try profiles first (main source)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  
  if (profileData?.clinic_id) {
    return profileData.clinic_id;
  }
  
  // Fallback to user_roles
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
  
  if (roleData?.clinic_id) {
    return roleData.clinic_id;
  }
  
  throw new Error("Clínica não encontrada. Complete o onboarding primeiro.");
}

// Create procedure mutation
export function useCreateProcedure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: ProcedureFormData) => {
      const clinicId = await getUserClinicId();
      
      const { data, error } = await supabase
        .from("procedures")
        .insert({
          clinic_id: clinicId,
          name: formData.name,
          specialty: formData.specialty || null,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price || null,
          allows_return: formData.allows_return,
          return_days: formData.allows_return ? formData.return_days : null,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures-list"] });
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating procedure:", error);
      toast.error("Erro ao criar procedimento. Tente novamente.");
    },
  });
}

// Update procedure mutation
export function useUpdateProcedure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: ProcedureFormData }) => {
      const { data, error } = await supabase
        .from("procedures")
        .update({
          name: formData.name,
          specialty: formData.specialty || null,
          description: formData.description || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price || null,
          allows_return: formData.allows_return,
          return_days: formData.allows_return ? formData.return_days : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures-list"] });
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating procedure:", error);
      toast.error("Erro ao atualizar procedimento. Tente novamente.");
    },
  });
}

// Toggle procedure active status mutation
export function useToggleProcedureStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("procedures")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["procedures-list"] });
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success(
        variables.isActive 
          ? "Procedimento ativado com sucesso!" 
          : "Procedimento desativado com sucesso!"
      );
    },
    onError: (error) => {
      console.error("Error toggling procedure status:", error);
      toast.error("Erro ao alterar status do procedimento. Tente novamente.");
    },
  });
}

// Hook to manage procedure form state
export function useProcedureForm(initialData?: Procedure | null) {
  const [formData, setFormData] = useState<ProcedureFormData>({
    name: initialData?.name || "",
    specialty: initialData?.specialty || "",
    description: initialData?.description || "",
    duration_minutes: initialData?.duration_minutes || 30,
    price: initialData?.price || undefined,
    allows_return: initialData?.allows_return || false,
    return_days: initialData?.return_days || 15,
  });

  const updateField = <K extends keyof ProcedureFormData>(
    field: K,
    value: ProcedureFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      specialty: "",
      description: "",
      duration_minutes: 30,
      price: undefined,
      allows_return: false,
      return_days: 15,
    });
  };

  const loadProcedure = (procedure: Procedure) => {
    setFormData({
      name: procedure.name,
      specialty: procedure.specialty || "",
      description: procedure.description || "",
      duration_minutes: procedure.duration_minutes,
      price: procedure.price || undefined,
      allows_return: procedure.allows_return,
      return_days: procedure.return_days || 15,
    });
  };

  const isValid = formData.name.trim().length > 0 && formData.duration_minutes > 0;

  return {
    formData,
    updateField,
    resetForm,
    loadProcedure,
    isValid,
  };
}
