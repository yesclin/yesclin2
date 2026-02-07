/**
 * Hooks especializados para o prontuário de Pilates
 */

export { 
  useAvaliacaoFuncionalPilatesData,
  getEmptyAvaliacaoFormPilates,
  MOBILIDADE_OPTIONS,
  FORCA_FUNCIONAL_OPTIONS,
  EQUILIBRIO_PILATES_OPTIONS,
  CORE_CONTROL_OPTIONS,
  RESPIRACAO_OPTIONS,
  REGIOES_MOBILIDADE,
  TESTES_FUNCIONAIS_PILATES,
  type AvaliacaoFuncionalPilatesData,
  type AvaliacaoFuncionalPilatesFormData,
} from './useAvaliacaoFuncionalPilatesData';

export {
  useVisaoGeralPilatesData,
  STATUS_ACOMPANHAMENTO_PILATES,
  OBJETIVOS_PILATES,
  type PilatesPatientData,
  type PilatesSummaryData,
  type PilatesAlert,
} from './useVisaoGeralPilatesData';

export {
  useAnamneseFuncionalPilatesData,
  getEmptyAnamneseFuncionalPilatesForm,
  NIVEL_ATIVIDADE_OPTIONS,
  OBJETIVOS_PILATES_OPTIONS,
  type AnamneseFuncionalPilatesData,
  type AnamneseFuncionalPilatesFormData,
} from './useAnamneseFuncionalPilatesData';

export {
  useAvaliacaoPosturalPilatesData,
  getEmptyAvaliacaoPosturalForm,
  ALINHAMENTO_OPTIONS,
  REGIOES_POSTURAIS,
  DESVIOS_POSTURAIS_OPTIONS,
  ENCURTAMENTOS_OPTIONS,
  type AvaliacaoPosturalPilatesData,
  type AvaliacaoPosturalPilatesFormData,
  type ImagemPostural,
} from './useAvaliacaoPosturalPilatesData';

export {
  usePlanoExerciciosPilatesData,
  getEmptyPlanoExerciciosForm,
  createEmptyExercicio,
  APARELHOS_PILATES,
  FOCOS_TREINO,
  EXERCICIOS_PILATES,
  type PlanoExerciciosPilatesData,
  type PlanoExerciciosPilatesFormData,
  type ExercicioPrescrito,
} from './usePlanoExerciciosPilatesData';
