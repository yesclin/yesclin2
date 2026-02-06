import type { SpecialtyKey } from './useActiveSpecialty';
import { 
  YESCLIN_SUPPORTED_SPECIALTIES, 
  getEnabledBlocksForSpecialty,
  type ClinicalBlockKey 
} from './yesclinSpecialties';

// Re-export ClinicalBlockKey for convenience
export type { ClinicalBlockKey } from './yesclinSpecialties';

/**
 * YESCLIN CLINICAL BLOCKS - Controlled list of available tabs
 * 
 * These are the ONLY clinical blocks available in the Yesclin prontuário.
 * No other tabs should be displayed outside this list.
 */

// Tab keys mapped to their display names
export const YESCLIN_CLINICAL_BLOCKS: Record<ClinicalBlockKey, string> = {
  resumo: 'Visão Geral',
  anamnese: 'Anamnese',
  exame_fisico: 'Exame Físico',
  evolucao: 'Evoluções',
  diagnostico: 'Hipóteses Diagnósticas',
  prescricoes: 'Prescrições',
  conduta: 'Plano / Conduta',
  exames: 'Exames / Documentos',
  timeline: 'Linha do Tempo',
  alertas: 'Alertas',
  historico: 'Histórico',
  procedimentos_realizados: 'Procedimentos Realizados',
  produtos_utilizados: 'Produtos Utilizados',
  before_after_photos: 'Fotos Antes / Depois',
  termos_consentimentos: 'Termos / Consentimentos',
  facial_map: 'Mapa Facial',
  odontograma: 'Odontograma Digital',
};

// All available clinical block keys
export const ALL_CLINICAL_BLOCKS: ClinicalBlockKey[] = Object.keys(YESCLIN_CLINICAL_BLOCKS) as ClinicalBlockKey[];

// Base tabs (for reference - actual visibility is determined by specialty config)
export const BASE_TABS: ClinicalBlockKey[] = [
  'resumo',
  'evolucao',
  'conduta',
  'exames',
  'timeline',
  'alertas',
  'historico',
];

// Legacy export for backward compatibility
export const SPECIALTY_TABS: Record<SpecialtyKey, ClinicalBlockKey[]> = {
  geral: [],
  odontologia: ['odontograma', 'procedimentos_realizados', 'produtos_utilizados', 'before_after_photos'],
  psicologia: ['termos_consentimentos'],
  psiquiatria: [],
  nutricao: [],
  estetica: ['facial_map', 'procedimentos_realizados', 'produtos_utilizados', 'before_after_photos', 'termos_consentimentos'],
  fisioterapia: ['procedimentos_realizados'],
  pediatria: [],
  ginecologia: [],
  oftalmologia: [],
  custom: [],
};

/**
 * Get all visible tabs for a given specialty.
 * Uses the enabledBlocks from YESCLIN_SUPPORTED_SPECIALTIES.
 */
export function getVisibleTabsForSpecialty(specialtyKey: SpecialtyKey): ClinicalBlockKey[] {
  return getEnabledBlocksForSpecialty(specialtyKey);
}

/**
 * Check if a tab should be visible for the given specialty.
 * Uses the specialty's enabledBlocks configuration.
 */
export function isTabVisibleForSpecialty(tabKey: string, specialtyKey: SpecialtyKey): boolean {
  const visibleTabs = getVisibleTabsForSpecialty(specialtyKey);
  return visibleTabs.includes(tabKey as ClinicalBlockKey);
}

/**
 * Get display label for a clinical block
 */
export function getClinicalBlockLabel(key: ClinicalBlockKey): string {
  return YESCLIN_CLINICAL_BLOCKS[key] || key;
}

/**
 * Get all clinical blocks with their labels
 */
export function getAllClinicalBlocks(): Array<{ key: ClinicalBlockKey; label: string }> {
  return ALL_CLINICAL_BLOCKS.map(key => ({
    key,
    label: YESCLIN_CLINICAL_BLOCKS[key],
  }));
}

/**
 * Get a human-readable label for a specialty key.
 */
export { YESCLIN_SPECIALTY_LABELS as SPECIALTY_LABELS } from './yesclinSpecialties';
