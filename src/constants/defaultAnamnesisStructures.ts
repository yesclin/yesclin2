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
// CLÍNICA GERAL — Anamnese Padrão Completa
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CLINICA_GERAL_STRUCTURE: DefaultSectionDef[] = [
  // 1. Identificação Complementar (dados básicos vêm do cadastro do paciente)
  {
    id: 'section_identificacao',
    type: 'section',
    title: 'Identificação Complementar',
    fields: [
      { id: 'f_data_atendimento', type: 'date', label: 'Data do atendimento', required: true },
      { id: 'f_profissional', type: 'text', label: 'Profissional responsável', required: true },
      { id: 'f_estado_civil', type: 'select', label: 'Estado civil', required: false, options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'] },
      { id: 'f_profissao', type: 'text', label: 'Profissão', required: false, placeholder: 'Ex: Engenheiro' },
      { id: 'f_naturalidade', type: 'text', label: 'Naturalidade', required: false },
      { id: 'f_escolaridade', type: 'select', label: 'Escolaridade', required: false, options: ['Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior incompleto', 'Superior completo', 'Pós-graduação'] },
      { id: 'f_informacoes_complementares', type: 'textarea', label: 'Informações complementares', required: false, placeholder: 'Outras informações relevantes para o atendimento...' },
    ],
  },

  // 2. Queixa Principal
  {
    id: 'section_queixa_principal',
    type: 'section',
    title: 'Queixa Principal',
    fields: [
      { id: 'f_qp', type: 'textarea', label: 'Queixa principal (QP)', required: true, placeholder: 'Descreva a queixa principal do paciente nas palavras dele...', description: 'Registre a queixa principal nas palavras do próprio paciente.' },
      { id: 'f_qp_duracao', type: 'text', label: 'Duração dos sintomas', required: false, placeholder: 'Ex: há 3 dias, há 2 semanas' },
    ],
  },

  // 3. História da Doença Atual (HDA)
  {
    id: 'section_hda',
    type: 'section',
    title: 'História da Doença Atual (HDA)',
    fields: [
      { id: 'f_hda_onset', type: 'text', label: 'Início (Onset) — Quando começou?', required: false, placeholder: 'Ex: Há 5 dias, após esforço físico' },
      { id: 'f_hda_provocacao', type: 'textarea', label: 'Provocação / Paliação — O que piora ou melhora?', required: false, placeholder: 'Fatores agravantes e atenuantes...' },
      { id: 'f_hda_qualidade', type: 'textarea', label: 'Qualidade — Como é o sintoma?', required: false, placeholder: 'Pontada, queimação, pressão, contínua...' },
      { id: 'f_hda_regiao', type: 'text', label: 'Região / Irradiação', required: false, placeholder: 'Ex: Precordial, irradiando para o braço esquerdo' },
      { id: 'f_hda_severidade', type: 'select', label: 'Severidade (escala 0-10)', required: false, options: ['0 - Sem dor', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10 - Pior dor possível'] },
      { id: 'f_hda_tempo', type: 'textarea', label: 'Tempo / Cronologia — Evolução temporal', required: false, placeholder: 'Contínua, intermitente, progressiva...' },
      { id: 'f_hda_sintomas_associados', type: 'textarea', label: 'Sintomas associados', required: false, placeholder: 'Náusea, febre, dispneia, sudorese...' },
      { id: 'f_hda_tratamentos_previos', type: 'textarea', label: 'Tratamentos prévios para esta queixa', required: false, placeholder: 'Medicamentos, procedimentos já realizados...' },
    ],
  },

  // 4. Antecedentes Pessoais (HPP)
  {
    id: 'section_antecedentes_pessoais',
    type: 'section',
    title: 'Antecedentes Pessoais (HPP)',
    fields: [
      { id: 'f_hpp_doencas', type: 'textarea', label: 'Doenças crônicas', required: false, placeholder: 'HAS, DM, Asma, Cardiopatia, Hipotireoidismo...' },
      { id: 'f_hpp_cirurgias', type: 'textarea', label: 'Cirurgias prévias', required: false, placeholder: 'Tipo, ano, complicações...' },
      { id: 'f_hpp_internacoes', type: 'textarea', label: 'Internações anteriores', required: false, placeholder: 'Motivo, data, duração...' },
      { id: 'f_hpp_transfusoes', type: 'select', label: 'Transfusões sanguíneas', required: false, options: ['Nunca', 'Sim, sem reações', 'Sim, com reações'] },
      { id: 'f_hpp_traumas', type: 'textarea', label: 'Traumas / Fraturas', required: false },
      { id: 'f_hpp_vacinacao', type: 'select', label: 'Vacinação em dia', required: false, options: ['Sim', 'Não', 'Não sabe'] },
      { id: 'f_hpp_gineco', type: 'textarea', label: 'Ginecológico / Obstétrico (se aplicável)', required: false, placeholder: 'G_P_A_, DUM, métodos contraceptivos...' },
    ],
  },

  // 5. Histórico Familiar
  {
    id: 'section_historico_familiar',
    type: 'section',
    title: 'Histórico Familiar',
    fields: [
      { id: 'f_hf_has', type: 'checkbox', label: 'Hipertensão arterial', required: false },
      { id: 'f_hf_dm', type: 'checkbox', label: 'Diabetes mellitus', required: false },
      { id: 'f_hf_cardio', type: 'checkbox', label: 'Doenças cardiovasculares', required: false },
      { id: 'f_hf_cancer', type: 'checkbox', label: 'Câncer', required: false },
      { id: 'f_hf_psiquiatrica', type: 'checkbox', label: 'Doenças psiquiátricas', required: false },
      { id: 'f_hf_autoimune', type: 'checkbox', label: 'Doenças autoimunes', required: false },
      { id: 'f_hf_detalhes', type: 'textarea', label: 'Detalhes e parentesco', required: false, placeholder: 'Ex: Pai faleceu de IAM aos 55a, mãe DM2...' },
    ],
  },

  // 6. Hábitos de Vida
  {
    id: 'section_habitos',
    type: 'section',
    title: 'Hábitos de Vida',
    fields: [
      { id: 'f_hab_tabagismo', type: 'select', label: 'Tabagismo', required: false, options: ['Nunca fumou', 'Ex-fumante', 'Fumante ativo'] },
      { id: 'f_hab_tabagismo_detalhe', type: 'text', label: 'Se fumante/ex-fumante, detalhar', required: false, placeholder: 'Quantidade, anos-maço...' },
      { id: 'f_hab_etilismo', type: 'select', label: 'Etilismo', required: false, options: ['Não', 'Social', 'Moderado', 'Frequente'] },
      { id: 'f_hab_drogas', type: 'select', label: 'Uso de drogas ilícitas', required: false, options: ['Nega uso', 'Uso prévio', 'Uso atual'] },
      { id: 'f_hab_atividade', type: 'select', label: 'Atividade física', required: false, options: ['Sedentário', 'Eventual', '1-3x/semana', '4-5x/semana', 'Diária'] },
      { id: 'f_hab_alimentacao', type: 'textarea', label: 'Padrão alimentar', required: false, placeholder: 'Descreva resumidamente o padrão alimentar...' },
      { id: 'f_hab_sono', type: 'select', label: 'Qualidade do sono', required: false, options: ['Bom', 'Regular', 'Ruim', 'Insônia'] },
      { id: 'f_hab_sono_horas', type: 'number', label: 'Horas de sono/noite', required: false, placeholder: 'Ex: 7' },
    ],
  },

  // 7. Medicamentos e Alergias
  {
    id: 'section_medicamentos_alergias',
    type: 'section',
    title: 'Medicamentos em Uso e Alergias',
    fields: [
      { id: 'f_med_uso', type: 'textarea', label: 'Medicamentos em uso contínuo', required: false, placeholder: 'Nome, dose, posologia...' },
      { id: 'f_med_suplementos', type: 'textarea', label: 'Suplementos e fitoterápicos', required: false },
      { id: 'f_alergias_med', type: 'textarea', label: 'Alergias a medicamentos', required: false, placeholder: 'Nome do medicamento e tipo de reação...' },
      { id: 'f_alergias_outras', type: 'textarea', label: 'Outras alergias', required: false, placeholder: 'Alimentos, látex, contrastes...' },
    ],
  },

  // 8. Exame Físico
  {
    id: 'section_exame_fisico',
    type: 'section',
    title: 'Exame Físico',
    fields: [
      { id: 'f_ef_pa', type: 'text', label: 'Pressão Arterial (mmHg)', required: false, placeholder: 'Ex: 120x80' },
      { id: 'f_ef_fc', type: 'number', label: 'Frequência Cardíaca (bpm)', required: false, placeholder: 'Ex: 72' },
      { id: 'f_ef_fr', type: 'number', label: 'Frequência Respiratória (irpm)', required: false, placeholder: 'Ex: 16' },
      { id: 'f_ef_temp', type: 'number', label: 'Temperatura (°C)', required: false, placeholder: 'Ex: 36.5' },
      { id: 'f_ef_spo2', type: 'number', label: 'SpO₂ (%)', required: false, placeholder: 'Ex: 98' },
      { id: 'f_ef_peso', type: 'number', label: 'Peso (kg)', required: true, placeholder: 'Ex: 75.5' },
      { id: 'f_ef_altura', type: 'number', label: 'Altura (cm)', required: true, placeholder: 'Ex: 172' },
      { id: 'f_ef_imc', type: 'calculated', label: 'IMC (calculado)', required: false, description: 'Calculado automaticamente a partir de peso e altura.' },
      { id: 'f_ef_estado_geral', type: 'select', label: 'Estado geral', required: false, options: ['Bom', 'Regular', 'Ruim', 'Grave'] },
      { id: 'f_ef_inspecao', type: 'textarea', label: 'Inspeção geral', required: false, placeholder: 'Lúcido, orientado, corado, hidratado, acianótico, anictérico...' },
      { id: 'f_ef_cardiovascular', type: 'textarea', label: 'Aparelho cardiovascular', required: false, placeholder: 'RCR 2T, BNF, sem sopros...' },
      { id: 'f_ef_respiratorio', type: 'textarea', label: 'Aparelho respiratório', required: false, placeholder: 'MV presente bilateralmente, sem RA...' },
      { id: 'f_ef_abdome', type: 'textarea', label: 'Abdome', required: false, placeholder: 'Plano, flácido, indolor à palpação, RHA+...' },
      { id: 'f_ef_membros', type: 'textarea', label: 'Membros / Extremidades', required: false, placeholder: 'Sem edema, pulsos palpáveis e simétricos...' },
      { id: 'f_ef_neurologico', type: 'textarea', label: 'Exame neurológico sumário', required: false, placeholder: 'Glasgow 15, pupilas isocóricas e fotorreagentes...' },
      { id: 'f_ef_outros', type: 'textarea', label: 'Outros achados', required: false },
    ],
  },

  // 9. Hipóteses Diagnósticas
  {
    id: 'section_hipoteses',
    type: 'section',
    title: 'Hipóteses Diagnósticas',
    fields: [
      { id: 'f_hd_principal', type: 'textarea', label: 'Hipótese diagnóstica principal', required: false, placeholder: 'CID-10 e descrição...' },
      { id: 'f_hd_diferenciais', type: 'textarea', label: 'Diagnósticos diferenciais', required: false, placeholder: 'Liste as hipóteses diferenciais...' },
      { id: 'f_hd_exames', type: 'textarea', label: 'Exames complementares solicitados', required: false, placeholder: 'Hemograma, glicemia, ECG...' },
    ],
  },

  // 10. Plano / Conduta
  {
    id: 'section_conduta',
    type: 'section',
    title: 'Plano / Conduta',
    fields: [
      { id: 'f_conduta_plano', type: 'textarea', label: 'Plano terapêutico', required: false, placeholder: 'Prescrição, orientações, procedimentos...' },
      { id: 'f_conduta_encaminhamento', type: 'textarea', label: 'Encaminhamentos', required: false, placeholder: 'Especialidades, exames de imagem...' },
      { id: 'f_conduta_retorno', type: 'text', label: 'Retorno previsto', required: false, placeholder: 'Ex: em 15 dias, em 1 mês' },
      { id: 'f_conduta_observacoes', type: 'textarea', label: 'Observações gerais', required: false, placeholder: 'Informações adicionais, sinais de alerta para o paciente...' },
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
