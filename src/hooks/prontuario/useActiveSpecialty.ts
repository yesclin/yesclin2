import { useState, useEffect, useCallback, useMemo } from 'react';
import { useActiveAppointment } from './useActiveAppointment';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';

export type SpecialtyKey =
  | 'geral'           // Clínica Geral
  | 'odontologia'     // Odontologia
  | 'psicologia'      // Psicologia
  | 'psiquiatria'     // Psiquiatria
  | 'nutricao'        // Nutrição
  | 'estetica'        // Estética
  | 'fisioterapia'    // Fisioterapia
  | 'pediatria'       // Pediatria
  | 'ginecologia'     // Ginecologia
  | 'oftalmologia'    // Oftalmologia
  | 'custom';         // Custom/Other

export interface SpecialtyOption {
  id: string;
  name: string;
  key: SpecialtyKey;
}

// Known specialty name patterns mapped to keys
const SPECIALTY_NAME_PATTERNS: Record<string, SpecialtyKey> = {
  'clínica geral': 'geral',
  'clinica geral': 'geral',
  'clínica médica': 'geral',
  'clinica medica': 'geral',
  'medicina geral': 'geral',
  'odontologia': 'odontologia',
  'dentista': 'odontologia',
  'psicologia': 'psicologia',
  'psicólogo': 'psicologia',
  'psicologo': 'psicologia',
  'psiquiatria': 'psiquiatria',
  'psiquiatra': 'psiquiatria',
  'nutrição': 'nutricao',
  'nutricao': 'nutricao',
  'nutricionista': 'nutricao',
  'estética': 'estetica',
  'estetica': 'estetica',
  'dermatologia': 'estetica',
  'fisioterapia': 'fisioterapia',
  'fisioterapeuta': 'fisioterapia',
  'pediatria': 'pediatria',
  'pediatra': 'pediatria',
  'ginecologia': 'ginecologia',
  'ginecologista': 'ginecologia',
  'obstetrícia': 'ginecologia',
  'obstetricia': 'ginecologia',
  'oftalmologia': 'oftalmologia',
  'oftalmologista': 'oftalmologia',
};

/**
 * Maps a specialty name to a known specialty key.
 * Returns 'geral' if no match is found.
 */
export function mapSpecialtyNameToKey(name: string): SpecialtyKey {
  const normalized = name.toLowerCase().trim();
  
  // Check exact match first
  if (SPECIALTY_NAME_PATTERNS[normalized]) {
    return SPECIALTY_NAME_PATTERNS[normalized];
  }
  
  // Check if name contains known pattern
  for (const [pattern, key] of Object.entries(SPECIALTY_NAME_PATTERNS)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return key;
    }
  }
  
  return 'geral'; // Default to general
}

/**
 * Hook that determines the active specialty based on:
 * 1. Active appointment's specialty (if in progress) - LOCKED, cannot change
 * 2. Manual selection (stored in session state) - only when no active appointment
 * 3. Default: 'geral' (Clínica Geral)
 * 
 * CRITICAL RULE: During an active appointment, specialty selection is BLOCKED.
 * The specialty is determined by the procedure/appointment and cannot be changed.
 */
export function useActiveSpecialty(patientId: string | null | undefined) {
  const { clinic } = useClinicData();
  const { data: activeAppointment, isLoading: appointmentLoading } = useActiveAppointment(patientId);
  
  const [manualSpecialtyId, setManualSpecialtyId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available specialties (only enabled ones)
  useEffect(() => {
    const fetchSpecialties = async () => {
      if (!clinic?.id) return;
      setLoading(true);
      
      try {
        // Fetch both global and clinic-specific enabled specialties
        const { data, error } = await supabase
          .from('specialties')
          .select('id, name')
          .or(`clinic_id.is.null,clinic_id.eq.${clinic.id}`)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        const mapped: SpecialtyOption[] = (data || []).map(s => ({
          id: s.id,
          name: s.name,
          key: mapSpecialtyNameToKey(s.name),
        }));
        
        setSpecialties(mapped);
      } catch (err) {
        console.error('Error fetching specialties:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpecialties();
  }, [clinic?.id]);

  // CRITICAL: Check if specialty is locked (from active appointment)
  const isFromAppointment = !!(activeAppointment?.resolved_specialty_id);
  const isSpecialtyLocked = isFromAppointment; // Cannot change during appointment

  // Determine the active specialty ID
  // Priority: 1) Active appointment's resolved specialty (LOCKED - cannot change)
  //           2) Manual selection (only when no active appointment)
  //           3) null (defaults to 'geral' key)
  const activeSpecialtyId = useMemo(() => {
    // Priority 1: Active appointment's resolved specialty (from procedure or direct)
    // This is LOCKED and cannot be overridden
    if (activeAppointment?.resolved_specialty_id) {
      return activeAppointment.resolved_specialty_id;
    }
    
    // Priority 2: Manual selection (only allowed when no active appointment)
    if (manualSpecialtyId) {
      return manualSpecialtyId;
    }
    
    return null;
  }, [activeAppointment?.resolved_specialty_id, manualSpecialtyId]);

  // Get the active specialty details
  const activeSpecialty = useMemo((): SpecialtyOption | null => {
    if (!activeSpecialtyId) return null;
    return specialties.find(s => s.id === activeSpecialtyId) || null;
  }, [activeSpecialtyId, specialties]);

  // Get the active specialty key (or 'geral' as default)
  const activeSpecialtyKey = useMemo((): SpecialtyKey => {
    return activeSpecialty?.key || 'geral';
  }, [activeSpecialty]);

  // Set manual specialty - BLOCKED during active appointment
  const setActiveSpecialty = useCallback((specialtyId: string | null) => {
    // CRITICAL: Block manual selection during active appointment
    if (isSpecialtyLocked) {
      console.warn('Cannot change specialty during active appointment');
      return;
    }
    setManualSpecialtyId(specialtyId);
  }, [isSpecialtyLocked]);

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
    isSpecialtyLocked, // NEW: Indicates specialty cannot be changed
    selectionBlockedReason, // NEW: Reason for blocking
    setActiveSpecialty,
    loading: loading || appointmentLoading,
    // Expose appointment info for context
    activeAppointment,
  };
}
