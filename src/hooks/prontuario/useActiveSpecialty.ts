import { useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  resolveSpecialtyKey,
  type YesclinSpecialty 
} from './yesclinSpecialties';
import { useGlobalSpecialty } from '@/hooks/useGlobalSpecialty';

export type SpecialtyKey =
  | 'geral'
  | 'odontologia'
  | 'psicologia'
  | 'psiquiatria'
  | 'nutricao'
  | 'estetica'
  | 'dermatologia'
  | 'fisioterapia'
  | 'pilates'
  | 'pediatria'
  | 'ginecologia'
  | 'oftalmologia'
  | 'custom';

export interface SpecialtyOption {
  id: string;
  name: string;
  key: SpecialtyKey;
  description?: string;
  icon?: string;
}

/** @deprecated Use resolveSpecialtyKey from yesclinSpecialties.ts */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  return resolveSpecialtyKey(name);
}

/**
 * FULLY DERIVED hook — no state, no localStorage, no manual control.
 * 
 * The effective specialty is computed from:
 * 1. Active appointment specialty (if exists)
 * 2. First enabled specialty from clinic config
 * 3. Default: 'geral'
 * 
 * When specialties change in Configurações > Clínica:
 * → React Query cache invalidated → useEnabledSpecialties refetches
 * → GlobalSpecialtyProvider updates → this hook recomputes automatically
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  
  const { 
    enabledSpecialties: globalEnabledSpecialties,
    isSingleSpecialty,
  } = useGlobalSpecialty();

  // Map enabled DB specialties to Yesclin SpecialtyOptions
  const specialties = useMemo((): SpecialtyOption[] => {
    const enabledNames = new Set(
      globalEnabledSpecialties.map(s => s.name.toLowerCase().trim())
    );
    
    return YESCLIN_SUPPORTED_SPECIALTIES
      .filter((spec: YesclinSpecialty) => enabledNames.has(spec.name.toLowerCase().trim()))
      .map((spec: YesclinSpecialty) => {
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

  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);

  // DERIVED — no state, purely computed
  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    // Priority 1: appointment specialty
    if (activeAppointment?.resolved_specialty_name) {
      const key = resolveSpecialtyKey(activeAppointment.resolved_specialty_name);
      if (specialties.some(s => s.key === key)) return key;
    }
    
    // Priority 2: first enabled specialty
    if (specialties.length > 0) {
      return specialties[0].key;
    }
    
    return 'geral';
  }, [activeAppointment?.resolved_specialty_name, specialties]);

  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    return specialties.find(s => s.key === activeSpecialtyKey) || null;
  }, [activeSpecialtyKey, specialties]);

  const activeSpecialtyId = activeSpecialty?.id || null;

  return {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyKey,
    specialties,
    isFromAppointment,
    isSpecialtyLocked: isFromAppointment,
    isSingleSpecialty,
    selectionBlockedReason: isFromAppointment
      ? `Especialidade bloqueada: ${activeAppointment?.resolved_specialty_name || activeSpecialty?.name || ''} (atendimento em andamento)`
      : null,
    // No-op — manual selection is not allowed
    setActiveSpecialty: (_: string | null) => {},
    loading: appointmentLoading,
    activeAppointment,
  };
}
