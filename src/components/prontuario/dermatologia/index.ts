/**
 * DERMATOLOGIA - Módulo do Prontuário
 * 
 * Componentes específicos para a especialidade de Dermatologia.
 * Foco em diagnóstico dermatológico, acompanhamento clínico e prescrição médica.
 */

export { VisaoGeralDermatoBlock } from './VisaoGeralDermatoBlock';
export type { 
  DermatoPatientData,
  DermatoClinicalData,
  DermatoAlertItem,
  DermatoLastAppointment 
} from './VisaoGeralDermatoBlock';

export { AnamneseDermatoBlock } from './AnamneseDermatoBlock';
export type { 
  AnamneseDermatoData,
  DermatoSymptoms 
} from './AnamneseDermatoBlock';

export { ExameDermatoBlock } from './ExameDermatoBlock';
export type { 
  ExameDermatoData,
  LesionDescription 
} from './ExameDermatoBlock';
export { 
  LESION_TYPES,
  BODY_LOCATIONS,
  LESION_COLORS,
  LESION_SHAPES,
  LESION_BORDERS,
  LESION_SURFACES,
  DISTRIBUTION_PATTERNS 
} from './ExameDermatoBlock';

export { DiagnosticoDermatoBlock } from './DiagnosticoDermatoBlock';
export type { DiagnosticoDermatoData } from './DiagnosticoDermatoBlock';

export { PrescricoesDermatoBlock } from './PrescricoesDermatoBlock';
export type { 
  PrescricaoDermatoData,
  PrescriptionItem 
} from './PrescricoesDermatoBlock';
export { 
  PHARMACEUTICAL_FORMS,
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS 
} from './PrescricoesDermatoBlock';
