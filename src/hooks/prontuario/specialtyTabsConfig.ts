import type { SpecialtyKey } from './useActiveSpecialty';

/**
 * YESCLIN CLINICAL BLOCKS - Controlled list of available tabs
 * 
 * These are the ONLY clinical blocks available in the Yesclin prontuário.
 * No other tabs should be displayed outside this list.
 */

// Tab keys mapped to their display names
export const YESCLIN_CLINICAL_BLOCKS = {
  resumo: 'Visão Geral',
  evolucao: 'Evoluções',
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
} as const;

export type ClinicalBlockKey = keyof typeof YESCLIN_CLINICAL_BLOCKS;

// Base tabs that are always visible regardless of specialty
export const BASE_TABS: ClinicalBlockKey[] = [
  'resumo',           // Visão Geral
  'evolucao',         // Evoluções
  'conduta',          // Plano / Conduta
  'exames',           // Exames / Documentos
  'timeline',         // Linha do Tempo
  'alertas',          // Alertas
  'historico',        // Histórico
];

// Specialty-specific tabs configuration
export const SPECIALTY_TABS: Record<SpecialtyKey, ClinicalBlockKey[]> = {
  // Clínica Geral / Medicina Geral - base tabs only
  geral: [],

  // Odontologia - adds odontograma
  odontologia: [
    'odontograma',
    'procedimentos_realizados',
  ],

  // Psicologia - base tabs sufficient
  psicologia: [],

  // Psiquiatria - base tabs sufficient
  psiquiatria: [],

  // Nutrição - base tabs sufficient
  nutricao: [],

  // Estética / Harmonização Facial
  estetica: [
    'facial_map',
    'procedimentos_realizados',
    'produtos_utilizados',
    'before_after_photos',
    'termos_consentimentos',
  ],

  // Fisioterapia
  fisioterapia: [
    'procedimentos_realizados',
  ],

  // Pediatria
  pediatria: [],

  // Ginecologia - base tabs sufficient
  ginecologia: [],

  // Oftalmologia - base tabs sufficient
  oftalmologia: [],

  // Custom / Other specialties - base tabs only
  custom: [],
};

/**
 * Get all visible tabs for a given specialty.
 * Combines base tabs + specialty-specific tabs.
 */
export function getVisibleTabsForSpecialty(specialtyKey: SpecialtyKey): ClinicalBlockKey[] {
  const specialtyTabs = SPECIALTY_TABS[specialtyKey] || [];
  
  // Combine and deduplicate
  const combined = [...BASE_TABS, ...specialtyTabs];
  return [...new Set(combined)];
}

/**
 * Check if a tab should be visible for the given specialty.
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
 * Get a human-readable label for a specialty key.
 */
export { YESCLIN_SPECIALTY_LABELS as SPECIALTY_LABELS } from './yesclinSpecialties';
