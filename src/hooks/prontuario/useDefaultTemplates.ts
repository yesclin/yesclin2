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
      for (const template of GENERAL_MEDICINE_TEMPLATES) {
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
    for (const template of GENERAL_MEDICINE_TEMPLATES) {
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
    totalDefaultTemplates: GENERAL_MEDICINE_TEMPLATES.length,
  };
}
