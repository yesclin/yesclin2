/**
 * PSICOLOGIA - Componentes do Prontuário
 * 
 * Módulos específicos para a especialidade Psicologia.
 * Cada componente é exclusivo desta especialidade e não deve
 * ser reutilizado por outras especialidades.
 */

export { VisaoGeralPsicologiaBlock } from './VisaoGeralPsicologiaBlock';
export { AnamnesePsicologiaBlock } from './AnamnesePsicologiaBlock';
export { SessoesPsicologiaBlock } from './SessoesPsicologiaBlock';

export type { 
  PsicologiaPatientData, 
  PsicologiaClinicalAlert, 
  PsicologiaSummaryData,
  StatusAcompanhamento,
  AnamnesePsicologiaData,
  AnamnesePsicologiaFormData,
  SessaoPsicologia,
  SessaoFormData,
  StatusSessao,
} from '@/hooks/prontuario/psicologia';
