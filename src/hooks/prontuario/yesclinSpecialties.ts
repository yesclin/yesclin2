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
  | 'exame_fisico'
  | 'evolucao'
  | 'diagnostico'
  | 'prescricoes'
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
  | 'odontograma'
  | 'instrumentos' // Instrumentos / Testes Psicológicos
  // Nutrition-specific blocks (10 blocos - ordem fixa)
  | 'avaliacao_nutricional'    // Avaliação Nutricional Inicial
  | 'avaliacao_clinica'        // Avaliação Antropométrica
  | 'diagnostico_nutricional'  // Diagnóstico Nutricional
  | 'plano_alimentar';         // Plano Alimentar

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
 * CLÍNICA GERAL - Blocos clínicos exclusivos (10 blocos)
 * 
 * Prontuário focado em atendimento médico ambulatorial com:
 * 1. Visão Geral - resumo do paciente
 * 2. Anamnese - histórico clínico com versionamento
 * 3. Evoluções - registros de consultas
 * 4. Exame Físico - sinais vitais e medidas
 * 5. Hipóteses Diagnósticas - CID-10
 * 6. Plano / Conduta - orientações terapêuticas
 * 7. Prescrições - receitas médicas
 * 8. Exames / Documentos - arquivos e resultados
 * 9. Alertas Clínicos - alergias, medicamentos, condições
 * 10. Histórico / Linha do Tempo - cronologia de atendimentos
 * 
 * NÃO inclui: Odontograma, Mapa Facial, Fotos Antes/Depois, 
 * Instrumentos Psicológicos, Procedimentos estéticos
 */
const CLINICA_GERAL_BLOCKS: ClinicalBlockKey[] = [
  'resumo',           // 1. Visão Geral
  'anamnese',         // 2. Anamnese
  'evolucao',         // 3. Evoluções
  'exame_fisico',     // 4. Exame Físico
  'diagnostico',      // 5. Hipóteses Diagnósticas (CID-10)
  'conduta',          // 6. Plano / Conduta
  'prescricoes',      // 7. Prescrições
  'exames',           // 8. Exames / Documentos
  'alertas',          // 9. Alertas Clínicos
  'timeline',         // 10. Histórico / Linha do Tempo
];

export const YESCLIN_SUPPORTED_SPECIALTIES: YesclinSpecialty[] = [
  {
    key: 'geral',
    name: 'Clínica Geral',
    description: 'Atendimento médico ambulatorial com evoluções, conduta e acompanhamento clínico',
    enabledBlocks: CLINICA_GERAL_BLOCKS,
    icon: 'Stethoscope',
  },
  /**
   * PSICOLOGIA - Blocos clínicos específicos
   * 
   * Prontuário focado em acompanhamento terapêutico com:
   * - Visão geral do paciente
   * - Anamnese psicológica (história pessoal, familiar, queixa principal)
   * - Registro de sessões (evoluções)
   * - Hipóteses diagnósticas (CID-10/DSM-5)
   * - Plano terapêutico e conduta
   * - Linha do tempo das sessões
   * - Alertas clínicos (medicamentos em uso, condições relevantes)
   * - Histórico completo de atendimentos
   * - Termos de consentimento (LGPD, sigilo terapêutico)
   * 
   * NÃO inclui: Exame físico, Prescrições médicas, Odontograma, 
   * Mapa Facial, procedimentos estéticos
   */
  {
    key: 'psicologia',
    name: 'Psicologia',
    description: 'Acompanhamento terapêutico com registro de sessões, plano terapêutico e hipóteses diagnósticas',
    enabledBlocks: [
      'resumo',           // Visão Geral do paciente
      'anamnese',         // Anamnese Psicológica (história, queixa, contexto)
      'evolucao',         // Registro de Sessões
      'diagnostico',      // Hipóteses Diagnósticas (CID-10/DSM-5)
      'conduta',          // Plano Terapêutico
      'instrumentos',     // Instrumentos / Testes Psicológicos
      'timeline',         // Linha do Tempo das sessões
      'alertas',          // Alertas clínicos (medicamentos, condições)
      'historico',        // Histórico de atendimentos
      'termos_consentimentos', // Termos de consentimento
    ],
    icon: 'Brain',
  },
  /**
   * NUTRIÇÃO - Blocos clínicos específicos
   * 
   * Prontuário focado em avaliação e acompanhamento nutricional com:
   * - Visão geral do paciente (peso atual, IMC, objetivo)
   * - Avaliação nutricional (antropometria, bioimpedância, dobras cutâneas)
   * - Recordatório alimentar (inquérito dietético 24h/habitual)
   * - Plano alimentar (macros, refeições, orientações)
   * - Metas e acompanhamento (objetivos, evolução de peso)
   * - Evoluções clínicas
   * - Exames laboratoriais (lipidograma, glicemia, vitaminas)
   * - Linha do tempo
   * - Histórico completo
   * 
   * NÃO inclui: Odontograma, Mapa Facial, Prescrições Médicas,
   * Instrumentos Psicológicos, Alertas de Risco
   */
  /**
   * NUTRIÇÃO - Blocos clínicos exclusivos (11 blocos)
   * 
   * Prontuário focado em avaliação e acompanhamento nutricional:
   * 1. Visão Geral - resumo do paciente (peso, IMC, objetivo)
   * 2. Anamnese Nutricional - histórico alimentar e hábitos
   * 3. Avaliação Antropométrica - medidas corporais e bioimpedância
   * 4. Avaliação Clínica / Bioquímica - exames laboratoriais
   * 5. Diagnóstico Nutricional - classificação do estado nutricional
   * 6. Plano Alimentar - prescrição dietética com macros
   * 7. Evoluções Nutricionais - registros de consultas
   * 8. Evolução Corporal - gráficos de peso e medidas
   * 9. Exames / Documentos - arquivos e resultados
   * 10. Alertas Nutricionais - alergias, restrições, intolerâncias
   * 11. Histórico / Linha do Tempo - cronologia de atendimentos
   * 
   * NÃO inclui: Prescrições médicas, Odontograma, Mapa Facial,
   * Instrumentos Psicológicos
   */
  {
    key: 'nutricao',
    name: 'Nutrição',
    description: 'Avaliação nutricional completa, plano alimentar e acompanhamento de metas',
    enabledBlocks: [
      'resumo',                   // 1. Visão Geral
      'anamnese',                 // 2. Anamnese Nutricional
      'avaliacao_nutricional',    // 3. Avaliação Nutricional Inicial
      'avaliacao_clinica',        // 4. Avaliação Antropométrica
      'diagnostico_nutricional',  // 5. Diagnóstico Nutricional
      'plano_alimentar',          // 6. Plano Alimentar
      'evolucao',                 // 7. Evoluções Nutricionais
      'exames',                   // 8. Exames / Documentos
      'timeline',                 // 9. Linha do Tempo
      'alertas',                  // 10. Alertas Nutricionais
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
