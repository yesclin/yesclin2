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

export interface YesclinSpecialty {
  key: SpecialtyKey;
  name: string;
  description: string;
  /** Clinical modules enabled for this specialty */
  enabledModules: string[];
  /** Icon name from lucide-react (optional) */
  icon?: string;
}

/**
 * The definitive list of specialties supported by Yesclin's prontuário.
 * 
 * IMPORTANT: This list represents the actual functional scope of the system.
 * Do NOT add specialties here unless their clinical modules are fully implemented.
 */
export const YESCLIN_SUPPORTED_SPECIALTIES: YesclinSpecialty[] = [
  {
    key: 'geral',
    name: 'Clínica Geral',
    description: 'Atendimento médico geral com anamnese, evolução e prescrições',
    enabledModules: [
      'anamnese',
      'sinais_vitais',
      'evolucao',
      'diagnostico',
      'prescricoes',
      'conduta',
    ],
    icon: 'Stethoscope',
  },
  {
    key: 'psicologia',
    name: 'Psicologia',
    description: 'Atendimento psicológico com registro de sessões e plano terapêutico',
    enabledModules: [
      'session_record',
      'therapeutic_goals',
      'therapeutic_plan',
      'evolucao',
      'conduta',
    ],
    icon: 'Brain',
  },
  {
    key: 'nutricao',
    name: 'Nutrição',
    description: 'Avaliação nutricional, medidas corporais e plano alimentar',
    enabledModules: [
      'nutritional_assessment',
      'body_measurements',
      'meal_plan',
      'nutritional_evolution',
      'evolucao',
    ],
    icon: 'Apple',
  },
  {
    key: 'fisioterapia',
    name: 'Fisioterapia',
    description: 'Avaliação funcional, escala de dor e exercícios aplicados',
    enabledModules: [
      'functional_assessment',
      'chief_complaint',
      'pain_scale',
      'range_of_motion',
      'physio_therapeutic_plan',
      'applied_exercises',
      'session_evolution',
      'evolucao',
    ],
    icon: 'Activity',
  },
  {
    key: 'fisioterapia', // Pilates shares fisioterapia key for modules
    name: 'Pilates',
    description: 'Avaliação postural e acompanhamento de sessões',
    enabledModules: [
      'functional_assessment',
      'session_evolution',
      'evolucao',
    ],
    icon: 'Dumbbell',
  },
  {
    key: 'estetica',
    name: 'Estética / Harmonização Facial',
    description: 'Mapa facial interativo, procedimentos estéticos e termos de consentimento',
    enabledModules: [
      'aesthetic_assessment',
      'facial_map',
      'aesthetic_procedure',
      'products_used',
      'before_after_photos',
      'aesthetic_consent',
      'evolucao',
    ],
    icon: 'Sparkles',
  },
  {
    key: 'odontologia',
    name: 'Odontologia',
    description: 'Odontograma digital, procedimentos por dente e fotos intraorais',
    enabledModules: [
      'anamnese',
      'sinais_vitais',
      'odontograma',
      'tooth_procedures',
      'fotos_intraorais',
      'evolucao',
      'diagnostico',
      'prescricoes',
    ],
    icon: 'Smile',
  },
  {
    key: 'estetica', // Dermatologia shares estetica key but with different focus
    name: 'Dermatologia',
    description: 'Avaliação dermatológica e acompanhamento de tratamentos',
    enabledModules: [
      'anamnese',
      'aesthetic_assessment',
      'before_after_photos',
      'evolucao',
      'prescricoes',
    ],
    icon: 'Scan',
  },
  {
    key: 'pediatria',
    name: 'Pediatria',
    description: 'Anamnese pediátrica, curva de crescimento e desenvolvimento',
    enabledModules: [
      'pediatric_anamnesis',
      'gestational_history',
      'growth_data',
      'growth_curve',
      'neuropsychomotor_development',
      'vaccines',
      'pediatric_diagnosis',
      'pediatric_conduct',
      'pediatric_evolution',
      'sinais_vitais',
      'prescricoes',
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
  psiquiatria: 'Psiquiatria', // Not in supported list
  nutricao: 'Nutrição',
  estetica: 'Estética',
  fisioterapia: 'Fisioterapia',
  pediatria: 'Pediatria',
  ginecologia: 'Ginecologia', // Not in supported list
  oftalmologia: 'Oftalmologia', // Not in supported list
  custom: 'Personalizado',
};

/**
 * Get enabled modules for a specialty key
 */
export function getEnabledModulesForSpecialty(key: SpecialtyKey): string[] {
  const specialty = YESCLIN_SUPPORTED_SPECIALTIES.find(s => s.key === key);
  return specialty?.enabledModules || YESCLIN_SUPPORTED_SPECIALTIES[0].enabledModules;
}

/**
 * Check if a module is enabled for a given specialty
 */
export function isModuleEnabledForSpecialty(moduleKey: string, specialtyKey: SpecialtyKey): boolean {
  const modules = getEnabledModulesForSpecialty(specialtyKey);
  return modules.includes(moduleKey);
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
