import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAppointment } from "./useActiveAppointment";
import { usePermissions } from "@/hooks/usePermissions";
import { useMemo } from "react";

export interface MedicalRecordContext {
  // Appointment info
  appointmentId: string | null;
  professionalId: string | null;
  professionalName: string | null;
  patientId: string | null;
  procedureId: string | null;
  procedureName: string | null;
  
  // Specialty info (resolved from procedure or direct)
  specialtyId: string | null;
  specialtyName: string | null;
  specialtyKey: string | null;
  
  // Validation status
  isSpecialtyEnabled: boolean;
  canProfessionalAccess: boolean;
  
  // Context state
  hasActiveAppointment: boolean;
  isContextLocked: boolean; // True when specialty is from appointment (cannot change)
  canEditRecords: boolean;
  
  // Error messages
  validationError: string | null;
}

/**
 * Hook that provides the intelligent medical record context based on:
 * 1. Active appointment (if in progress)
 * 2. Professional logged in
 * 3. Procedure and specialty validation
 * 
 * CRITICAL RULE: When there's an active appointment, the specialty is LOCKED
 * and cannot be manually changed.
 */
export function useIntelligentMedicalRecordContext(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  const { professionalId: userProfessionalId, canAccessClinicalContent, isLoading: permissionsLoading } = usePermissions();
  
  // Fetch detailed context from database when there's an active appointment
  const { data: dbContext, isLoading: contextLoading } = useQuery({
    queryKey: ["medical-record-context", activeAppointment?.id],
    queryFn: async () => {
      if (!activeAppointment?.id) return null;
      
      const { data, error } = await supabase
        .rpc("get_appointment_medical_record_context", {
          _appointment_id: activeAppointment.id,
        });
      
      if (error) {
        console.error("Error fetching medical record context:", error);
        return null;
      }
      
      return data?.[0] || null;
    },
    enabled: !!activeAppointment?.id,
  });

  // Build the context object
  const context = useMemo((): MedicalRecordContext => {
    // Base state when no active appointment
    if (!activeAppointment) {
      return {
        appointmentId: null,
        professionalId: userProfessionalId,
        professionalName: null,
        patientId: patientId || null,
        procedureId: null,
        procedureName: null,
        specialtyId: null,
        specialtyName: null,
        specialtyKey: null,
        isSpecialtyEnabled: false,
        canProfessionalAccess: false,
        hasActiveAppointment: false,
        isContextLocked: false,
        canEditRecords: false,
        validationError: "Nenhum atendimento ativo. Inicie um atendimento pela agenda para editar o prontuário.",
      };
    }

    // Block if appointment has no resolved specialty
    if (!activeAppointment.resolved_specialty_id) {
      return {
        appointmentId: activeAppointment.id,
        professionalId: activeAppointment.professional_id,
        professionalName: activeAppointment.professional_name,
        patientId: patientId || null,
        procedureId: activeAppointment.procedure_id,
        procedureName: activeAppointment.procedure_name,
        specialtyId: null,
        specialtyName: null,
        specialtyKey: null,
        isSpecialtyEnabled: false,
        canProfessionalAccess: false,
        hasActiveAppointment: true,
        isContextLocked: true,
        canEditRecords: false,
        validationError: "Especialidade não definida para este atendimento. Defina uma especialidade no agendamento antes de prosseguir.",
      };
    }

    // Use database context if available
    if (dbContext) {
      const hasValidContext = dbContext.is_specialty_enabled && dbContext.can_professional_access;
      
      let validationError: string | null = null;
      if (!dbContext.is_specialty_enabled) {
        validationError = "A especialidade do procedimento não está habilitada na clínica";
      } else if (!dbContext.can_professional_access) {
        validationError = "Profissional não está autorizado para esta especialidade";
      }
      
      return {
        appointmentId: dbContext.appointment_id,
        professionalId: dbContext.professional_id,
        professionalName: dbContext.professional_name,
        patientId: dbContext.patient_id,
        procedureId: dbContext.procedure_id,
        procedureName: dbContext.procedure_name,
        specialtyId: dbContext.specialty_id,
        specialtyName: dbContext.specialty_name,
        specialtyKey: dbContext.specialty_key,
        isSpecialtyEnabled: dbContext.is_specialty_enabled || false,
        canProfessionalAccess: dbContext.can_professional_access || false,
        hasActiveAppointment: true,
        isContextLocked: true, // CRITICAL: Specialty is locked during appointment
        canEditRecords: hasValidContext && canAccessClinicalContent,
        validationError,
      };
    }

    // Fallback to basic appointment data
    return {
      appointmentId: activeAppointment.id,
      professionalId: activeAppointment.professional_id,
      professionalName: activeAppointment.professional_name,
      patientId: patientId || null,
      procedureId: activeAppointment.procedure_id,
      procedureName: activeAppointment.procedure_name,
      specialtyId: activeAppointment.resolved_specialty_id,
      specialtyName: activeAppointment.resolved_specialty_name,
      specialtyKey: null,
      isSpecialtyEnabled: true, // Assume enabled if we got here
      canProfessionalAccess: true, // Assume access if we got here
      hasActiveAppointment: true,
      isContextLocked: true, // CRITICAL: Specialty is locked during appointment
      canEditRecords: canAccessClinicalContent,
      validationError: null,
    };
  }, [activeAppointment, dbContext, patientId, userProfessionalId, canAccessClinicalContent]);

  return {
    ...context,
    isLoading: appointmentLoading || contextLoading || permissionsLoading,
  };
}

/**
 * Hook to check if the user can select a different specialty.
 * Returns false when there's an active appointment (specialty is locked).
 */
export function useCanSelectSpecialty(patientId: string | null | undefined): boolean {
  const { isContextLocked, hasActiveAppointment } = useIntelligentMedicalRecordContext(patientId);
  
  // Cannot select specialty when context is locked (active appointment)
  if (isContextLocked || hasActiveAppointment) {
    return false;
  }
  
  return true;
}

/**
 * Hook to get the reason why specialty selection is blocked.
 */
export function useSpecialtySelectionBlockedReason(patientId: string | null | undefined): string | null {
  const { hasActiveAppointment, specialtyName, procedureName } = useIntelligentMedicalRecordContext(patientId);
  
  if (hasActiveAppointment) {
    if (procedureName && specialtyName) {
      return `Especialidade bloqueada: ${specialtyName} (procedimento: ${procedureName})`;
    }
    if (specialtyName) {
      return `Especialidade bloqueada: ${specialtyName} (atendimento em andamento)`;
    }
    return "Especialidade bloqueada durante atendimento";
  }
  
  return null;
}
