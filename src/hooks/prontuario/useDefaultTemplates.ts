import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { TemplateType } from './useTemplates';
import type { FieldType } from './useFields';
import type { Json } from '@/integrations/supabase/types';

interface DefaultField {
  label: string;
  field_type: FieldType;
  placeholder?: string;
  options?: string[];
  is_required: boolean;
}

interface DefaultTemplate {
  name: string;
  type: TemplateType;
  description: string;
  fields: DefaultField[];
}

// Campos padrão para Clínica Médica Geral
const GENERAL_MEDICINE_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Anamnese Clínica Geral',
    type: 'anamnese',
    description: 'Modelo padrão de anamnese para clínica médica geral',
    fields: [
      { label: 'Queixa Principal', field_type: 'textarea', placeholder: 'Descreva a queixa principal do paciente', is_required: true },
      { label: 'História da Doença Atual', field_type: 'textarea', placeholder: 'Descreva a evolução da doença atual', is_required: true },
      { label: 'Antecedentes Pessoais', field_type: 'textarea', placeholder: 'Doenças prévias, cirurgias, internações', is_required: false },
      { label: 'Antecedentes Familiares', field_type: 'textarea', placeholder: 'Doenças na família (pais, irmãos, avós)', is_required: false },
      { label: 'Medicamentos em Uso', field_type: 'textarea', placeholder: 'Liste os medicamentos em uso atual', is_required: false },
      { label: 'Alergias', field_type: 'textarea', placeholder: 'Alergias conhecidas (medicamentos, alimentos, etc)', is_required: false },
    ],
  },
  {
    name: 'Sinais Vitais',
    type: 'vital_signs',
    description: 'Registro de sinais vitais do paciente',
    fields: [
      { label: 'Pressão Arterial Sistólica (mmHg)', field_type: 'number', placeholder: 'Ex: 120', is_required: true },
      { label: 'Pressão Arterial Diastólica (mmHg)', field_type: 'number', placeholder: 'Ex: 80', is_required: true },
      { label: 'Frequência Cardíaca (bpm)', field_type: 'number', placeholder: 'Ex: 72', is_required: true },
      { label: 'Temperatura (°C)', field_type: 'number', placeholder: 'Ex: 36.5', is_required: false },
      { label: 'Saturação O2 (%)', field_type: 'number', placeholder: 'Ex: 98', is_required: false },
      { label: 'Frequência Respiratória (irpm)', field_type: 'number', placeholder: 'Ex: 16', is_required: false },
      { label: 'Peso (kg)', field_type: 'number', placeholder: 'Ex: 70', is_required: false },
      { label: 'Altura (cm)', field_type: 'number', placeholder: 'Ex: 170', is_required: false },
    ],
  },
  {
    name: 'Diagnóstico',
    type: 'diagnosis',
    description: 'Registro de hipótese diagnóstica e diagnóstico CID',
    fields: [
      { label: 'Hipótese Diagnóstica', field_type: 'textarea', placeholder: 'Descreva a hipótese diagnóstica', is_required: true },
      { label: 'Código CID-10', field_type: 'text', placeholder: 'Ex: J06.9', is_required: false },
      { label: 'Descrição do Diagnóstico', field_type: 'textarea', placeholder: 'Descrição detalhada do diagnóstico', is_required: false },
      { label: 'Diagnósticos Secundários', field_type: 'textarea', placeholder: 'Outros diagnósticos relacionados', is_required: false },
    ],
  },
  {
    name: 'Conduta / Plano',
    type: 'conduct',
    description: 'Plano terapêutico e orientações ao paciente',
    fields: [
      { label: 'Conduta', field_type: 'textarea', placeholder: 'Descreva a conduta médica', is_required: true },
      { label: 'Prescrições', field_type: 'textarea', placeholder: 'Medicamentos prescritos', is_required: false },
      { label: 'Exames Solicitados', field_type: 'textarea', placeholder: 'Exames laboratoriais/imagem solicitados', is_required: false },
      { label: 'Orientações ao Paciente', field_type: 'textarea', placeholder: 'Orientações gerais para o paciente', is_required: false },
      { label: 'Retorno', field_type: 'text', placeholder: 'Prazo para retorno (ex: 7 dias)', is_required: false },
    ],
  },
];

// Campos padrão para Odontologia
const DENTISTRY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Odontograma',
    type: 'odontogram',
    description: 'Registro visual do estado de cada dente',
    fields: [
      { label: 'Odontograma', field_type: 'odontogram', placeholder: 'Clique para editar o odontograma', is_required: true },
      { label: 'Histórico Odontológico', field_type: 'textarea', placeholder: 'Tratamentos anteriores, extrações, próteses', is_required: false },
      { label: 'Observações Gerais', field_type: 'textarea', placeholder: 'Notas sobre a arcada dentária', is_required: false },
    ],
  },
  {
    name: 'Procedimento por Dente',
    type: 'tooth_procedure',
    description: 'Registro de procedimentos realizados por dente/região',
    fields: [
      { label: 'Dente / Região', field_type: 'tooth_select', placeholder: 'Selecione o dente ou região', is_required: true },
      { label: 'Procedimento Realizado', field_type: 'textarea', placeholder: 'Descreva o procedimento (ex: restauração, extração)', is_required: true },
      { label: 'Material Utilizado', field_type: 'text', placeholder: 'Ex: Resina composta, amálgama', is_required: false },
      { label: 'Dor (0-10)', field_type: 'select', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], is_required: false },
      { label: 'Observações Clínicas', field_type: 'textarea', placeholder: 'Anotações adicionais', is_required: false },
    ],
  },
  {
    name: 'Sessão Odontológica',
    type: 'dental_session',
    description: 'Evolução por sessão de atendimento odontológico',
    fields: [
      { label: 'Queixa do Paciente', field_type: 'textarea', placeholder: 'O que o paciente relatou nesta sessão', is_required: false },
      { label: 'Procedimentos Realizados', field_type: 'textarea', placeholder: 'Liste os procedimentos desta sessão', is_required: true },
      { label: 'Dentes Tratados', field_type: 'tooth_select', placeholder: 'Selecione os dentes trabalhados', is_required: false },
      { label: 'Anestesia Utilizada', field_type: 'text', placeholder: 'Tipo e quantidade de anestésico', is_required: false },
      { label: 'Evolução / Resposta ao Tratamento', field_type: 'textarea', placeholder: 'Como o paciente respondeu ao tratamento', is_required: false },
      { label: 'Próximos Passos', field_type: 'textarea', placeholder: 'O que será feito na próxima sessão', is_required: false },
      { label: 'Observações Clínicas', field_type: 'textarea', placeholder: 'Anotações adicionais', is_required: false },
    ],
  },
];

// Campos padrão para Psicologia
const PSYCHOLOGY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Registro de Sessão',
    type: 'session_record',
    description: 'Documentação de sessão de psicoterapia',
    fields: [
      { label: 'Tipo de Sessão', field_type: 'select', options: ['Individual', 'Casal', 'Família', 'Grupo', 'Online', 'Primeira consulta', 'Retorno'], is_required: true },
      { label: 'Relato do Paciente', field_type: 'textarea', placeholder: 'Transcreva os principais relatos e narrativas do paciente', is_required: true },
      { label: 'Observações do Profissional', field_type: 'textarea', placeholder: 'Suas observações clínicas sobre a sessão', is_required: true },
      { label: 'Emoções Predominantes', field_type: 'multiselect', options: ['Ansiedade', 'Tristeza', 'Raiva', 'Medo', 'Alegria', 'Culpa', 'Vergonha', 'Frustração', 'Esperança', 'Confusão', 'Alívio', 'Indiferença'], is_required: false },
      { label: 'Temas Abordados', field_type: 'textarea', placeholder: 'Principais temas discutidos na sessão', is_required: false },
      { label: 'Técnicas Utilizadas', field_type: 'textarea', placeholder: 'Técnicas ou intervenções aplicadas', is_required: false },
    ],
  },
  {
    name: 'Objetivos Terapêuticos',
    type: 'therapeutic_goals',
    description: 'Definição e acompanhamento de objetivos do tratamento',
    fields: [
      { label: 'Objetivo Principal', field_type: 'textarea', placeholder: 'Descreva o objetivo principal do tratamento', is_required: true },
      { label: 'Objetivos Secundários', field_type: 'textarea', placeholder: 'Outros objetivos a serem alcançados', is_required: false },
      { label: 'Indicadores de Progresso', field_type: 'textarea', placeholder: 'Como será medido o progresso', is_required: false },
      { label: 'Prazo Estimado', field_type: 'text', placeholder: 'Ex: 3 meses, 10 sessões', is_required: false },
      { label: 'Status do Objetivo', field_type: 'select', options: ['Em andamento', 'Parcialmente atingido', 'Atingido', 'Reavaliando', 'Suspenso'], is_required: false },
    ],
  },
  {
    name: 'Plano Terapêutico',
    type: 'therapeutic_plan',
    description: 'Planejamento do tratamento psicológico',
    fields: [
      { label: 'Diagnóstico / Hipótese Clínica', field_type: 'textarea', placeholder: 'Impressão diagnóstica ou hipótese clínica', is_required: true },
      { label: 'Abordagem Terapêutica', field_type: 'select', options: ['Terapia Cognitivo-Comportamental', 'Psicanálise', 'Humanista', 'Sistêmica', 'Gestalt', 'EMDR', 'Terapia Breve', 'Outra'], is_required: true },
      { label: 'Plano de Tratamento', field_type: 'textarea', placeholder: 'Descreva o plano terapêutico proposto', is_required: true },
      { label: 'Frequência das Sessões', field_type: 'select', options: ['Semanal', 'Quinzenal', 'Mensal', 'Sob demanda'], is_required: false },
      { label: 'Evolução Clínica', field_type: 'textarea', placeholder: 'Resumo da evolução do paciente', is_required: false },
      { label: 'Encaminhamentos', field_type: 'textarea', placeholder: 'Encaminhamentos para outros profissionais, se necessário', is_required: false },
    ],
  },
];

// Campos padrão para Psiquiatria
const PSYCHIATRY_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Diagnóstico (CID/DSM)',
    type: 'diagnosis_dsm',
    description: 'Registro de diagnóstico psiquiátrico com CID e DSM',
    fields: [
      { label: 'Diagnóstico Principal (CID-10)', field_type: 'text', placeholder: 'Ex: F32.1 - Episódio depressivo moderado', is_required: true },
      { label: 'Diagnóstico (DSM-5)', field_type: 'text', placeholder: 'Ex: Transtorno Depressivo Maior', is_required: false },
      { label: 'Diagnósticos Secundários', field_type: 'textarea', placeholder: 'Comorbidades e diagnósticos associados', is_required: false },
      { label: 'Sintomas Atuais', field_type: 'textarea', placeholder: 'Descreva os sintomas apresentados', is_required: true },
      { label: 'Escalas Psiquiátricas Aplicadas', field_type: 'textarea', placeholder: 'Ex: HAM-D: 18, BAI: 25', is_required: false },
      { label: 'Gravidade do Quadro', field_type: 'select', options: ['Leve', 'Moderado', 'Grave', 'Grave com sintomas psicóticos', 'Em remissão'], is_required: false },
    ],
  },
  {
    name: 'Prescrição Medicamentosa',
    type: 'psychiatric_prescription',
    description: 'Registro de medicação psiquiátrica prescrita',
    fields: [
      { label: 'Medicação Prescrita', field_type: 'text', placeholder: 'Nome do medicamento', is_required: true },
      { label: 'Dosagem', field_type: 'text', placeholder: 'Ex: 50mg', is_required: true },
      { label: 'Posologia', field_type: 'text', placeholder: 'Ex: 1x ao dia, pela manhã', is_required: true },
      { label: 'Classe do Medicamento', field_type: 'select', options: ['Antidepressivo', 'Ansiolítico', 'Antipsicótico', 'Estabilizador de Humor', 'Hipnótico', 'Psicoestimulante', 'Outro'], is_required: false },
      { label: 'Duração do Tratamento', field_type: 'text', placeholder: 'Ex: 30 dias, uso contínuo', is_required: false },
      { label: 'Orientações ao Paciente', field_type: 'textarea', placeholder: 'Instruções especiais sobre o uso', is_required: false },
    ],
  },
  {
    name: 'Evolução de Sintomas',
    type: 'symptom_evolution',
    description: 'Acompanhamento da evolução dos sintomas psiquiátricos',
    fields: [
      { label: 'Sintomas Relatados', field_type: 'textarea', placeholder: 'Sintomas referidos pelo paciente', is_required: true },
      { label: 'Sintomas Observados', field_type: 'textarea', placeholder: 'Sintomas observados durante a consulta', is_required: false },
      { label: 'Comparação com Consulta Anterior', field_type: 'select', options: ['Melhora significativa', 'Melhora parcial', 'Estável', 'Piora parcial', 'Piora significativa'], is_required: false },
      { label: 'Efeitos Colaterais', field_type: 'textarea', placeholder: 'Efeitos adversos relatados', is_required: false },
      { label: 'Adesão ao Tratamento', field_type: 'select', options: ['Boa', 'Regular', 'Irregular', 'Abandonou'], is_required: false },
      { label: 'Evolução do Quadro', field_type: 'textarea', placeholder: 'Resumo da evolução clínica', is_required: true },
    ],
  },
  {
    name: 'Histórico de Medicamentos',
    type: 'medication_history',
    description: 'Registro do histórico de medicações utilizadas',
    fields: [
      { label: 'Medicamento', field_type: 'text', placeholder: 'Nome do medicamento', is_required: true },
      { label: 'Período de Uso', field_type: 'text', placeholder: 'Ex: Jan/2023 a Jun/2023', is_required: false },
      { label: 'Dose Máxima Utilizada', field_type: 'text', placeholder: 'Ex: 100mg/dia', is_required: false },
      { label: 'Motivo da Suspensão', field_type: 'select', options: ['Melhora clínica', 'Ineficácia', 'Efeitos colaterais', 'Decisão do paciente', 'Troca de medicação', 'Outro'], is_required: false },
      { label: 'Efeitos Colaterais Apresentados', field_type: 'textarea', placeholder: 'Descreva os efeitos adversos', is_required: false },
      { label: 'Resposta ao Tratamento', field_type: 'select', options: ['Excelente', 'Boa', 'Parcial', 'Sem resposta', 'Piora'], is_required: false },
    ],
  },
];

// Combina todos os templates padrão
const ALL_DEFAULT_TEMPLATES: DefaultTemplate[] = [
  ...GENERAL_MEDICINE_TEMPLATES,
  ...DENTISTRY_TEMPLATES,
  ...PSYCHOLOGY_TEMPLATES,
  ...PSYCHIATRY_TEMPLATES,
];

export function useDefaultTemplates() {
  const { clinic } = useClinicData();
  const [importing, setImporting] = useState(false);

  const importDefaultTemplates = useCallback(async (): Promise<boolean> => {
    if (!clinic?.id) {
      toast.error('Clínica não encontrada');
      return false;
    }

    setImporting(true);
    let successCount = 0;

    try {
      for (const template of ALL_DEFAULT_TEMPLATES) {
        // Check if template with same name and type already exists
        const { data: existing } = await supabase
          .from('medical_record_templates')
          .select('id')
          .eq('clinic_id', clinic.id)
          .eq('type', template.type)
          .eq('name', template.name)
          .maybeSingle();

        if (existing) {
          // Template already exists, skip
          continue;
        }

        // Create template
        const { data: newTemplate, error: templateError } = await supabase
          .from('medical_record_templates')
          .insert({
            clinic_id: clinic.id,
            name: template.name,
            type: template.type,
            description: template.description,
            scope: 'system',
            is_default: true,
            is_active: true,
            is_system: false,
          })
          .select()
          .single();

        if (templateError) {
          console.error('Error creating template:', templateError);
          continue;
        }

        // Create fields
        const fieldsToInsert = template.fields.map((field, index) => ({
          template_id: newTemplate.id,
          label: field.label,
          field_type: field.field_type,
          placeholder: field.placeholder || null,
          options: field.options ? (field.options as unknown as Json) : null,
          is_required: field.is_required,
          field_order: index + 1,
        }));

        const { error: fieldsError } = await supabase
          .from('medical_record_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('Error creating fields:', fieldsError);
          // Rollback template
          await supabase.from('medical_record_templates').delete().eq('id', newTemplate.id);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} modelo(s) importado(s) com sucesso!`);
        return true;
      } else {
        toast.info('Todos os modelos já existem ou nenhum foi importado.');
        return false;
      }
    } catch (err) {
      console.error('Error importing templates:', err);
      toast.error('Erro ao importar modelos padrão');
      return false;
    } finally {
      setImporting(false);
    }
  }, [clinic?.id]);

  const getAvailableTemplateCount = useCallback(async (): Promise<number> => {
    if (!clinic?.id) return 0;

    let count = 0;
    for (const template of ALL_DEFAULT_TEMPLATES) {
      const { data: existing } = await supabase
        .from('medical_record_templates')
        .select('id')
        .eq('clinic_id', clinic.id)
        .eq('type', template.type)
        .eq('name', template.name)
        .maybeSingle();

      if (!existing) count++;
    }
    return count;
  }, [clinic?.id]);

  return {
    importing,
    importDefaultTemplates,
    getAvailableTemplateCount,
    totalDefaultTemplates: ALL_DEFAULT_TEMPLATES.length,
  };
}
