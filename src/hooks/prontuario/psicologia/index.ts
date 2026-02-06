/**
 * PSICOLOGIA - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Psicologia.
 */

export { useVisaoGeralPsicologiaData } from './useVisaoGeralPsicologiaData';
export type { 
  PsicologiaPatientData, 
  PsicologiaClinicalAlert, 
  PsicologiaSummaryData,
  StatusAcompanhamento,
} from './useVisaoGeralPsicologiaData';

export { useAnamnesePsicologiaData } from './useAnamnesePsicologiaData';
export type { 
  AnamnesePsicologiaData,
  AnamnesePsicologiaFormData,
} from './useAnamnesePsicologiaData';
