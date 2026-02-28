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
export { EvolucaoCasalBlock } from './EvolucaoCasalBlock';
export { PlanoTerapeuticoBlock } from './PlanoTerapeuticoBlock';
export { MetasTerapeuticasBlock } from './MetasTerapeuticasBlock';
export { InstrumentosPsicologicosBlock } from './InstrumentosPsicologicosBlock';
export { TermosConsentimentosPsicologiaBlock } from './TermosConsentimentosPsicologiaBlock';
export { AlertasPsicologiaBlock } from './AlertasPsicologiaBlock';
export { AlertasBannerPsicologia } from './AlertasBannerPsicologia';
export { HistoricoPsicologiaBlock } from './HistoricoPsicologiaBlock';

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
  PlanoTerapeuticoData,
  PlanoTerapeuticoFormData,
  InstrumentoPsicologico,
  InstrumentoFormData,
} from '@/hooks/prontuario/psicologia';

export type {
  AlertaPsicologia,
  TipoAlertaPsicologia,
  SeveridadeAlerta,
} from './AlertasPsicologiaBlock';
