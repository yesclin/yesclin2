/**
 * NUTRIÇÃO - Componentes do Prontuário
 * 
 * Exporta todos os componentes de blocos clínicos para a especialidade Nutrição.
 */

export { VisaoGeralNutricaoBlock } from './VisaoGeralNutricaoBlock';
export { AvaliacaoNutricionalBlock } from './AvaliacaoNutricionalBlock';
export { AvaliacaoEvolutionChart } from './AvaliacaoEvolutionChart';
export { PlanoAlimentarBlock } from './PlanoAlimentarBlock';
export { MetasNutricionaisBlock } from './MetasNutricionaisBlock';
export { EvolucoesNutricaoBlock } from './EvolucoesNutricaoBlock';
export { AnamneseNutricionalBlock } from './AnamneseNutricionalBlock';
export { AvaliacaoClinicaBlock } from './AvaliacaoClinicaBlock';
export { DiagnosticoNutricionalBlock } from './DiagnosticoNutricionalBlock';

// Reutiliza o bloco de Documentos da Clínica Geral (mesma estrutura)
export { DocumentosBlock as DocumentosNutricaoBlock } from '@/components/prontuario/clinica-geral/DocumentosBlock';
export type { Documento, CategoriaDocumento } from '@/components/prontuario/clinica-geral/DocumentosBlock';
