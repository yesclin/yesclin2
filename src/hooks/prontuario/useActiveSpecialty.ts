import { useState, useCallback, useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  resolveSpecialtyKey,
  type YesclinSpecialty 
} from './yesclinSpecialties';
import { useEnabledSpecialties } from '@/hooks/useEnabledSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';

export type SpecialtyKey =
  | 'geral'           // Clínica Geral
  | 'odontologia'     // Odontologia
  | 'psicologia'      // Psicologia
  | 'psiquiatria'     // Psiquiatria (not in supported list)
  | 'nutricao'        // Nutrição
  | 'estetica'        // Estética
  | 'dermatologia'    // Dermatologia
  | 'fisioterapia'    // Fisioterapia
  | 'pilates'         // Pilates (independente)
  | 'pediatria'       // Pediatria
  | 'ginecologia'     // Ginecologia (not in supported list)
  | 'oftalmologia'    // Oftalmologia (not in supported list)
  | 'custom';         // Custom/Other

export interface SpecialtyOption {
  id: string;
  name: string;
  key: SpecialtyKey;
  description?: string;
  icon?: string;
}

/**
 * Maps a specialty name to a known specialty key.
 * Returns 'geral' if no match is found.
 * @deprecated Use resolveSpecialtyKey from yesclinSpecialties.ts instead
 */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  return resolveSpecialtyKey(name);
}

/**
 * Hook that determines the active specialty based on:
 * 1. Active appointment's specialty (if in progress) - LOCKED, cannot change
 * 2. Manual selection (stored in session state) - only when no active appointment
 * 3. Default: 'geral' (Clínica Geral)
 * 
 * CRITICAL CHANGES:
 * - Now uses YESCLIN_SUPPORTED_SPECIALTIES (controlled system list)
 * - Does NOT fetch from database specialties catalog
 * - Only shows specialties with actual implementations
 * 
 * CRITICAL RULE: During an active appointment, specialty selection is BLOCKED.
 * The specialty is determined by the procedure/appointment and cannot be changed.
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  const { data: enabledClinicSpecialties = [], isLoading: specialtiesLoading } = useEnabledSpecialties();
  const { activeSpecialtyName: globalSpecialtyName } = useGlobalSpecialty();
  
  const [manualSpecialtyKey, setManualSpecialtyKey] = useState<SpecialtyKey | null>(null);

  // Filter Yesclin supported specialties against clinic's enabled specialties
  const specialties = useMemo((): SpecialtyOption[] => {
    // Build a set of enabled specialty names (lowercased) for matching
    const enabledNames = new Set(
      enabledClinicSpecialties.map(s => s.name.toLowerCase().trim())
    );
    
    return YESCLIN_SUPPORTED_SPECIALTIES
      .filter((spec: YesclinSpecialty) => {
        // Match by name (case-insensitive)
        return enabledNames.has(spec.name.toLowerCase().trim());
      })
      .map((spec: YesclinSpecialty, index) => ({
        id: `yesclin-${spec.key}-${index}`,
        name: spec.name,
        key: spec.key,
        description: spec.description,
        icon: spec.icon,
      }));
  }, [enabledClinicSpecialties]);

  // CRITICAL: Check if specialty is locked (from active appointment)
  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);
  const isSpecialtyLocked = isFromAppointment; // Cannot change during appointment

  // Determine the active specialty key
  // Priority: 1) Active appointment's resolved specialty (LOCKED - from procedure)
  //           2) Manual selection within prontuário (only when no active appointment)
  //           3) Global specialty context (header dropdown) — keeps prontuário in sync
  //           4) Default: 'geral'
  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    // Priority 1: Active appointment - resolve from name (LOCKED, ignores global)
    if (activeAppointment?.resolved_specialty_name) {
      return resolveSpecialtyKey(activeAppointment.resolved_specialty_name);
    }
    
    // Priority 2: Manual selection within prontuário
    if (manualSpecialtyKey) {
      return manualSpecialtyKey;
    }
    
    // Priority 3: Global specialty context (header dropdown)
    if (globalSpecialtyName) {
      return resolveSpecialtyKey(globalSpecialtyName);
    }
    
    // Default
    return 'geral';
  }, [activeAppointment?.resolved_specialty_name, manualSpecialtyKey, globalSpecialtyName]);

  // Find the active specialty details from the controlled list
  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    return specialties.find(s => s.key === activeSpecialtyKey) || null;
  }, [activeSpecialtyKey, specialties]);

  // Get the active specialty ID (synthetic for system specialties)
  const activeSpecialtyId = useMemo(() => {
    return activeSpecialty?.id || null;
  }, [activeSpecialty]);

  // Set manual specialty by key - BLOCKED during active appointment
  const setActiveSpecialty = useCallback((specialtyIdOrKey: string | null) => {
    // CRITICAL: Block manual selection during active appointment
    if (isSpecialtyLocked) {
      console.warn('Cannot change specialty during active appointment');
      return;
    }
    
    if (!specialtyIdOrKey) {
      setManualSpecialtyKey(null);
      return;
    }
    
    // Find specialty by ID or key
    const found = specialties.find(s => 
      s.id === specialtyIdOrKey || s.key === specialtyIdOrKey
    );
    
    if (found) {
      setManualSpecialtyKey(found.key);
    } else {
      // Try to resolve as a specialty name
      const key = resolveSpecialtyKey(specialtyIdOrKey);
      setManualSpecialtyKey(key);
    }
  }, [isSpecialtyLocked, specialties]);

  // Get the reason why selection is blocked
  const selectionBlockedReason = useMemo(() => {
    if (!isSpecialtyLocked) return null;
    
    const procedureName = activeAppointment?.procedure_name;
    const specialtyName = activeAppointment?.resolved_specialty_name || activeSpecialty?.name;
    
    if (procedureName && specialtyName) {
      return `Especialidade bloqueada: ${specialtyName} (procedimento: ${procedureName})`;
    }
    if (specialtyName) {
      return `Especialidade bloqueada: ${specialtyName} (atendimento em andamento)`;
    }
    return 'Especialidade bloqueada durante atendimento';
  }, [isSpecialtyLocked, activeAppointment, activeSpecialty]);

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyKey,
    specialties, // Now returns only Yesclin-supported specialties
    isFromAppointment,
    isSpecialtyLocked,
    selectionBlockedReason,
    setActiveSpecialty,
    loading: appointmentLoading || specialtiesLoading,
    // Expose appointment info for context
    activeAppointment,
  };
}
