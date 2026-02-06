/**
 * YESCLIN SUPPORTED SPECIALTIES
 * 
 * This is the controlled list of specialties that Yesclin actually supports
 * with implemented clinical modules. This list should NOT be confused with
 * the global specialties catalog used for clinic configuration.
 * 
 * The prontuário specialty selector MUST use this list to ensure:
 * 1. Only specialties with real implementations are shown
 * 2. No empty or unimplemented screens are displayed
 * 3. The system appears specialized, not generic
 */

import type { SpecialtyKey } from './useActiveSpecialty';

/**
 * Clinical Block Keys - the ONLY valid block identifiers in Yesclin
 */
export type ClinicalBlockKey = 
  | 'resumo'
  | 'anamnese'
  | 'evolucao'
  | 'conduta'
  | 'exames'
  | 'timeline'
  | 'alertas'
  | 'historico'
  | 'procedimentos_realizados'
  | 'produtos_utilizados'
  | 'before_after_photos'
  | 'termos_consentimentos'
  | 'facial_map'
  | 'odontograma';

export interface YesclinSpecialty {
  key: SpecialtyKey;
  name: string;
  description: string;
  /** Clinical blocks enabled for this specialty */
  enabledBlocks: ClinicalBlockKey[];
  /** Icon name from lucide-react (optional) */
  icon?: string;
}

/**
 * The definitive list of specialties supported by Yesclin's prontuário.
 * 
 * IMPORTANT: This list represents the actual functional scope of the system.
 * Do NOT add specialties here unless their clinical modules are fully implemented.
 */
/**
 * CLÍNICA GERAL - Blocos clínicos exclusivos
 * 
 * Prontuário focado em atendimento médico ambulatorial com:
 * - Visão geral do paciente
 * - Registro de evoluções clínicas
 * - Plano terapêutico e conduta
 * - Solicitação e resultado de exames
 * - Linha do tempo clínica
 * - Alertas médicos (alergias, medicamentos, condições)
 * - Histórico completo de atendimentos
 * 
 * NÃO inclui: Odontograma, Mapa Facial, Fotos Antes/Depois, 
 * Procedimentos específicos de outras especialidades
 */
const CLINICA_GERAL_BLOCKS: ClinicalBlockKey[] = [
  'resumo',           // Visão Geral do paciente
  'anamnese',         // Anamnese completa (com versionamento)
  'evolucao',         // Evoluções clínicas
  'conduta',          // Plano / Conduta
  'exames',           // Exames / Documentos
  'timeline',         // Linha do Tempo
  'alertas',          // Alertas clínicos
  'historico',        // Histórico de atendimentos
];

export const YESCLIN_SUPPORTED_SPECIALTIES: YesclinSpecialty[] = [
  {
    key: 'geral',
    name: 'Clínica Geral',
    description: 'Atendimento médico ambulatorial com evoluções, conduta e acompanhamento clínico',
    enabledBlocks: CLINICA_GERAL_BLOCKS,
    icon: 'Stethoscope',
  },
  {
    key: 'psicologia',
    name: 'Psicologia',
    description: 'Atendimento psicológico com registro de sessões e plano terapêutico',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'conduta',
      'timeline',
      'alertas',
      'historico',
      'termos_consentimentos',
    ],
    icon: 'Brain',
  },
  {
    key: 'nutricao',
    name: 'Nutrição',
    description: 'Avaliação nutricional e plano alimentar',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'conduta',
      'exames',
      'timeline',
      'historico',
    ],
    icon: 'Apple',
  },
  {
    key: 'fisioterapia',
    name: 'Fisioterapia',
    description: 'Avaliação funcional e exercícios aplicados',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'conduta',
      'exames',
      'timeline',
      'alertas',
      'historico',
      'procedimentos_realizados',
    ],
    icon: 'Activity',
  },
  {
    key: 'fisioterapia',
    name: 'Pilates',
    description: 'Avaliação postural e acompanhamento de sessões',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'conduta',
      'exames',
      'timeline',
      'alertas',
      'historico',
      'procedimentos_realizados',
    ],
    icon: 'Dumbbell',
  },
  {
    key: 'estetica',
    name: 'Estética / Harmonização Facial',
    description: 'Mapa facial interativo, procedimentos estéticos e termos de consentimento',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'procedimentos_realizados',
      'produtos_utilizados',
      'before_after_photos',
      'termos_consentimentos',
      'facial_map',
      'timeline',
      'historico',
    ],
    icon: 'Sparkles',
  },
  {
    key: 'odontologia',
    name: 'Odontologia',
    description: 'Odontograma digital e procedimentos por dente',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'conduta',
      'procedimentos_realizados',
      'produtos_utilizados',
      'odontograma',
      'exames',
      'timeline',
      'historico',
      'before_after_photos',
    ],
    icon: 'Smile',
  },
  {
    key: 'estetica',
    name: 'Dermatologia',
    description: 'Avaliação dermatológica e acompanhamento de tratamentos',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'procedimentos_realizados',
      'produtos_utilizados',
      'before_after_photos',
      'exames',
      'timeline',
      'historico',
    ],
    icon: 'Scan',
  },
  {
    key: 'pediatria',
    name: 'Pediatria',
    description: 'Acompanhamento pediátrico básico',
    enabledBlocks: [
      'resumo',
      'evolucao',
      'exames',
      'timeline',
      'alertas',
      'historico',
    ],
    icon: 'Baby',
  },
];

/**
 * Display labels for specialty keys (used for UI when no specific specialty is selected)
 */
export const YESCLIN_SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
  geral: 'Clínica Geral',
  odontologia: 'Odontologia',
  psicologia: 'Psicologia',
  psiquiatria: 'Psiquiatria',
  nutricao: 'Nutrição',
  estetica: 'Estética',
  fisioterapia: 'Fisioterapia',
  pediatria: 'Pediatria',
  ginecologia: 'Ginecologia',
  oftalmologia: 'Oftalmologia',
  custom: 'Personalizado',
};

/**
 * Get enabled clinical blocks for a specialty key
 */
export function getEnabledBlocksForSpecialty(key: SpecialtyKey): ClinicalBlockKey[] {
  const specialty = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === key);
  return specialty?.enabledBlocks || YESCLIN_SUPPORTED_SPECIALTIES[0].enabledBlocks;
}

/**
 * Check if a clinical block is enabled for a given specialty
 */
export function isBlockEnabledForSpecialty(blockKey: ClinicalBlockKey, specialtyKey: SpecialtyKey): boolean {
  const blocks = getEnabledBlocksForSpecialty(specialtyKey);
  return blocks.includes(blockKey);
}

/**
 * Maps specialty name patterns to Yesclin specialty keys.
 * Used to resolve database specialty names to system keys.
 */
export const SPECIALTY_NAME_TO_KEY_MAP: Record<string, SpecialtyKey> = {
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
  'nutrição': 'nutricao',
  'nutricao': 'nutricao',
  'nutricionista': 'nutricao',
  'estética': 'estetica',
  'estetica': 'estetica',
  'harmonização facial': 'estetica',
  'harmonizacao facial': 'estetica',
  'dermatologia': 'estetica',
  'fisioterapia': 'fisioterapia',
  'fisioterapeuta': 'fisioterapia',
  'pilates': 'fisioterapia',
  'pediatria': 'pediatria',
  'pediatra': 'pediatria',
};

/**
 * Resolves a specialty name (from database) to a Yesclin specialty key.
 * Returns 'geral' if no match is found.
 */
export function resolveSpecialtyKey(name: string): SpecialtyKey {
  const normalized = name.toLowerCase().trim();
  
  // Check exact match first
  if (SPECIALTY_NAME_TO_KEY_MAP[normalized]) {
    return SPECIALTY_NAME_TO_KEY_MAP[normalized];
  }
  
  // Check if name contains known pattern
  for (const [pattern, key] of Object.entries(SPECIALTY_NAME_TO_KEY_MAP)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return key;
    }
  }
  
  // Default to general
  return 'geral';
}
