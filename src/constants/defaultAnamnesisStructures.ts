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
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NUTRIÇÃO — Modelo Premium Consultório Privado
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const NUTRICAO_STRUCTURE: DefaultSectionDef[] = [
  {
    id: 'objetivo_queixa',
    type: 'section',
    title: 'Objetivo / Queixa Principal',
    fields: [
      { id: 'queixa_principal', type: 'textarea', label: 'Queixa Principal / Objetivo', required: true, placeholder: 'Descreva o objetivo principal da consulta nutricional...' },
    ],
  },
  {
    id: 'historia_alimentar',
    type: 'section',
    title: 'História Alimentar',
    fields: [
      { id: 'rotina_alimentar', type: 'textarea', label: 'Rotina Alimentar', required: false, placeholder: 'Descreva a rotina alimentar detalhada...' },
      { id: 'refeicoes_por_dia', type: 'text', label: 'Nº de Refeições/dia', required: false, placeholder: 'Ex: 5' },
      { id: 'consumo_agua_litros', type: 'text', label: 'Consumo de Água (L/dia)', required: false, placeholder: 'Ex: 2.0' },
      { id: 'consumo_acucar', type: 'select', label: 'Consumo de Açúcar', required: false, options: ['Nenhum', 'Baixo', 'Moderado', 'Alto'] },
      { id: 'consumo_ultraprocessados', type: 'select', label: 'Consumo de Ultraprocessados', required: false, options: ['Nenhum', 'Baixo', 'Moderado', 'Alto'] },
      { id: 'consumo_alcool', type: 'select', label: 'Consumo de Álcool', required: false, options: ['Nenhum', 'Social', 'Moderado', 'Frequente'] },
    ],
  },
  {
    id: 'historico_clinico',
    type: 'section',
    title: 'Histórico Clínico Nutricional',
    fields: [
      { id: 'doencas_associadas', type: 'textarea', label: 'Doenças Associadas', required: false, placeholder: 'Diabetes, hipertensão, dislipidemia...' },
      { id: 'uso_medicamentos', type: 'textarea', label: 'Uso de Medicamentos', required: false, placeholder: 'Medicamentos em uso contínuo...' },
      { id: 'suplementacao', type: 'textarea', label: 'Suplementação', required: false, placeholder: 'Suplementos em uso, dosagem...' },
    ],
  },
  {
    id: 'avaliacao_antropometrica',
    type: 'section',
    title: 'Avaliação Antropométrica',
    fields: [
      { id: 'peso_kg', type: 'text', label: 'Peso (kg)', required: false, placeholder: '70.5' },
      { id: 'altura_cm', type: 'text', label: 'Altura (cm)', required: false, placeholder: '170' },
      { id: 'imc', type: 'text', label: 'IMC (calculado)', required: false, description: 'Calculado automaticamente' },
      { id: 'circunferencia_abdominal_cm', type: 'text', label: 'Circunferência Abdominal (cm)', required: false, placeholder: '85' },
      { id: 'percentual_gordura', type: 'text', label: '% Gordura Corporal', required: false, placeholder: '25' },
      { id: 'massa_magra_kg', type: 'text', label: 'Massa Magra (kg)', required: false, placeholder: '52' },
    ],
  },
  {
    id: 'comportamento_estilo',
    type: 'section',
    title: 'Comportamento e Estilo de Vida',
    fields: [
      { id: 'qualidade_sono', type: 'select', label: 'Qualidade do Sono', required: false, options: ['Ótima', 'Boa', 'Regular', 'Ruim', 'Insônia'] },
      { id: 'nivel_estresse', type: 'select', label: 'Nível de Estresse', required: false, options: ['Baixo', 'Moderado', 'Alto', 'Muito Alto'] },
      { id: 'atividade_fisica', type: 'select', label: 'Atividade Física', required: false, options: ['Sedentário', 'Leve (1-2x/sem)', 'Moderado (3-4x/sem)', 'Intenso (5+x/sem)', 'Atleta'] },
      { id: 'compulsao_alimentar', type: 'textarea', label: 'Compulsão Alimentar', required: false, placeholder: 'Relatos de episódios compulsivos, gatilhos...' },
      { id: 'relacao_emocional_comida', type: 'textarea', label: 'Relação Emocional com a Comida', required: false, placeholder: 'Como o paciente se relaciona emocionalmente com a alimentação...' },
    ],
  },
  {
    id: 'diagnostico_nutricional',
    type: 'section',
    title: 'Diagnóstico Nutricional',
    fields: [
      { id: 'diagnostico_nutricional', type: 'textarea', label: 'Diagnóstico Nutricional', required: false, placeholder: 'Diagnóstico nutricional estruturado...' },
    ],
  },
  {
    id: 'plano_conduta',
    type: 'section',
    title: 'Plano Alimentar / Conduta',
    fields: [
      { id: 'estrategia_nutricional', type: 'textarea', label: 'Estratégia Nutricional', required: false, placeholder: 'Estratégia nutricional adotada...' },
      { id: 'meta_calorica', type: 'text', label: 'Meta Calórica', required: false, placeholder: 'Ex: 1800 kcal/dia' },
      { id: 'distribuicao_macronutrientes', type: 'text', label: 'Distribuição de Macronutrientes', required: false, placeholder: 'Ex: 50% CHO, 25% PTN, 25% LIP' },
      { id: 'orientacoes_gerais', type: 'textarea', label: 'Orientações Gerais', required: false, placeholder: 'Orientações gerais ao paciente...' },
      { id: 'proxima_reavaliacao', type: 'text', label: 'Próxima Reavaliação', required: false, placeholder: 'Data da próxima reavaliação' },
    ],
  },
];

export const DEFAULT_ANAMNESIS_STRUCTURES: Record<string, DefaultSectionDef[]> = {
  'clinica-geral': CLINICA_GERAL_STRUCTURE,
  'geral': CLINICA_GERAL_STRUCTURE,
  'nutricao': NUTRICAO_STRUCTURE,
};

/**
 * Get the default structure for a specialty slug.
 * Returns empty array if no default exists.
 */
export function getDefaultAnamnesisStructure(slug: string): DefaultSectionDef[] {
  return DEFAULT_ANAMNESIS_STRUCTURES[slug] || [];
}
