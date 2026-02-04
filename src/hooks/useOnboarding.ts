import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingProgress {
  id: string;
  clinic_id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  skipped_at: string | null;
  completed_at: string | null;
  preferences: {
    accepts_insurance?: boolean;
    wants_reminders?: boolean;
    payment_methods?: string[];
    allows_return?: boolean;
    // Specialty selection (temporary state)
    primary_specialty_id?: string;
    primary_specialty_name?: string;
    primary_specialty_curated_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export const ONBOARDING_STEPS = [
  { id: 0, key: "welcome", title: "Boas-vindas", required: false },
  { id: 1, key: "clinic", title: "Dados da Clínica", required: true },
  { id: 2, key: "specialties", title: "Especialidades", required: true },
  { id: 3, key: "professionals", title: "Profissionais", required: false },
  { id: 4, key: "schedule", title: "Agenda", required: false },
  { id: 5, key: "procedures", title: "Procedimentos", required: false },
  { id: 6, key: "insurance", title: "Convênios", required: false },
  { id: 7, key: "finance", title: "Financeiro", required: false },
  { id: 8, key: "communication", title: "Comunicação", required: false },
  { id: 9, key: "completion", title: "Conclusão", required: false },
];

// Map of curated specialty IDs to their descriptions
const CURATED_SPECIALTIES_MAP: Record<string, { description: string }> = {
  "clinica-geral": { description: "Atendimento médico generalista" },
  "psicologia": { description: "Saúde mental e terapia" },
  "nutricao": { description: "Alimentação e dieta" },
  "fisioterapia": { description: "Reabilitação e movimento" },
  "pilates": { description: "Exercícios terapêuticos" },
  "estetica": { description: "Procedimentos estéticos" },
  "odontologia": { description: "Saúde bucal com odontograma digital" },
  "dermatologia": { description: "Cuidados com a pele" },
  "pediatria": { description: "Atendimento infantil" },
};

// Helper function to enable core clinical modules for a specialty
async function enableCoreModulesForSpecialty(clinicId: string, specialtyId: string) {
  try {
    const { data: coreModules } = await supabase
      .from("clinical_modules")
      .select("id")
      .in("key", ["evolucao", "anamnese", "alertas", "files"]);

    if (coreModules && coreModules.length > 0) {
      const moduleInserts = coreModules.map((m) => ({
        clinic_id: clinicId,
        specialty_id: specialtyId,
        module_id: m.id,
        is_enabled: true,
      }));

      await supabase
        .from("clinic_specialty_modules")
        .upsert(moduleInserts, { onConflict: "clinic_id,specialty_id,module_id" });
    }
  } catch (err) {
    console.error("Error enabling core modules:", err);
  }
}

export function useOnboarding() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user is admin/owner and should see onboarding
  const checkOnboardingStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setIsLoading(false);
        return;
      }

      // Get user role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("clinic_id", profile.clinic_id)
        .single();

      const role = roleData?.role || "recepcionista";
      setUserRole(role);
      setClinicId(profile.clinic_id);

      // Only admin/owner can see onboarding
      if (!["admin", "owner"].includes(role)) {
        setIsLoading(false);
        setShouldShowOnboarding(false);
        return;
      }

      // Check if onboarding exists
      const { data: onboardingData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("clinic_id", profile.clinic_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (onboardingData) {
        setProgress(onboardingData as OnboardingProgress);
        setShouldShowOnboarding(!onboardingData.is_completed && !onboardingData.skipped_at);
      } else {
        // First login - create onboarding record
        const { data: newProgress, error } = await supabase
          .from("onboarding_progress")
          .insert({
            clinic_id: profile.clinic_id,
            user_id: user.id,
            current_step: 0,
            completed_steps: [],
            preferences: {},
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating onboarding:", error);
        } else {
          setProgress(newProgress as OnboardingProgress);
          setShouldShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const updateStep = useCallback(async (step: number) => {
    if (!progress) return;

    const newCompletedSteps = progress.completed_steps.includes(step - 1)
      ? progress.completed_steps
      : [...progress.completed_steps, step - 1];

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: step,
        completed_steps: newCompletedSteps,
      })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao salvar progresso",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setProgress({
      ...progress,
      current_step: step,
      completed_steps: newCompletedSteps,
    });
  }, [progress, toast]);

  const updatePreferences = useCallback(async (preferences: Partial<OnboardingProgress["preferences"]>) => {
    if (!progress) return;

    const newPreferences = { ...progress.preferences, ...preferences };

    const { error } = await supabase
      .from("onboarding_progress")
      .update({ preferences: newPreferences })
      .eq("id", progress.id);

    if (error) {
      console.error("Error updating preferences:", error);
      return;
    }

    setProgress({ ...progress, preferences: newPreferences });
  }, [progress]);

  const skipOnboarding = useCallback(async () => {
    if (!progress) return;

    const { error } = await supabase
      .from("onboarding_progress")
      .update({ skipped_at: new Date().toISOString() })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao pular onboarding",
        variant: "destructive",
      });
      return;
    }

    setProgress({ ...progress, skipped_at: new Date().toISOString() });
    setShouldShowOnboarding(false);
  }, [progress, toast]);

  const completeOnboarding = useCallback(async () => {
    if (!progress || !clinicId) return;

    try {
      // FINAL PERSISTENCE: Save specialty data collected during onboarding
      const prefs = progress.preferences;
      let finalSpecialtyId: string | null = null;

      if (prefs.primary_specialty_id) {
        // Custom specialty already created - just activate it
        finalSpecialtyId = prefs.primary_specialty_id;
        await supabase
          .from("specialties")
          .update({ is_active: true })
          .eq("id", finalSpecialtyId);
      } else if (prefs.primary_specialty_curated_id && prefs.primary_specialty_name) {
        // Curated specialty - check if exists or create
        const curatedInfo = CURATED_SPECIALTIES_MAP[prefs.primary_specialty_curated_id];
        
        const { data: existing } = await supabase
          .from("specialties")
          .select("id")
          .eq("clinic_id", clinicId)
          .eq("name", prefs.primary_specialty_name)
          .maybeSingle();

        if (existing) {
          finalSpecialtyId = existing.id;
          await supabase
            .from("specialties")
            .update({ is_active: true })
            .eq("id", existing.id);
        } else {
          const { data: created, error: createErr } = await supabase
            .from("specialties")
            .insert({
              name: prefs.primary_specialty_name,
              description: curatedInfo?.description || null,
              area: "Padrão",
              clinic_id: clinicId,
              specialty_type: "padrao",
              is_active: true,
            })
            .select("id")
            .single();

          if (createErr) throw createErr;
          if (created) {
            finalSpecialtyId = created.id;
            // Enable core modules
            await enableCoreModulesForSpecialty(clinicId, created.id);
          }
        }
      }

      // Save primary_specialty_id on clinic if we have one
      if (finalSpecialtyId) {
        await supabase
          .from("clinics")
          .update({ primary_specialty_id: finalSpecialtyId })
          .eq("id", clinicId);
      }

      // Mark onboarding as completed
      const { error } = await supabase
        .from("onboarding_progress")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completed_steps: ONBOARDING_STEPS.map((s) => s.id),
        })
        .eq("id", progress.id);

      if (error) throw error;

      setProgress({
        ...progress,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
      setShouldShowOnboarding(false);

      toast({
        title: "Configuração concluída! 🎉",
        description: "Seu sistema está pronto para uso.",
      });
    } catch (err) {
      console.error("Error completing onboarding:", err);
      toast({
        title: "Erro ao completar onboarding",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  }, [progress, clinicId, toast]);

  const restartOnboarding = useCallback(async () => {
    if (!progress) return;

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: 0,
        completed_steps: [],
        is_completed: false,
        skipped_at: null,
        completed_at: null,
      })
      .eq("id", progress.id);

    if (error) {
      toast({
        title: "Erro ao reiniciar onboarding",
        variant: "destructive",
      });
      return;
    }

    setProgress({
      ...progress,
      current_step: 0,
      completed_steps: [],
      is_completed: false,
      skipped_at: null,
      completed_at: null,
    });
    setShouldShowOnboarding(true);
  }, [progress, toast]);

  const progressPercentage = progress
    ? Math.round((progress.completed_steps.length / (ONBOARDING_STEPS.length - 1)) * 100)
    : 0;

  return {
    progress,
    isLoading,
    shouldShowOnboarding,
    userRole,
    clinicId,
    currentStep: progress?.current_step ?? 0,
    completedSteps: progress?.completed_steps ?? [],
    preferences: progress?.preferences ?? {},
    progressPercentage,
    updateStep,
    updatePreferences,
    skipOnboarding,
    completeOnboarding,
    restartOnboarding,
    ONBOARDING_STEPS,
  };
}
