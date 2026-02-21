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
  // BLOCO 1 — Queixa Principal
  {
    id: 'section_queixa_principal', type: 'section', title: 'Queixa Principal',
    fields: [
      { id: 'f_queixa_principal', type: 'textarea', label: 'Queixa principal', required: true, placeholder: 'Descreva a queixa principal do paciente nas palavras dele...' },
    ],
  },
  // BLOCO 2 — História da Doença Atual (HDA)
  {
    id: 'section_hda', type: 'section', title: 'História da Doença Atual (HDA)',
    fields: [
      { id: 'f_hda_inicio', type: 'text', label: 'Início dos sintomas', required: false, placeholder: 'Ex: Há 3 dias, após esforço físico' },
      { id: 'f_hda_evolucao', type: 'textarea', label: 'Evolução', required: false, placeholder: 'Progressiva, estável, intermitente...' },
      { id: 'f_hda_localizacao_irradiacao', type: 'text', label: 'Localização / Irradiação', required: false, placeholder: 'Ex: Precordial, irradiando para braço esquerdo' },
      { id: 'f_hda_intensidade', type: 'select', label: 'Intensidade (0-10)', required: false, options: ['0','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'f_hda_sintomas_associados', type: 'textarea', label: 'Sintomas associados', required: false, placeholder: 'Náusea, febre, dispneia, sudorese...' },
      { id: 'f_hda_piora_melhora', type: 'textarea', label: 'Fatores de piora / melhora', required: false, placeholder: 'O que piora e o que alivia os sintomas...' },
      { id: 'f_hda_tratamentos_previos', type: 'textarea', label: 'Tratamentos prévios', required: false, placeholder: 'Medicamentos, procedimentos já realizados...' },
    ],
  },
  // BLOCO 3 — Revisão de Sistemas
  {
    id: 'section_revisao_sistemas', type: 'section', title: 'Revisão de Sistemas',
    fields: [
      { id: 'f_rs_febre', type: 'select', label: 'Febre', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_febre_obs', type: 'text', label: 'Febre — observação', required: false, placeholder: 'Detalhes...' },
      { id: 'f_rs_perda_peso', type: 'select', label: 'Perda de peso', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_perda_peso_obs', type: 'text', label: 'Perda de peso — observação', required: false, placeholder: 'Quanto, em quanto tempo...' },
      { id: 'f_rs_dispneia', type: 'select', label: 'Dispneia', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_dispneia_obs', type: 'text', label: 'Dispneia — observação', required: false, placeholder: 'Aos esforços, em repouso...' },
      { id: 'f_rs_dor_toracica', type: 'select', label: 'Dor torácica', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_dor_toracica_obs', type: 'text', label: 'Dor torácica — observação', required: false, placeholder: 'Tipo, duração...' },
      { id: 'f_rs_nauseas_vomitos', type: 'select', label: 'Náuseas / Vômitos', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_nauseas_obs', type: 'text', label: 'Náuseas — observação', required: false, placeholder: 'Frequência, gatilhos...' },
      { id: 'f_rs_intestinal', type: 'select', label: 'Alterações intestinais', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_intestinal_obs', type: 'text', label: 'Intestinal — observação', required: false, placeholder: 'Constipação, diarreia...' },
      { id: 'f_rs_urinario', type: 'select', label: 'Alterações urinárias', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_urinario_obs', type: 'text', label: 'Urinário — observação', required: false, placeholder: 'Disúria, polaciúria...' },
      { id: 'f_rs_cefaleia_tontura', type: 'select', label: 'Cefaleia / Tontura', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_cefaleia_obs', type: 'text', label: 'Cefaleia — observação', required: false, placeholder: 'Tipo, frequência...' },
      { id: 'f_rs_edema', type: 'select', label: 'Edema', required: false, options: ['Não','Sim'] },
      { id: 'f_rs_edema_obs', type: 'text', label: 'Edema — observação', required: false, placeholder: 'Localização, intensidade...' },
      { id: 'f_rs_outros', type: 'textarea', label: 'Outros achados na revisão', required: false, placeholder: 'Outros sintomas relevantes...' },
    ],
  },
  // BLOCO 4 — Antecedentes Pessoais
  {
    id: 'section_antecedentes_pessoais', type: 'section', title: 'Antecedentes Pessoais',
    fields: [
      { id: 'f_ap_doencas_preexistentes', type: 'textarea', label: 'Doenças pré-existentes', required: false, placeholder: 'HAS, DM, Asma, Cardiopatia...' },
      { id: 'f_ap_internacoes_previas', type: 'textarea', label: 'Internações prévias', required: false, placeholder: 'Motivo, data, duração...' },
      { id: 'f_ap_cirurgias_previas', type: 'textarea', label: 'Cirurgias prévias', required: false, placeholder: 'Tipo, ano, complicações...' },
      { id: 'f_ap_alergias', type: 'textarea', label: 'Alergias', required: false, placeholder: 'Medicamentos, alimentos, contrastes, látex...' },
      { id: 'f_ap_imunizacoes', type: 'text', label: 'Imunizações', required: false, placeholder: 'Em dia, pendências...' },
      { id: 'f_ap_gineco_obstetrico', type: 'textarea', label: 'Ginecológico / Obstétrico (se aplicável)', required: false, placeholder: 'G_P_A_, DUM, contraceptivos...' },
    ],
  },
  // BLOCO 5 — Medicamentos / Tratamentos
  {
    id: 'section_medicamentos', type: 'section', title: 'Medicamentos / Tratamentos',
    fields: [
      { id: 'f_med_em_uso', type: 'textarea', label: 'Medicamentos em uso', required: false, placeholder: 'Nome, dose, posologia...' },
      { id: 'f_med_aderencia', type: 'select', label: 'Aderência ao tratamento', required: false, options: ['Boa','Irregular','Baixa'] },
      { id: 'f_med_aderencia_obs', type: 'text', label: 'Observação sobre aderência', required: false, placeholder: 'Detalhes...' },
      { id: 'f_med_suplementos', type: 'textarea', label: 'Suplementos / Fitoterápicos', required: false, placeholder: 'Suplementos em uso...' },
    ],
  },
  // BLOCO 6 — Antecedentes Familiares
  {
    id: 'section_antecedentes_familiares', type: 'section', title: 'Antecedentes Familiares',
    fields: [
      { id: 'f_af_historico', type: 'textarea', label: 'Histórico familiar', required: false, placeholder: 'Pai IAM aos 55a, mãe DM2, irmão HAS...' },
    ],
  },
  // BLOCO 7 — Hábitos de Vida
  {
    id: 'section_habitos_vida', type: 'section', title: 'Hábitos de Vida',
    fields: [
      { id: 'f_hv_tabagismo', type: 'select', label: 'Tabagismo', required: false, options: ['Nunca fumou','Ex-fumante','Fumante ativo'] },
      { id: 'f_hv_tabagismo_macos', type: 'text', label: 'Maços/ano (se aplicável)', required: false, placeholder: 'Ex: 20 maços/ano' },
      { id: 'f_hv_etilismo', type: 'select', label: 'Etilismo', required: false, options: ['Não','Ocasional','Frequente'] },
      { id: 'f_hv_etilismo_qtd', type: 'text', label: 'Quantidade (se aplicável)', required: false, placeholder: 'Ex: 2 cervejas/semana' },
      { id: 'f_hv_drogas', type: 'select', label: 'Uso de drogas ilícitas', required: false, options: ['Não','Sim'] },
      { id: 'f_hv_drogas_quais', type: 'text', label: 'Quais drogas (se aplicável)', required: false, placeholder: 'Especificar...' },
      { id: 'f_hv_atividade_fisica', type: 'text', label: 'Atividade física', required: false, placeholder: 'Ex: Caminhada 3x/semana, 30min' },
      { id: 'f_hv_alimentacao', type: 'textarea', label: 'Padrão alimentar', required: false, placeholder: 'Descreva resumidamente...' },
      { id: 'f_hv_sono', type: 'text', label: 'Sono', required: false, placeholder: 'Ex: 7h/noite, fragmentado' },
      { id: 'f_hv_estresse_trabalho', type: 'textarea', label: 'Estresse / Trabalho', required: false, placeholder: 'Nível de estresse, carga de trabalho...' },
    ],
  },
  // BLOCO 8 — Exame Físico
  {
    id: 'section_exame_fisico', type: 'section', title: 'Exame Físico',
    fields: [
      { id: 'f_ef_estado_geral', type: 'text', label: 'Estado geral', required: false, placeholder: 'BEG, lúcido, orientado, corado, hidratado...' },
      { id: 'f_ef_pa', type: 'text', label: 'PA (mmHg)', required: false, placeholder: 'Ex: 120x80' },
      { id: 'f_ef_fc', type: 'text', label: 'FC (bpm)', required: false, placeholder: 'Ex: 72' },
      { id: 'f_ef_fr', type: 'text', label: 'FR (irpm)', required: false, placeholder: 'Ex: 16' },
      { id: 'f_ef_temp', type: 'text', label: 'Temperatura (°C)', required: false, placeholder: 'Ex: 36.5' },
      { id: 'f_ef_spo2', type: 'text', label: 'SpO₂ (%)', required: false, placeholder: 'Ex: 98' },
      { id: 'f_ef_cabeca_pescoco', type: 'textarea', label: 'Cabeça e Pescoço', required: false, placeholder: 'Oroscopia, otoscopia, linfonodos...' },
      { id: 'f_ef_cardio', type: 'textarea', label: 'Cardiovascular', required: false, placeholder: 'RCR 2T, BNF, sem sopros...' },
      { id: 'f_ef_respiratorio', type: 'textarea', label: 'Respiratório', required: false, placeholder: 'MV presente bilateralmente, sem RA...' },
      { id: 'f_ef_abdome', type: 'textarea', label: 'Abdome', required: false, placeholder: 'Plano, flácido, indolor à palpação, RHA+...' },
      { id: 'f_ef_neurologico', type: 'textarea', label: 'Neurológico', required: false, placeholder: 'Glasgow 15, pupilas isocóricas, sem déficits...' },
      { id: 'f_ef_pele_extremidades', type: 'textarea', label: 'Pele e Extremidades', required: false, placeholder: 'Sem lesões, pulsos presentes, sem edema...' },
    ],
  },
  // BLOCO 9 — Hipóteses Diagnósticas
  {
    id: 'section_hipoteses', type: 'section', title: 'Hipóteses Diagnósticas',
    fields: [
      { id: 'f_hd_principais', type: 'textarea', label: 'Hipóteses principais', required: false, placeholder: 'CID-10 e descrição...' },
      { id: 'f_hd_diferenciais', type: 'textarea', label: 'Diagnósticos diferenciais', required: false, placeholder: 'Liste as hipóteses diferenciais...' },
    ],
  },
  // BLOCO 10 — Plano / Conduta
  {
    id: 'section_conduta', type: 'section', title: 'Plano / Conduta',
    fields: [
      { id: 'f_pc_exames', type: 'textarea', label: 'Exames solicitados', required: false, placeholder: 'Hemograma, glicemia, ECG...' },
      { id: 'f_pc_prescricao_orientacoes', type: 'textarea', label: 'Prescrição e Orientações', required: false, placeholder: 'Prescrições, orientações gerais...' },
      { id: 'f_pc_encaminhamentos', type: 'textarea', label: 'Encaminhamentos', required: false, placeholder: 'Especialidades, exames de imagem...' },
      { id: 'f_pc_retorno', type: 'text', label: 'Retorno', required: false, placeholder: 'Ex: em 15 dias, em 1 mês' },
      { id: 'f_pc_sinais_alarme', type: 'textarea', label: 'Sinais de alarme', required: false, placeholder: 'Orientar o paciente a retornar se...' },
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
