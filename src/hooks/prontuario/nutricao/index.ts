/**
 * NUTRIÇÃO - Hooks do Prontuário
 * 
 * Hooks específicos para a especialidade Nutrição.
 * Exporta todos os hooks e tipos necessários para o prontuário nutricional.
 */

// Visão Geral
export { useVisaoGeralNutricaoData, OBJETIVO_NUTRICIONAL_LABELS, STATUS_ACOMPANHAMENTO_LABELS } from './useVisaoGeralNutricaoData';
export type { 
  NutricaoPatientData,
  NutricaoSummaryData,
  NutricaoAlert,
  LastMeasurement,
  ObjetivoNutricional,
  StatusAcompanhamento,
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

// Anamnese Nutricional
export { 
  useAnamneseNutricionalData,
  FREQUENCIA_CONSUMO_LABELS,
  RESTRICOES_ALIMENTARES_OPTIONS,
  INTOLERANCIAS_OPTIONS,
  ALERGIAS_ALIMENTARES_OPTIONS,
} from './useAnamneseNutricionalData';
export type { 
  AnamneseNutricional,
  AnamneseNutricionalFormData,
  FrequenciaConsumo,
} from './useAnamneseNutricionalData';

// Avaliação Clínica / Bioquímica
export { 
  useAvaliacaoClinicaData,
  SINAIS_SINTOMAS_NUTRICAO,
  EXAMES_COMUNS_NUTRICAO,
} from './useAvaliacaoClinicaData';
export type { 
  AvaliacaoClinica,
  AvaliacaoClinicaFormData,
  ExameLaboratorial,
} from './useAvaliacaoClinicaData';

// Diagnóstico Nutricional
export { 
  useDiagnosticoNutricionalData,
  DIAGNOSTICOS_NUTRICIONAIS_COMUNS,
  STATUS_DIAGNOSTICO_LABELS,
} from './useDiagnosticoNutricionalData';
export type { 
  DiagnosticoNutricional,
  DiagnosticoFormData,
  StatusDiagnostico,
} from './useDiagnosticoNutricionalData';
