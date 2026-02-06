/**
 * NUTRIÇÃO - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Nutrição.
 * Exporta todos os hooks e tipos necessários para o prontuário nutricional.
 */

// Visão Geral
export { useVisaoGeralNutricaoData } from './useVisaoGeralNutricaoData';
export type { 
  NutricaoPatientData, 
  NutricaoSummaryData,
  LastMeasurement,
  ObjetivoNutricional,
} from './useVisaoGeralNutricaoData';

// Avaliação Nutricional
export { useAvaliacaoNutricionalData, calculateWaistHipRatio } from './useAvaliacaoNutricionalData';
export type { 
  AvaliacaoNutricional,
  AvaliacaoNutricionalFormData,
} from './useAvaliacaoNutricionalData';

// Recordatório Alimentar
export { 
  useRecordatorioAlimentarData,
  TIPO_REFEICAO_LABELS,
  FREQUENCIA_LABELS,
} from './useRecordatorioAlimentarData';
export type { 
  RecordatorioAlimentar,
  RecordatorioFormData,
  Refeicao,
  TipoRecordatorio,
} from './useRecordatorioAlimentarData';

// Plano Alimentar
export { 
  usePlanoAlimentarData,
  DEFAULT_REFEICOES,
} from './usePlanoAlimentarData';
export type { 
  PlanoAlimentar,
  PlanoAlimentarFormData,
  RefeicaoPlano,
  OpcaoRefeicao,
  MacrosPlano,
  StatusPlano,
} from './usePlanoAlimentarData';

// Metas Nutricionais
export { 
  useMetasNutricionaisData,
  TIPO_META_LABELS,
  STATUS_META_LABELS,
  PRIORIDADE_META_LABELS,
} from './useMetasNutricionaisData';
export type { 
  MetaNutricional,
  MetaFormData,
  AcompanhamentoMeta,
  StatusMeta,
  TipoMeta,
  PrioridadeMeta,
} from './useMetasNutricionaisData';

// Evoluções Nutricionais
export { 
  useEvolucoesNutricaoData,
  TIPO_CONSULTA_LABELS,
  SINTOMAS_GI_OPTIONS,
} from './useEvolucoesNutricaoData';
export type { 
  EvolucaoNutricao,
  EvolucaoNutricaoFormData,
  StatusEvolucao,
  TipoConsulta,
} from './useEvolucoesNutricaoData';
