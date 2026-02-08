// Pediatria - Prontuário Blocks

// Visão Geral
export { 
  VisaoGeralPediatriaBlock,
  type PediatricPatientInfo,
  type PediatricGuardian,
  type PediatricAlert,
  type PediatricDiagnosis,
  type LastAppointmentInfo,
} from './VisaoGeralPediatriaBlock';

// Crescimento e Desenvolvimento
export { 
  CrescimentoDesenvolvimentoBlock,
  MILESTONE_CATEGORIES,
  MILESTONE_STATUS_CONFIG,
  DEFAULT_MILESTONES,
  type GrowthMeasurement,
  type DevelopmentMilestone,
  type MilestoneCategory,
  type GrowthFormData,
} from './CrescimentoDesenvolvimentoBlock';

// Anamnese Pediátrica
export {
  AnamnesePediatriaBlock,
  DELIVERY_TYPES,
  FEEDING_TYPES,
  type AnamnesePediatriaData,
  type AnamnesePediatriaRecord,
  type MedicationItem,
} from './AnamnesePediatriaBlock';
