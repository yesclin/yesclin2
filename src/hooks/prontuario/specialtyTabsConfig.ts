import type { SpecialtyKey } from './useActiveSpecialty';

/**
 * Configuration for which tabs are visible for each specialty.
 * 
 * LAYER 1 - BASE (Always visible for all specialties):
 * - timeline (Linha do Tempo)
 * - historico (Histórico)
 * - exames (Exames / Documentos)
 * - alertas (Alertas)
 * - conduta (Plano/Conduta)
 * - exames_solicitacao (Solicitar Exames)
 * - resumo (Visão Geral)
 * 
 * LAYER 2 - SPECIALTY-SPECIFIC (Dynamic based on active specialty)
 */

// Base tabs that are always visible regardless of specialty
export const BASE_TABS: string[] = [
  'resumo',           // Visão Geral
  'timeline',         // Linha do Tempo
  'historico',        // Histórico
  'exames',           // Exames / Documentos
  'alertas',          // Alertas
  'conduta',          // Plano/Conduta
  'exames_solicitacao', // Solicitar Exames
];

// Specialty-specific tabs configuration
export const SPECIALTY_TABS: Record<SpecialtyKey, string[]> = {
  // Clínica Geral / Medicina Geral
  geral: [
    'anamnese',
    'sinais_vitais',
    'evolucao',
    'diagnostico',
    'prescricoes',
  ],

  // Odontologia
  odontologia: [
    'anamnese',
    'sinais_vitais',
    'odontograma',
    'tooth_procedures',
    'fotos_intraorais',
    'evolucao',
    'diagnostico',
    'prescricoes',
  ],

  // Psicologia
  psicologia: [
    'session_record',       // Registro de Sessão
    'therapeutic_goals',    // Objetivos Terapêuticos
    'therapeutic_plan',     // Plano Terapêutico
    'evolucao',
  ],

  // Psiquiatria
  psiquiatria: [
    'anamnese',
    'diagnosis_dsm',           // Diagnóstico (CID/DSM)
    'psychiatric_prescription', // Prescrição Medicamentosa
    'symptom_evolution',       // Evolução de Sintomas
    'medication_history',      // Histórico de Medicamentos
    'evolucao',
  ],

  // Nutrição
  nutricao: [
    'nutritional_assessment', // Avaliação Nutricional
    'body_measurements',      // Medidas Corporais
    'meal_plan',              // Plano Alimentar
    'nutritional_evolution',  // Evolução Nutricional
    'evolucao',
  ],

  // Estética
  estetica: [
    'aesthetic_assessment',   // Avaliação Estética
    'aesthetic_procedure',    // Procedimento Realizado
    'products_used',          // Produtos Utilizados
    'before_after_photos',    // Fotos Antes/Depois
    'consent_form',           // Termo de Consentimento
    'evolucao',
  ],

  // Fisioterapia
  fisioterapia: [
    'functional_assessment',  // Avaliação Funcional
    'chief_complaint',        // Queixa Principal
    'pain_scale',             // Escala de Dor
    'range_of_motion',        // Amplitude de Movimento
    'physio_therapeutic_plan', // Plano Terapêutico
    'applied_exercises',      // Exercícios Aplicados
    'session_evolution',      // Evolução por Sessão
    'evolucao',
  ],

  // Pediatria
  pediatria: [
    'pediatric_anamnesis',          // Anamnese Pediátrica
    'gestational_history',          // Histórico Gestacional
    'growth_data',                  // Dados de Crescimento
    'growth_curve',                 // Curva de Crescimento
    'neuropsychomotor_development', // Desenvolvimento DNPM
    'vaccines',                     // Vacinas
    'pediatric_diagnosis',          // Diagnóstico
    'pediatric_conduct',            // Conduta/Orientações
    'pediatric_evolution',          // Evolução Clínica
    'sinais_vitais',
    'prescricoes',
  ],

  // Ginecologia
  ginecologia: [
    'gyneco_anamnesis',       // Anamnese Ginecológica
    'gyneco_data',            // Dados Ginecológicos
    'obstetric_history',      // Histórico Obstétrico (G/P/A)
    'gyneco_exam',            // Exame Ginecológico
    'gyneco_exams_results',   // Exames/Resultados
    'gyneco_diagnosis',       // Diagnóstico
    'gyneco_conduct',         // Conduta/Prescrição
    'gyneco_evolution',       // Evolução Clínica
    'prescricoes',
  ],

  // Oftalmologia
  oftalmologia: [
    'ophthalmo_anamnesis',          // Anamnese Oftalmológica
    'visual_acuity',                // Acuidade Visual (OD/OE)
    'ophthalmo_exam',               // Exame Oftalmológico
    'intraocular_pressure',         // Pressão Intraocular (OD/OE)
    'ophthalmo_diagnosis',          // Diagnóstico (OD/OE)
    'ophthalmo_complementary_exams', // Exames Complementares
    'ophthalmo_conduct',            // Conduta/Prescrição
    'ophthalmo_evolution',          // Evolução Clínica
    'prescricoes',
  ],

  // Custom / Other specialties - show general tabs
  custom: [
    'anamnese',
    'sinais_vitais',
    'evolucao',
    'diagnostico',
    'prescricoes',
  ],
};

/**
 * Get all visible tabs for a given specialty.
 * Combines base tabs + specialty-specific tabs.
 */
export function getVisibleTabsForSpecialty(specialtyKey: SpecialtyKey): string[] {
  const specialtyTabs = SPECIALTY_TABS[specialtyKey] || SPECIALTY_TABS.geral;
  
  // Combine and deduplicate
  const combined = [...BASE_TABS, ...specialtyTabs];
  return [...new Set(combined)];
}

/**
 * Check if a tab should be visible for the given specialty.
 */
export function isTabVisibleForSpecialty(tabKey: string, specialtyKey: SpecialtyKey): boolean {
  const visibleTabs = getVisibleTabsForSpecialty(specialtyKey);
  return visibleTabs.includes(tabKey);
}

/**
 * Get a human-readable label for a specialty key.
 */
export const SPECIALTY_LABELS: Record<SpecialtyKey, string> = {
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
