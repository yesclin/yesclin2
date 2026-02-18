/**
 * Default anamnesis template structures for each specialty.
 * These are used when auto-provisioning templates on specialty activation.
 * 
 * Structure format: Array of sections, each with fields.
 * Compatible with anamnesis_template_versions.structure JSON column.
 */

export interface DefaultFieldDef {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  description?: string;
}

export interface DefaultSectionDef {
  id: string;
  type: 'section';
  title: string;
  fields: DefaultFieldDef[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLÍNICA GERAL — Modelo Premium Consultório Privado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CLINICA_GERAL_STRUCTURE: DefaultSectionDef[] = [
  // BLOCO 1 – Motivo da Consulta
  {
    id: 'motivo_consulta',
    type: 'section',
    title: 'Motivo da Consulta',
    fields: [
      { id: 'qp_descricao', type: 'textarea', label: 'Queixa Principal', required: true, placeholder: 'Descreva o motivo da consulta nas palavras do paciente...' },
    ],
  },

  // BLOCO 2 – História Atual
  {
    id: 'historia_atual',
    type: 'section',
    title: 'História Atual',
    fields: [
      { id: 'hda_descricao', type: 'textarea', label: 'História da Doença Atual', required: false, placeholder: 'Descreva a evolução do quadro clínico...' },
      { id: 'hda_inicio', type: 'text', label: 'Início dos sintomas', required: false, placeholder: 'Ex: Há 3 dias, após esforço físico' },
      { id: 'hda_evolucao', type: 'text', label: 'Evolução', required: false, placeholder: 'Progressiva, estável, intermitente...' },
      { id: 'hda_intensidade', type: 'select', label: 'Intensidade (0-10)', required: false, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
    ],
  },

  // BLOCO 3 – Contexto Clínico
  {
    id: 'contexto_clinico',
    type: 'section',
    title: 'Contexto Clínico',
    fields: [
      { id: 'antecedentes', type: 'textarea', label: 'Antecedentes Pessoais', required: false, placeholder: 'Doenças prévias, cirurgias, internações...' },
      { id: 'medicamentos', type: 'textarea', label: 'Medicamentos em Uso', required: false, placeholder: 'Medicamentos contínuos, dosagem...' },
      { id: 'historia_familiar', type: 'textarea', label: 'História Familiar', required: false, placeholder: 'Doenças relevantes na família...' },
      { id: 'hab_tabagismo', type: 'select', label: 'Tabagismo', required: false, options: ['Nunca fumou','Ex-fumante','Fumante ativo'] },
      { id: 'hab_etilismo', type: 'select', label: 'Etilismo', required: false, options: ['Não','Social','Moderado','Frequente'] },
      { id: 'hab_atividade', type: 'select', label: 'Atividade Física', required: false, options: ['Sedentário','Eventual','Regular','Diária'] },
      { id: 'hab_sono', type: 'select', label: 'Sono', required: false, options: ['Bom','Regular','Ruim','Insônia'] },
    ],
  },

  // BLOCO 4 – Impressão e Conduta
  {
    id: 'impressao_conduta',
    type: 'section',
    title: 'Impressão e Conduta',
    fields: [
      { id: 'hd_descricao', type: 'textarea', label: 'Hipótese Diagnóstica', required: false, placeholder: 'Hipóteses diagnósticas / CID-10...' },
      { id: 'pc_descricao', type: 'textarea', label: 'Plano / Conduta', required: false, placeholder: 'Prescrições, orientações, encaminhamentos, retorno...' },
    ],
  },
];

/**
 * Map of specialty slugs to their default structures.
 * Add new specialties here as needed.
 */
export const DEFAULT_ANAMNESIS_STRUCTURES: Record<string, DefaultSectionDef[]> = {
  'clinica-geral': CLINICA_GERAL_STRUCTURE,
  'geral': CLINICA_GERAL_STRUCTURE,
};

/**
 * Get the default structure for a specialty slug.
 * Returns empty array if no default exists.
 */
export function getDefaultAnamnesisStructure(slug: string): DefaultSectionDef[] {
  return DEFAULT_ANAMNESIS_STRUCTURES[slug] || [];
}
