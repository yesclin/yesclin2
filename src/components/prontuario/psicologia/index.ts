/**
 * PSICOLOGIA - Componentes do Prontuário
 * 
 * Módulos específicos para a especialidade Psicologia.
 * Cada componente é exclusivo desta especialidade e não deve
 * ser reutilizado por outras especialidades.
 */

export { VisaoGeralPsicologiaBlock } from './VisaoGeralPsicologiaBlock';
export type { 
  PsicologiaPatientData, 
  PsicologiaClinicalAlert, 
  PsicologiaSummaryData,
  StatusAcompanhamento,
} from '@/hooks/prontuario/psicologia';
