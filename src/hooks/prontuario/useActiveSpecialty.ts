import { useCallback, useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  resolveSpecialtyKey,
  type YesclinSpecialty 
} from './yesclinSpecialties';
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
 * Hook that determines the active specialty for the Prontuário.
 * 
 * SINGLE SOURCE OF TRUTH: Uses GlobalSpecialtyProvider (which uses useEnabledSpecialties
 * via React Query). No local state for specialties — everything flows from the global store.
 * 
 * Priority:
 * 1. Active appointment's specialty (LOCKED, cannot change)
 * 2. Global specialty context (header dropdown / auto-selected)
 * 3. First enabled specialty
 * 4. Default: 'geral'
 * 
 * When specialties change in Configurações > Clínica:
 * → React Query cache invalidated → useEnabledSpecialties refetches
 * → GlobalSpecialtyProvider updates → this hook recomputes automatically
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  
  // SINGLE SOURCE OF TRUTH: Global specialty context
  const { 
    activeSpecialty: globalActiveSpecialty,
    activeSpecialtyName: globalSpecialtyName,
    enabledSpecialties: globalEnabledSpecialties,
    isSingleSpecialty,
    setActiveSpecialtyId,
  } = useGlobalSpecialty();

  // Map enabled DB specialties to Yesclin SpecialtyOptions (for UI rendering)
  const specialties = useMemo((): SpecialtyOption[] => {
    const enabledNames = new Set(
      globalEnabledSpecialties.map(s => s.name.toLowerCase().trim())
    );
    
    return YESCLIN_SUPPORTED_SPECIALTIES
      .filter((spec: YesclinSpecialty) => enabledNames.has(spec.name.toLowerCase().trim()))
      .map((spec: YesclinSpecialty) => {
        // Use real DB ID from enabled specialties instead of synthetic ID
        const dbSpecialty = globalEnabledSpecialties.find(
          es => es.name.toLowerCase().trim() === spec.name.toLowerCase().trim()
        );
        return {
          id: dbSpecialty?.id || `yesclin-${spec.key}`,
          name: spec.name,
          key: spec.key,
          description: spec.description,
          icon: spec.icon,
        };
      });
  }, [globalEnabledSpecialties]);

  // CRITICAL: Check if specialty is locked (from active appointment)
  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);
  const isSpecialtyLocked = isFromAppointment;

  // Determine the active specialty key
  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    // Priority 1: Active appointment (LOCKED)
    if (activeAppointment?.resolved_specialty_name) {
      const key = resolveSpecialtyKey(activeAppointment.resolved_specialty_name);
      if (specialties.some(s => s.key === key)) return key;
    }
    
    // Priority 2: Global specialty context (from header dropdown)
    // This is the SINGLE SOURCE OF TRUTH — already handles:
    //   - Auto-fallback when active specialty is disabled
    //   - Auto-select when only 1 specialty enabled
    //   - Persistence in localStorage
    if (globalSpecialtyName) {
      const key = resolveSpecialtyKey(globalSpecialtyName);
      if (specialties.some(s => s.key === key)) return key;
    }
    
    // Priority 3: First enabled specialty
    if (specialties.length > 0) {
      return specialties[0].key;
    }
    
    // Default
    return 'geral';
  }, [activeAppointment?.resolved_specialty_name, globalSpecialtyName, specialties]);

  // Find the active specialty details
  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    return specialties.find(s => s.key === activeSpecialtyKey) || null;
  }, [activeSpecialtyKey, specialties]);

  const activeSpecialtyId = useMemo(() => {
    return activeSpecialty?.id || null;
  }, [activeSpecialty]);

  // Set specialty — delegates to global context (no local state)
  const setActiveSpecialty = useCallback((specialtyIdOrKey: string | null) => {
    if (isSpecialtyLocked) {
      console.warn('Cannot change specialty during active appointment');
      return;
    }
    
    if (!specialtyIdOrKey) return;
    
    // Find the DB specialty to get its real ID for the global store
    const foundByKey = specialties.find(s => s.key === specialtyIdOrKey);
    const foundById = specialties.find(s => s.id === specialtyIdOrKey);
    const found = foundByKey || foundById;
    
    if (found) {
      setActiveSpecialtyId(found.id);
    } else {
      // Try resolving as name
      const key = resolveSpecialtyKey(specialtyIdOrKey);
      const resolved = specialties.find(s => s.key === key);
      if (resolved) {
        setActiveSpecialtyId(resolved.id);
      }
    }
  }, [isSpecialtyLocked, specialties, setActiveSpecialtyId]);

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
    specialties,
    isFromAppointment,
    isSpecialtyLocked,
    isSingleSpecialty,
    selectionBlockedReason,
    setActiveSpecialty,
    loading: appointmentLoading,
    activeAppointment,
  };
}
