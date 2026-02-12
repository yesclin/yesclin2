/**
 * Modelo Oficial de Anamnese — Clínica Geral (Padrão Médico)
 * 
 * Baseado no modelo técnico de 13 pontos utilizado na prática médica.
 * Seções 1-10 são cobertas aqui (Identificação a ROS).
 * Seções 11-13 (Exame Físico, Hipótese Diagnóstica, Plano) 
 * já existem como blocos separados no prontuário.
 * 
 * Regras:
 * - is_system = true → não pode ser excluído
 * - Pode ser clonado para edição pela clínica
 * - IMC calculado automaticamente a partir de peso e altura
 * - Não altera prontuários já salvos
 * - Exclusivo para Clínica Geral
 */

import type { CampoAnamnese } from '@/hooks/prontuario/estetica/anamneseTemplates';

export type TipoAnamneseClinicaGeral = 'anamnese_clinica_geral_padrao';

export interface TemplateAnamneseClinicaGeral {
  id: TipoAnamneseClinicaGeral;
  nome: string;
  descricao: string;
  icon: string;
  is_system: boolean;
  specialty: 'clinica_geral';
  secoes: SecaoAnamnese[];
}

export interface SecaoAnamnese {
  id: string;
  titulo: string;
  descricao?: string;
  icon: string;
  /** Maps to a direct column in patient_anamneses (legacy compat) */
  legacyColumn?: string;
  campos: CampoAnamnese[];
}

// ─── TEMPLATE OFICIAL ────────────────────────────────────────────────

export const ANAMNESE_CLINICA_GERAL_TEMPLATE: TemplateAnamneseClinicaGeral = {
  id: 'anamnese_clinica_geral_padrao',
  nome: 'Anamnese Clínica Geral – Padrão Médico',
  descricao: 'Modelo completo de anamnese seguindo o padrão técnico de 13 pontos da prática médica',
  icon: 'Stethoscope',
  is_system: true,
  specialty: 'clinica_geral',
  secoes: [
    // ── 1. IDENTIFICAÇÃO ──────────────────────────────────────────
    {
      id: 'identificacao',
      titulo: '1. Identificação do Paciente',
      descricao: 'Dados complementares à ficha cadastral',
      icon: 'UserCircle',
      campos: [
        { id: 'estado_civil', label: 'Estado Civil', type: 'select', options: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Outro'], section: 'Identificação' },
        { id: 'profissao', label: 'Profissão', type: 'text', placeholder: 'Profissão atual do paciente', section: 'Identificação' },
        { id: 'naturalidade', label: 'Naturalidade / Procedência', type: 'text', placeholder: 'Cidade e estado de origem', section: 'Identificação' },
        { id: 'convenio', label: 'Convênio', type: 'text', placeholder: 'Nome do convênio (se houver)', section: 'Identificação' },
      ],
    },

    // ── 2. QUEIXA PRINCIPAL (QP) ──────────────────────────────────
    {
      id: 'queixa_principal',
      titulo: '2. Queixa Principal (QP)',
      descricao: 'Motivo da consulta, descrito com as palavras do paciente',
      icon: 'MessageSquare',
      legacyColumn: 'queixa_principal',
      campos: [
        { id: 'qp_descricao', label: 'Queixa Principal', type: 'textarea', placeholder: 'Ex: "Dor no peito há 2 dias"', required: true, section: 'QP' },
      ],
    },

    // ── 3. HISTÓRIA DA DOENÇA ATUAL (HDA) ─────────────────────────
    {
      id: 'historia_doenca_atual',
      titulo: '3. História da Doença Atual (HDA)',
      descricao: 'Descrição cronológica e detalhada usando método OPQRST',
      icon: 'Clock',
      legacyColumn: 'historia_doenca_atual',
      campos: [
        // OPQRST
        { id: 'hda_onset', label: 'O – Início (Onset)', type: 'textarea', placeholder: 'Quando começou? O que estava fazendo?', section: 'OPQRST' },
        { id: 'hda_provocation', label: 'P – Fatores de Piora / Melhora (Provocation)', type: 'textarea', placeholder: 'O que piora? O que melhora?', section: 'OPQRST' },
        { id: 'hda_quality', label: 'Q – Qualidade (Quality)', type: 'textarea', placeholder: 'Tipo da dor/sintoma: pontada, queimação, pressão, cólica...', section: 'OPQRST' },
        { id: 'hda_radiation', label: 'R – Irradiação (Radiation)', type: 'textarea', placeholder: 'Irradia para algum lugar?', section: 'OPQRST' },
        { id: 'hda_severity', label: 'S – Intensidade (Severity)', type: 'select', options: ['0 - Sem dor', '1', '2', '3', '4', '5 - Moderada', '6', '7', '8', '9', '10 - Insuportável'], section: 'OPQRST' },
        { id: 'hda_time', label: 'T – Tempo / Duração (Time)', type: 'textarea', placeholder: 'Quanto tempo dura? Frequência? Contínuo ou intermitente?', section: 'OPQRST' },
        // Complementares
        { id: 'hda_evolucao', label: 'Evolução', type: 'textarea', placeholder: 'Como evoluiu desde o início?', section: 'Complementar' },
        { id: 'hda_sintomas_associados', label: 'Sintomas Associados', type: 'textarea', placeholder: 'Outros sintomas relacionados', section: 'Complementar' },
        { id: 'hda_tratamentos_previos', label: 'Tratamentos Já Realizados', type: 'textarea', placeholder: 'Medicações ou medidas já tentadas', section: 'Complementar' },
        { id: 'hda_impacto_funcional', label: 'Impacto Funcional', type: 'textarea', placeholder: 'Como afeta as atividades diárias?', section: 'Complementar' },
      ],
    },

    // ── 4. HISTÓRIA PATOLÓGICA PREGRESSA (HPP) ────────────────────
    {
      id: 'antecedentes_pessoais',
      titulo: '4. História Patológica Pregressa (HPP)',
      descricao: 'Doenças prévias, internações, cirurgias, transfusões e traumas',
      icon: 'BookOpen',
      legacyColumn: 'antecedentes_pessoais',
      campos: [
        { id: 'hpp_doencas_previas', label: 'Doenças Prévias', type: 'multiselect', options: ['HAS', 'DM tipo 1', 'DM tipo 2', 'Dislipidemia', 'Asma', 'DPOC', 'Hipotireoidismo', 'Hipertireoidismo', 'Depressão', 'Ansiedade', 'Epilepsia', 'AVC', 'IAM', 'ICC', 'IRC', 'Hepatite', 'HIV', 'Tuberculose', 'Câncer', 'Nenhuma', 'Outra'], section: 'HPP' },
        { id: 'hpp_doencas_obs', label: 'Detalhamento das Doenças', type: 'textarea', placeholder: 'Detalhes, data de diagnóstico, tratamento atual...', section: 'HPP' },
        { id: 'hpp_internacoes', label: 'Internações Anteriores', type: 'textarea', placeholder: 'Motivo, data e duração das internações', section: 'HPP' },
        { id: 'hpp_cirurgias', label: 'Cirurgias', type: 'textarea', placeholder: 'Procedimentos cirúrgicos realizados, datas', section: 'HPP' },
        { id: 'hpp_transfusoes', label: 'Transfusões Sanguíneas', type: 'radio', options: ['Sim', 'Não'], section: 'HPP' },
        { id: 'hpp_transfusoes_obs', label: 'Detalhes da Transfusão', type: 'text', placeholder: 'Quando e motivo', section: 'HPP' },
        { id: 'hpp_traumas', label: 'Traumas Relevantes', type: 'textarea', placeholder: 'Fraturas, TCE, acidentes...', section: 'HPP' },
      ],
    },

    // ── 5. HISTÓRIA FAMILIAR (HF) ────────────────────────────────
    {
      id: 'antecedentes_familiares',
      titulo: '5. História Familiar (HF)',
      descricao: 'Doenças hereditárias e histórico familiar',
      icon: 'Users',
      legacyColumn: 'antecedentes_familiares',
      campos: [
        { id: 'hf_doencas', label: 'Doenças Familiares', type: 'multiselect', options: ['HAS', 'DM', 'Câncer', 'Doença Cardiovascular', 'AVC', 'Doença Renal', 'Doença Pulmonar', 'Doença Autoimune', 'Doença Mental', 'Obesidade', 'Dislipidemia', 'Nenhuma relevante', 'Outra'], section: 'HF' },
        { id: 'hf_detalhes', label: 'Detalhamento', type: 'textarea', placeholder: 'Quem na família, idade de início, causa de óbito de familiares (se relevante)', section: 'HF' },
      ],
    },

    // ── 6. MEDICAMENTOS EM USO ────────────────────────────────────
    {
      id: 'medicamentos',
      titulo: '6. Medicamentos em Uso',
      descricao: 'Medicamentos contínuos e automedicação',
      icon: 'Pill',
      legacyColumn: 'medicamentos_uso_continuo',
      campos: [
        { id: 'med_lista', label: 'Medicamentos em Uso Contínuo', type: 'textarea', placeholder: 'Nome, dose, frequência e tempo de uso\nEx: Losartana 50mg, 1x/dia, há 3 anos', required: true, section: 'Medicamentos' },
        { id: 'med_automedicacao', label: 'Automedicação', type: 'textarea', placeholder: 'Medicamentos usados por conta própria, chás, suplementos...', section: 'Medicamentos' },
      ],
    },

    // ── 7. ALERGIAS ───────────────────────────────────────────────
    {
      id: 'alergias',
      titulo: '7. Alergias',
      descricao: 'Alergias medicamentosas, alimentares e ambientais',
      icon: 'AlertTriangle',
      legacyColumn: 'alergias',
      campos: [
        { id: 'alergias_medicamentosas', label: 'Alergias Medicamentosas', type: 'textarea', placeholder: 'Medicamento e tipo de reação apresentada', section: 'Alergias' },
        { id: 'alergias_alimentares', label: 'Alergias Alimentares', type: 'textarea', placeholder: 'Alimentos e tipo de reação', section: 'Alergias' },
        { id: 'alergias_ambientais', label: 'Alergias Ambientais', type: 'textarea', placeholder: 'Pólen, poeira, animais, látex...', section: 'Alergias' },
        { id: 'alergias_reacao', label: 'Tipo de Reação Apresentada', type: 'multiselect', options: ['Urticária', 'Angioedema', 'Anafilaxia', 'Broncoespasmo', 'Rash cutâneo', 'Náusea/Vômito', 'Nenhuma grave', 'Outra'], section: 'Alergias' },
      ],
    },

    // ── 8. HÁBITOS DE VIDA ────────────────────────────────────────
    {
      id: 'habitos_vida',
      titulo: '8. Hábitos de Vida',
      descricao: 'Tabagismo, etilismo, atividade física, alimentação, drogas e sono',
      icon: 'Activity',
      legacyColumn: 'habitos_vida',
      campos: [
        { id: 'hab_tabagismo', label: 'Tabagismo', type: 'select', options: ['Nunca fumou', 'Ex-tabagista', 'Fumante ativo'], section: 'Hábitos' },
        { id: 'hab_tabagismo_carga', label: 'Carga Tabágica', type: 'text', placeholder: 'Ex: 20 maços/ano', section: 'Hábitos' },
        { id: 'hab_etilismo', label: 'Etilismo', type: 'select', options: ['Não bebe', 'Social/Eventual', 'Moderado', 'Frequente/Abusivo', 'Ex-etilista'], section: 'Hábitos' },
        { id: 'hab_etilismo_detalhe', label: 'Frequência/Quantidade', type: 'text', placeholder: 'Ex: 2 cervejas nos fins de semana', section: 'Hábitos' },
        { id: 'hab_atividade_fisica', label: 'Atividade Física', type: 'select', options: ['Sedentário', 'Leve (1-2x/semana)', 'Moderada (3-4x/semana)', 'Intensa (5+x/semana)'], section: 'Hábitos' },
        { id: 'hab_atividade_tipo', label: 'Tipo de Atividade', type: 'text', placeholder: 'Caminhada, musculação, natação...', section: 'Hábitos' },
        { id: 'hab_alimentacao', label: 'Alimentação', type: 'textarea', placeholder: 'Padrão alimentar, restrições, dietas...', section: 'Hábitos' },
        { id: 'hab_drogas', label: 'Uso de Drogas Ilícitas', type: 'select', options: ['Nunca usou', 'Já usou (passado)', 'Uso atual'], section: 'Hábitos' },
        { id: 'hab_drogas_detalhe', label: 'Detalhes (se aplicável)', type: 'text', placeholder: 'Substância e frequência', section: 'Hábitos' },
        { id: 'hab_sono', label: 'Padrão de Sono', type: 'select', options: ['Bom (7-9h)', 'Insônia', 'Sono fragmentado', 'Sono excessivo', 'Apneia do sono'], section: 'Hábitos' },
        { id: 'hab_sono_detalhe', label: 'Detalhes do Sono', type: 'text', placeholder: 'Horas de sono, uso de medicação para dormir...', section: 'Hábitos' },
      ],
    },

    // ── 9. HISTÓRIA GINECOLÓGICA/OBSTÉTRICA ───────────────────────
    {
      id: 'historia_ginecologica',
      titulo: '9. História Ginecológica/Obstétrica',
      descricao: 'Quando aplicável',
      icon: 'Baby',
      legacyColumn: 'historia_ginecologica',
      campos: [
        { id: 'gin_aplicavel', label: 'Aplicável ao paciente?', type: 'radio', options: ['Sim', 'Não'], section: 'Ginecológica' },
        { id: 'gin_menarca', label: 'Menarca (idade)', type: 'text', placeholder: 'Idade da primeira menstruação', section: 'Ginecológica' },
        { id: 'gin_ciclo', label: 'Ciclo Menstrual', type: 'select', options: ['Regular', 'Irregular', 'Amenorreia', 'Menopausa', 'Não se aplica'], section: 'Ginecológica' },
        { id: 'gin_gestacoes', label: 'Gestações (G/P/A)', type: 'text', placeholder: 'Ex: G2P2A0 (2 gestações, 2 partos, 0 abortos)', section: 'Ginecológica' },
        { id: 'gin_dum', label: 'Data da Última Menstruação (DUM)', type: 'date', section: 'Ginecológica' },
        { id: 'gin_contraceptivo', label: 'Método Contraceptivo', type: 'select', options: ['Nenhum', 'ACO (pílula)', 'DIU cobre', 'DIU hormonal', 'Implante', 'Preservativo', 'Laqueadura', 'Vasectomia', 'Outro'], section: 'Ginecológica' },
      ],
    },

    // ── 10. REVISÃO DE SISTEMAS (ROS) ─────────────────────────────
    {
      id: 'revisao_sistemas',
      titulo: '10. Revisão de Sistemas (ROS)',
      descricao: 'Investigação ativa por sistemas',
      icon: 'LayoutList',
      legacyColumn: 'revisao_sistemas',
      campos: [
        { id: 'ros_geral', label: 'Geral', type: 'textarea', placeholder: 'Febre, perda de peso, fadiga, sudorese noturna...', section: 'ROS' },
        { id: 'ros_cardiovascular', label: 'Cardiovascular', type: 'textarea', placeholder: 'Dor torácica, palpitações, dispneia, edema MMII...', section: 'ROS' },
        { id: 'ros_respiratorio', label: 'Respiratório', type: 'textarea', placeholder: 'Tosse, expectoração, dispneia, sibilância...', section: 'ROS' },
        { id: 'ros_gastrointestinal', label: 'Gastrointestinal', type: 'textarea', placeholder: 'Náusea, vômito, dor abdominal, diarreia, constipação...', section: 'ROS' },
        { id: 'ros_geniturinario', label: 'Geniturinário', type: 'textarea', placeholder: 'Disúria, polaciúria, hematúria, incontinência...', section: 'ROS' },
        { id: 'ros_neurologico', label: 'Neurológico', type: 'textarea', placeholder: 'Cefaleia, tontura, convulsões, parestesias, fraqueza...', section: 'ROS' },
        { id: 'ros_endocrino', label: 'Endócrino', type: 'textarea', placeholder: 'Polidipsia, poliúria, intolerância ao calor/frio...', section: 'ROS' },
        { id: 'ros_musculoesqueletico', label: 'Musculoesquelético', type: 'textarea', placeholder: 'Artralgia, mialgia, rigidez, limitação de movimento...', section: 'ROS' },
        { id: 'ros_dermatologico', label: 'Dermatológico', type: 'textarea', placeholder: 'Lesões de pele, prurido, alterações ungueais/capilares...', section: 'ROS' },
        { id: 'ros_psiquiatrico', label: 'Psiquiátrico', type: 'textarea', placeholder: 'Humor, ansiedade, insônia, ideação suicida...', section: 'ROS' },
      ],
    },

    // ── DADOS ANTROPOMÉTRICOS (IMC automático) ────────────────────
    {
      id: 'dados_antropometricos',
      titulo: 'Dados Antropométricos',
      descricao: 'Peso, altura e IMC (calculado automaticamente)',
      icon: 'Ruler',
      campos: [
        { id: 'peso_kg', label: 'Peso (kg)', type: 'number', placeholder: 'Ex: 72.5', section: 'Antropometria' },
        { id: 'altura_cm', label: 'Altura (cm)', type: 'number', placeholder: 'Ex: 175', section: 'Antropometria' },
        // IMC is calculated automatically, not a user input
      ],
    },
  ],
};

// ─── HELPERS ────────────────────────────────────────────────────────

/** Get all fields flattened from the template */
export function getAllTemplateFields(): CampoAnamnese[] {
  return ANAMNESE_CLINICA_GERAL_TEMPLATE.secoes.flatMap(s => s.campos);
}

/** Get sections with their fields */
export function getSecoes(): SecaoAnamnese[] {
  return ANAMNESE_CLINICA_GERAL_TEMPLATE.secoes;
}

/** Calculate BMI from weight (kg) and height (cm) */
export function calculateIMC(pesoKg: number | null, alturaCm: number | null): { value: number; classification: string } | null {
  if (!pesoKg || !alturaCm || alturaCm <= 0) return null;
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);
  
  let classification = '';
  if (imc < 18.5) classification = 'Abaixo do peso';
  else if (imc < 25) classification = 'Peso normal';
  else if (imc < 30) classification = 'Sobrepeso';
  else if (imc < 35) classification = 'Obesidade grau I';
  else if (imc < 40) classification = 'Obesidade grau II';
  else classification = 'Obesidade grau III';

  return { value: Math.round(imc * 100) / 100, classification };
}

/** Map structured data back to legacy columns for backward compatibility */
export function mapStructuredToLegacy(data: Record<string, unknown>): Record<string, string> {
  const legacy: Record<string, string> = {};

  // QP
  if (data.qp_descricao) legacy.queixa_principal = String(data.qp_descricao);

  // HDA - concatenate OPQRST fields
  const hdaFields = ['hda_onset', 'hda_provocation', 'hda_quality', 'hda_radiation', 'hda_severity', 'hda_time', 'hda_evolucao', 'hda_sintomas_associados', 'hda_tratamentos_previos', 'hda_impacto_funcional'];
  const hdaLabels: Record<string, string> = {
    hda_onset: 'Início', hda_provocation: 'Fatores piora/melhora', hda_quality: 'Qualidade',
    hda_radiation: 'Irradiação', hda_severity: 'Intensidade', hda_time: 'Duração',
    hda_evolucao: 'Evolução', hda_sintomas_associados: 'Sintomas associados',
    hda_tratamentos_previos: 'Tratamentos prévios', hda_impacto_funcional: 'Impacto funcional',
  };
  const hdaParts = hdaFields.filter(f => data[f]).map(f => `${hdaLabels[f]}: ${data[f]}`);
  if (hdaParts.length > 0) legacy.historia_doenca_atual = hdaParts.join('\n');

  // HPP
  const hppParts: string[] = [];
  if (data.hpp_doencas_previas) hppParts.push(`Doenças: ${(data.hpp_doencas_previas as string[]).join(', ')}`);
  if (data.hpp_doencas_obs) hppParts.push(String(data.hpp_doencas_obs));
  if (data.hpp_internacoes) hppParts.push(`Internações: ${data.hpp_internacoes}`);
  if (data.hpp_cirurgias) hppParts.push(`Cirurgias: ${data.hpp_cirurgias}`);
  if (data.hpp_transfusoes) hppParts.push(`Transfusões: ${data.hpp_transfusoes}`);
  if (data.hpp_traumas) hppParts.push(`Traumas: ${data.hpp_traumas}`);
  if (hppParts.length > 0) legacy.antecedentes_pessoais = hppParts.join('\n');

  // HF
  const hfParts: string[] = [];
  if (data.hf_doencas) hfParts.push(`Doenças familiares: ${(data.hf_doencas as string[]).join(', ')}`);
  if (data.hf_detalhes) hfParts.push(String(data.hf_detalhes));
  if (hfParts.length > 0) legacy.antecedentes_familiares = hfParts.join('\n');

  // Medicamentos
  const medParts: string[] = [];
  if (data.med_lista) medParts.push(String(data.med_lista));
  if (data.med_automedicacao) medParts.push(`Automedicação: ${data.med_automedicacao}`);
  if (medParts.length > 0) legacy.medicamentos_uso_continuo = medParts.join('\n');

  // Alergias
  const alParts: string[] = [];
  if (data.alergias_medicamentosas) alParts.push(`Medicamentosas: ${data.alergias_medicamentosas}`);
  if (data.alergias_alimentares) alParts.push(`Alimentares: ${data.alergias_alimentares}`);
  if (data.alergias_ambientais) alParts.push(`Ambientais: ${data.alergias_ambientais}`);
  if (data.alergias_reacao) alParts.push(`Reações: ${(data.alergias_reacao as string[]).join(', ')}`);
  if (alParts.length > 0) legacy.alergias = alParts.join('\n');

  // Hábitos
  const habParts: string[] = [];
  if (data.hab_tabagismo) habParts.push(`Tabagismo: ${data.hab_tabagismo}${data.hab_tabagismo_carga ? ` (${data.hab_tabagismo_carga})` : ''}`);
  if (data.hab_etilismo) habParts.push(`Etilismo: ${data.hab_etilismo}${data.hab_etilismo_detalhe ? ` (${data.hab_etilismo_detalhe})` : ''}`);
  if (data.hab_atividade_fisica) habParts.push(`Atividade física: ${data.hab_atividade_fisica}${data.hab_atividade_tipo ? ` - ${data.hab_atividade_tipo}` : ''}`);
  if (data.hab_alimentacao) habParts.push(`Alimentação: ${data.hab_alimentacao}`);
  if (data.hab_drogas) habParts.push(`Drogas: ${data.hab_drogas}${data.hab_drogas_detalhe ? ` (${data.hab_drogas_detalhe})` : ''}`);
  if (data.hab_sono) habParts.push(`Sono: ${data.hab_sono}${data.hab_sono_detalhe ? ` (${data.hab_sono_detalhe})` : ''}`);
  if (habParts.length > 0) legacy.habitos_vida = habParts.join('\n');

  return legacy;
}
